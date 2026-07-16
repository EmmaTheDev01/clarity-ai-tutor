import React from "react";
import katex from "katex";

export function cleanLatexMathSyntax(text: string): string {
  return text;
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

function preProcessRawLatex(text: string): string {
  if (!text) return text;
  const lines = text.split("\n");
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Check if line is already wrapped in $$ or $
    const hasBlockWrap = trimmed.startsWith("$$") && trimmed.endsWith("$$");
    const hasInlineWrap = trimmed.startsWith("$") && trimmed.endsWith("$");
    if (hasBlockWrap || hasInlineWrap) {
      return line;
    }

    // Check if the line is a standalone math line:
    // It contains a backslash and typical math symbols, and does not contain regular English words.
    const hasMathCommands = /\\(frac|partial|theta|alpha|beta|gamma|delta|lambda|sigma|Sigma|sum|prod|left|right|times|div|approx|in|dots|mathbf|begin|end)/.test(trimmed);
    if (hasMathCommands) {
      const words = trimmed.split(/[^a-zA-Z]/).filter(w => w.length > 3);
      const mathKeywords = ["frac", "partial", "theta", "alpha", "beta", "gamma", "delta", "lambda", "sigma", "Sigma", "sum", "prod", "left", "right", "times", "div", "approx", "in", "dots", "mathbf", "begin", "end"];
      const nonMathWords = words.filter(w => !mathKeywords.includes(w));
      
      // If no or very few non-math words, wrap the entire line in $$
      if (nonMathWords.length <= 1) {
        return `$$${trimmed}$$`;
      }
    }

    // Otherwise, replace loose macros (like \theta_1, \alpha, \dots) with $...$
    let lineText = line;
    lineText = lineText.replace(/(?<!\$)\\(?:theta|alpha|beta|gamma|delta|lambda|sigma|Sigma|mu|in|dots|cdot|partial|times|approx)\b(?:_[a-zA-Z0-9]|_{[^}]+})?(?:\^[a-zA-Z0-9]|^{[^}]+})?(?!\$)/g, (match) => {
      return `$${match}$`;
    });

    return lineText;
  });

  return processedLines.join("\n");
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
  const latexWrapped = preProcessRawLatex(preProcessed);
  const cleanedContent = cleanLatexMathSyntax(latexWrapped);

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
        if (!token) return null;
        if (i % 2 === 0) {
          return cognitiveProfile === "adhd" ? <React.Fragment key={i}>{toBionic(token)}</React.Fragment> : token;
        }

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
          const formula = token.slice(1, -1).replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ').replace(/\n/g, ' ');
          try {
            const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={i} className="font-serif italic text-foreground select-all">{formula}</span>;
          }
        }
        
        // If it reaches here and it's a matched token (i % 2 === 1), it must be one of the math/LaTeX branches of the regex
        const safeToken = token.replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ').replace(/\n/g, ' ');
        try {
          const html = katex.renderToString(safeToken, { displayMode: false, throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={i} className="font-serif italic text-foreground select-all">{token}</span>;
        }
      });
    };

    // Split text by $$ to separate block math equations from general text content
    const blocks = text.split("$$");
    if (blocks.length % 2 === 0 && blocks.length > 1) {
      const last = blocks.pop();
      const prev = blocks.pop();
      blocks.push((prev || "") + "$$" + (last || ""));
    }
    
    blocks.forEach((block, bIdx) => {
      const isMathBlock = bIdx % 2 === 1;
      if (isMathBlock) {
        const rawMath = block.trim().replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ');
        try {
          const html = katex.renderToString(rawMath, { displayMode: true, throwOnError: false });
          elements.push(
            <div
              key={`mathblock-${bIdx}`}
              className="my-3 py-2 text-center overflow-x-auto select-all"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          elements.push(
            <div
              key={`mathblock-${bIdx}`}
              className="my-3 py-2 text-center overflow-x-auto font-serif text-[15px] italic text-foreground select-all whitespace-pre-wrap leading-relaxed min-h-[2rem] flex items-center justify-center"
            >
              {block.trim()}
            </div>
          );
        }
      } else {
        const lines = block.split("\n");
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBlockLines: string[] = [];
        let inDiagram = false;
        let diagramLines: string[] = [];
        let inTable = false;
        let tableRows: string[][] = [];
        let tableAlignments: ("left" | "center" | "right")[] = [];

        const closeTable = (lineKey: string) => {
          if (inTable && tableRows.length > 0) {
            const headers = tableRows[0];
            const dataRows = tableRows.slice(1);

            elements.push(
              <div key={`table-container-${lineKey}`} className="my-4 overflow-x-auto rounded-xl border border-border bg-elevated/20 shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40">
                      {headers.map((header, colIdx) => {
                        const align = tableAlignments[colIdx] || "left";
                        return (
                          <th
                            key={`th-${lineKey}-${colIdx}`}
                            className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-foreground select-none"
                            style={{ textAlign: align }}
                          >
                            {formatInline(header)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {dataRows.map((row, rowIdx) => (
                      <tr
                        key={`tr-${lineKey}-${rowIdx}`}
                        className="transition-colors hover:bg-muted/20 odd:bg-transparent even:bg-muted/10"
                      >
                        {row.map((cell, colIdx) => {
                          const align = tableAlignments[colIdx] || "left";
                          return (
                            <td
                              key={`td-${lineKey}-${rowIdx}-${colIdx}`}
                              className="px-4 py-2.5 leading-relaxed font-sans text-foreground/90 whitespace-normal break-words"
                              style={{ textAlign: align }}
                            >
                              {formatInline(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

            tableRows = [];
            tableAlignments = [];
            inTable = false;
          }
        };

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

          const isTableRow = trimmed.startsWith("|") && trimmed.endsWith("|");

          if (inTable) {
            if (isTableRow) {
              const isSeparator = /^[|:\s\-]+$/.test(trimmed);
              if (isSeparator) {
                const alignCells = trimmed
                  .split("|")
                  .map((s) => s.trim())
                  .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                tableAlignments = alignCells.map((cell) => {
                  if (cell.startsWith(":") && cell.endsWith(":")) return "center";
                  if (cell.endsWith(":")) return "right";
                  return "left";
                });
              } else {
                const cells = line
                  .split("|")
                  .map((s) => s.trim())
                  .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                tableRows.push(cells);
              }
              return;
            } else {
              closeTable(key);
            }
          }

          if (isTableRow && !inTable) {
            closeDiagram(key);
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            inTable = true;
            const cells = line
              .split("|")
              .map((s) => s.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            tableRows.push(cells);
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



          // Diagram block auto-detection
          const isDiagramLine = (txt: string): boolean => {
            const trimmed = txt.trim();
            if (
              trimmed.startsWith("#") ||
              trimmed.startsWith("*") ||
              trimmed.startsWith("-") ||
              trimmed.startsWith("+") ||
              trimmed.startsWith(">") ||
              /^\d+\.\s+/.test(trimmed)
            ) {
              return false;
            }
            const diagramChars = /[┌┐└┘┬┴┼├┤│─━┃┏┓┗┛┳┻╋┣┫▼▲◄►➔➔]|[-━─_]{4,}|[|/\\+]{4,}/;
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
        closeTable(`end-${bIdx}`);

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
