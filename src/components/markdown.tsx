import React from "react";

export function cleanLatexMathSyntax(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // 1. Fix nested \mathbf${$\Sigma$}_{ML}^{(N)}. -> $\mathbf{\Sigma}_{ML}^{(N)}$.
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^\{\(([a-zA-Z0-9\-]+)\)\}\$\.?/g, (match) => {
    const hasDot = match.endsWith(".");
    const m = match.match(/_\{([a-zA-Z0-9]+)\}\^\{\(([a-zA-Z0-9\-]+)\)\}/);
    if (m) {
      return `$\\mathbf{\\Sigma}_{${m[1]}}^{(${m[2]})}$${hasDot ? "." : ""}`;
    }
    return match;
  });

  // Simple version: \mathbf${$\Sigma$}_{ML}^{(N-1)}$
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^\{\(([a-zA-Z0-9\-]+)\)\}\$/g, '$\\mathbf{\\Sigma}_{$1}^{($2)}$');
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^([a-zA-Z0-9()\-]+)\$/g, '$\\mathbf{\\Sigma}_{$1}^{$2}$');
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\$/g, '$\\mathbf{\\Sigma}_{$1}$');
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\$/g, '$\\mathbf{\\Sigma}$');

  // Let's replace raw un-bracketed occurrences of \mathbf${$\Sigma$}_{ML}^{(N-1)} (without trailing $)
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^\{\(([a-zA-Z0-9\-]+)\)\}/g, '$\\mathbf{\\Sigma}_{$1}^{($2)}$');
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^([a-zA-Z0-9()\-]+)/g, '$\\mathbf{\\Sigma}_{$1}^{$2}$');

  // 2. \ln$ p(x_N | $\mu$, $\mathbf${$\Sigma$})$ -> $\ln p(x_N | \mu, \mathbf{\Sigma})$
  cleaned = cleaned.replace(/\\ln\$\s*p\(x_N\s*\|\s*\$\\mu\$,\s*\\mathbf\$\{\s*\$\\Sigma\$\s*\}\)/g, '$\\ln p(x_N | \\mu, \\mathbf{\\Sigma})$');
  cleaned = cleaned.replace(/\\ln\$\s*p\(x_N\s*\|\s*\$\\mu\$,\s*\$\\mathbf\$\{\s*\$\\Sigma\$\s*\}\)\$/g, '$\\ln p(x_N | \\mu, \\mathbf{\\Sigma})$');
  cleaned = cleaned.replace(/\\ln\$\s*p\(x_N\s*\|\s*\\mu\s*,\s*\\mathbf\{\\Sigma\}\)\$/g, '$\\ln p(x_N | \\mu, \\mathbf{\\Sigma})$');

  // 3. $[$\mathbf${$\Sigma$}_{ML}^{(N-1)}]^{-1}$ -> $[ \mathbf{\Sigma}_{ML}^{(N-1)} ]^{-1}$
  cleaned = cleaned.replace(/\$\s*\[\s*\$\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^\{\(([a-zA-Z0-9\-]+)\)\}\s*\]\^\{\s*-1\s*\}\s*\$/g, '$[\\mathbf{\\Sigma}_{$1}^{($2)}]^{-1}$');

  // 4. \mathbf${$\Sigma$}_{ML}^{2(N-1)}$ -> $\mathbf{\Sigma}_{ML}^{2(N-1)}$
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}\_\{([a-zA-Z0-9]+)\}\^\{2\(([a-zA-Z0-9\-]+)\)\}\$/g, '$\\mathbf{\\Sigma}_{$1}^{2($2)}$');

  // 5. General cleanup:
  cleaned = cleaned.replace(/\\mathbf\$\{\s*\$\\Sigma\$\s*\}/g, '\\mathbf{\\Sigma}');
  cleaned = cleaned.replace(/\s*\$\\Sigma\$\s*/g, ' \\Sigma ');
  cleaned = cleaned.replace(/\s*\$\\mu\$\s*/g, ' \\mu ');

  return cleaned;
}

// Bionic Reading text transformer for saccadic eye tracking
function toBionic(text: string): React.ReactNode {
  if (!text) return text;
  return text.split(" ").map((word, i) => {
    const cleaned = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (cleaned.length <= 3) {
      return (
        <span key={i} className="inline-block mr-1">
          <strong className="font-extrabold">{word}</strong>
        </span>
      );
    }
    const mid = Math.ceil(cleaned.length * 0.4);
    const boldPart = word.slice(0, mid);
    const restPart = word.slice(mid);
    return (
      <span key={i} className="inline-block mr-1">
        <strong className="font-extrabold text-foreground">{boldPart}</strong>
        {restPart}
      </span>
    );
  });
}

// Weld list markers and their contents together if separated by a newline
function preProcessMarkdown(text: string): string {
  if (!text) return text;
  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const isListMarker = /^\d+\.$/.test(trimmed) || /^[*+\-]$/.test(trimmed);

    if (isListMarker && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      result.push(`${trimmed} ${nextLine}`);
      i++;
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

// Helper to check if a line is a mathematical equation
function isStandaloneMath(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const hasMathIndicator = /^[=\-+/*]|\\|[_{}^]/.test(trimmed);
  if (!hasMathIndicator) return false;

  const words = trimmed.split(/[^a-zA-Z]/).filter((w) => w.length > 3);
  const mathKeywords = [
    "frac",
    "mathbf",
    "Sigma",
    "alpha",
    "beta",
    "gamma",
    "delta",
    "theta",
    "lambda",
    "omega",
    "left",
    "right",
    "sqrt",
    "approx",
    "const",
    "log",
    "det",
    "lim",
    "sin",
    "cos",
    "tan",
    "mu",
    "Sigma",
  ];
  const nonMathWords = words.filter((w) => !mathKeywords.includes(w));

  return nonMathWords.length === 0;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  cognitiveProfile?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  cognitiveProfile = "default",
}) => {
  const preProcessed = preProcessMarkdown(content);
  const cleanedContent = cleanLatexMathSyntax(preProcessed);

  const getTargetTextClass = () => {
    if (cognitiveProfile === "dyslexia") {
      return "text-sm tracking-wider leading-loose font-sans text-foreground";
    }
    if (cognitiveProfile === "adhd") {
      return "text-[13px] tracking-wide leading-relaxed text-foreground";
    }
    return "text-sm leading-relaxed text-foreground";
  };

  const parseMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];

    const isLaTeX = (str: string): boolean => {
      return str.startsWith("\\") || /^[\\{}_^T()\-+/*=]+|\\Sigma|\\mu|\\frac|\\mathbf|\\{N-1\}/i.test(str);
    };

    const formatInline = (lineText: string): React.ReactNode[] => {
      // Parse inline blocks: code, bold, math, italics, or explicit LaTeX expressions
      const regex = /(`[^`]+`|\*\*[^*]+\*\*|\$[^\$]+\$|\*[^*]+\*|f\([a-zA-Z0-9_^{}\-+=/*\\]+\)\s*=\s*[a-zA-Z0-9_^{}\-+=/*\\]+|[a-zA-Z0-9\-+/*=()]+(?:_\{[^{}]+\}|_[a-zA-Z0-9]+|\^\{[^{}]+\}|\^[a-zA-Z0-9]+)+|\\(?:mu|Sigma|frac|mathbf|alpha|beta|theta|lambda|pi|phi|sigma|delta|gamma|omega|Sigma|Pi|Delta|Gamma|Omega|ln|log|left|right|[a-zA-Z]+)(?:\{[^{}]+\})*(?:\^[^{}]+|\^T|\^\{[^{}]+\})?(?:_[^{}]+|_[a-zA-Z0-9]+|_(?:\{[^{}]+\}))?)/g;
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
          return <span key={i} className="font-serif italic text-foreground select-all">{token.slice(1, -1)}</span>;
        }
        if (isLaTeX(token)) {
          return <span key={i} className="font-serif italic text-foreground select-all">{token}</span>;
        }
        return cognitiveProfile === "adhd" ? <React.Fragment key={i}>{toBionic(token)}</React.Fragment> : token;
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
            className="my-3 py-2 text-center overflow-x-auto font-serif text-[15px] italic text-foreground select-all whitespace-pre-wrap leading-relaxed min-h-[2rem] flex items-center justify-center"
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
        let inDiagram = false;
        let diagramLines: string[] = [];

        const closeDiagram = (lineKey: string) => {
          if (inDiagram && diagramLines.length > 0) {
            elements.push(
              <pre
                key={`diagram-${lineKey}`}
                className="p-4 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre leading-normal border border-border my-3 select-all"
              >
                <code>{diagramLines.join("\n")}</code>
              </pre>
            );
            diagramLines = [];
            inDiagram = false;
          }
        };

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          const key = `blk-${bIdx}-ln-${idx}`;

          if (inCodeBlock) {
            if (trimmed.startsWith("```")) {
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
              codeBlockLines.push(line);
            }
            return;
          }

          // Code block toggle (```)
          if (trimmed.startsWith("```")) {
            closeDiagram(key);
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            inCodeBlock = true;
            return;
          }

          // Standalone mathematical equations styling
          if (isStandaloneMath(line)) {
            closeDiagram(key);
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            elements.push(
              <div
                key={`mathline-${key}`}
                className="my-2 py-1 font-serif text-[14px] italic text-foreground select-all whitespace-pre-wrap leading-relaxed flex items-center justify-start overflow-x-auto"
              >
                {trimmed}
              </div>
            );
            return;
          }

          // Diagram block auto-detection
          const isDiagramLine = (txt: string): boolean => {
            const diagramChars = /[┌┐└┘┬┴┼├┤│─━┃┏┓┗┛┳┻╋┣┫▼▲◄►➔➔]|[-━─_]{4,}|[|:+#*\\/]{3,}/;
            return diagramChars.test(txt);
          };

          if (isDiagramLine(line)) {
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            inDiagram = true;
            diagramLines.push(line);
            return;
          } else {
            closeDiagram(key);
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
              <li key={`li-${key}`} className={`${getTargetTextClass()} list-none flex items-start gap-1`}>
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
              <li key={`li-${key}`} className={`${getTargetTextClass()} list-disc list-inside`} style={marginLeft ? { marginLeft } : undefined}>
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
              <blockquote key={`quote-${key}`} className={`border-l-2 border-primary bg-elevated/40 px-3 py-1.5 my-3 rounded italic ${getTargetTextClass().replace('text-foreground', 'text-muted-foreground')}`}>
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
            <p key={`p-${key}`} className={`${getTargetTextClass()} mb-3 break-words`}>
              {formatInline(line)}
            </p>
          );
        });

        if (inList) {
          elements.push(<ul key={`list-${bIdx}-end`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
        }

        closeDiagram(`end-${bIdx}`);

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

  return <div className={`prose prose-sm max-w-none text-foreground ${className}`}>{parseMarkdown(cleanedContent)}</div>;
};
