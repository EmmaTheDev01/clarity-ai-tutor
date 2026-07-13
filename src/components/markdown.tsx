import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  // Simple custom markdown line parser to avoid external package overhead or React 19 incompatibilities.
  const parseMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];

    const isLaTeX = (str: string): boolean => {
      const latexPattern = /\\[a-zA-Z]+|\\mathbf|\\{N-1\}|\^T|\^\{|\\Sigma|\\mu|\\frac|\\left|\\right|_\{|\\mathbf/i;
      return latexPattern.test(str);
    };

    const formatInline = (lineText: string): React.ReactNode[] => {
      // Parse inline blocks: code, bold, math, italics
      const regex = /(`[^`]+`|\*\*[^*]+\*\*|\$[^\$]+\$|\*[^*]+\*)/g;
      const subTokens = lineText.split(regex);
      
      return subTokens.map((token, i) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return <strong key={i} className="font-black text-foreground">{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("*") && token.endsWith("*")) {
          return <em key={i} className="italic font-semibold text-foreground/90">{token.slice(1, -1)}</em>;
        }
        if (token.startsWith("`") && token.endsWith("`")) {
          return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{token.slice(1, -1)}</code>;
        }
        if (token.startsWith("$") && token.endsWith("$")) {
          return <span key={i} className="font-serif italic text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs select-all">{token.slice(1, -1)}</span>;
        }
        if (isLaTeX(token)) {
          return <span key={i} className="font-serif italic text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs select-all">{token}</span>;
        }
        return token;
      });
    };

    // Split text by $$ to separate block math equations from general text content
    const blocks = text.split("$$");
    
    blocks.forEach((block, bIdx) => {
      const isMathBlock = bIdx % 2 === 1;
      if (isMathBlock) {
        elements.push(
          <div
            key={`mathblock-${bIdx}`}
            className="my-4 py-4 px-6 text-center overflow-x-auto font-serif text-base bg-primary/5 text-primary rounded-2xl border border-primary/10 select-all whitespace-pre-wrap shadow-sm leading-relaxed tracking-wide min-h-[3rem] flex items-center justify-center"
          >
            {block.trim()}
          </div>
        );
      } else {
        const lines = block.split("\n");
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBlockLines: string[] = [];

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          const key = `blk-${bIdx}-ln-${idx}`;

          // Code block toggle (```)
          if (trimmed.startsWith("```")) {
            if (inCodeBlock) {
              elements.push(
                <pre
                  key={`code-${key}`}
                  className="p-4 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre leading-normal border border-border my-3 select-all"
                >
                  <code>{codeBlockLines.join("\n")}</code>
                </pre>
              );
              codeBlockLines = [];
              inCodeBlock = false;
            } else {
              if (inList) {
                elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
                listItems = [];
                inList = false;
              }
              inCodeBlock = true;
            }
            return;
          }

          if (inCodeBlock) {
            codeBlockLines.push(line);
            return;
          }

          // Horizontal rule
          if (trimmed === "---") {
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            elements.push(<hr key={`hr-${key}`} className="my-4 border-t border-border/60" />);
            return;
          }

          // Headings (H1 to H6)
          const matchHeader = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (matchHeader) {
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            const level = matchHeader[1].length;
            const textContent = matchHeader[2];
            const headerClasses = [
              "text-lg font-black text-foreground mt-6 mb-3",
              "text-base font-bold text-foreground mt-5 mb-2.5",
              "text-sm font-extrabold uppercase tracking-wider text-foreground mt-4 mb-2",
              "text-xs font-black uppercase tracking-wider text-foreground/90 mt-4 mb-1.5",
              "text-xs font-bold text-foreground/80 mt-3.5 mb-1",
              "text-xs font-medium text-foreground/75 mt-3 mb-1"
            ];
            const ClassName = headerClasses[level - 1] || headerClasses[2];
            const Tag = `h${level}` as any;
            elements.push(React.createElement(Tag, { key: `h-${key}`, className: ClassName }, formatInline(textContent)));
            return;
          }

          // Numbered Lists (e.g. 1. Item)
          const matchNumberedList = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (matchNumberedList) {
            inList = true;
            listItems.push(
              <li key={`li-${key}`} className="text-xs leading-relaxed text-foreground list-none flex items-start gap-1">
                <span className="font-semibold text-primary shrink-0">{matchNumberedList[1]}.</span>
                <span className="flex-1">{formatInline(matchNumberedList[2])}</span>
              </li>
            );
            return;
          }

          // Bullet Lists (including indented sub-bullets like "    * Example:")
          const bulletMatch = line.match(/^(\s*)[*\-]\s+(.*)/);
          if (bulletMatch) {
            inList = true;
            const indentLevel = Math.floor(bulletMatch[1].length / 2);
            const marginLeft = indentLevel > 0 ? `${indentLevel * 1}rem` : undefined;
            listItems.push(
              <li key={`li-${key}`} className="text-xs leading-relaxed text-foreground list-disc list-inside" style={marginLeft ? { marginLeft } : undefined}>
                {formatInline(bulletMatch[2])}
              </li>
            );
            return;
          }

          // Blockquotes
          if (trimmed.startsWith("> ")) {
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            elements.push(
              <blockquote key={`quote-${key}`} className="border-l-2 border-primary bg-elevated/40 px-3 py-1.5 my-3 rounded text-xs text-muted-foreground italic">
                {formatInline(trimmed.substring(2))}
              </blockquote>
            );
            return;
          }

          // Empty line
          if (trimmed === "") {
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            return;
          }

          // Regular paragraph
          if (inList) {
            elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
            listItems = [];
            inList = false;
          }

          elements.push(
            <p key={`p-${key}`} className="text-xs leading-relaxed text-foreground mb-3 break-words">
              {formatInline(line)}
            </p>
          );
        });

        if (inList) {
          elements.push(<ul key={`list-${bIdx}-end`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
        }

        if (inCodeBlock && codeBlockLines.length > 0) {
          elements.push(
            <pre
              key={`code-${bIdx}-unclosed`}
              className="p-4 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre leading-normal border border-border my-3 select-all"
            >
              <code>{codeBlockLines.join("\n")}</code>
            </pre>
          );
        }
      }
    });

    return elements;
  };

  return <div className={`prose prose-sm max-w-none text-foreground ${className}`}>{parseMarkdown(content)}</div>;
};
