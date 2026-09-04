import React, { useState } from "react";
import katex from "katex";
import { Copy, Check } from "lucide-react";

export function cleanLatexMathSyntax(text: string): string {
  if (!text) return text;
  return text
    .replace(/│/g, "|")
    .replace(/—/g, "-")
    .replace(/′/g, "'")
    .replace(/∥/g, "\\|")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, "")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/(?<!\\)Δ/g, "\\Delta ")
    .replace(/(?<!\\)∂/g, "\\partial ")
    .replace(/(?<!\\)×/g, "\\times ");
}

// Tokenize and color-code code syntax
function highlightSyntax(code: string, lang: string): React.ReactNode {
  if (!code) return code;
  const lines = code.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Full line comments
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return (
        <div key={lineIdx} className="table-row">
          <span className="table-cell text-slate-500 font-mono select-none pr-4 text-right text-[10px] opacity-40 leading-relaxed min-w-[2rem]">{lineIdx + 1}</span>
          <span className="table-cell text-slate-400 italic leading-relaxed">{line}</span>
        </div>
      );
    }

    // Tokenize line for syntax color-coding
    const tokenRegex = /(".*?"|'.*?'|`.*?`|\/\/[^\n]*|\/\*.*?\*\/|\b(?:const|let|var|function|return|if|else|switch|case|for|while|import|export|from|class|extends|async|await|try|catch|new|null|undefined|true|false|document|window|STATES|MODES)\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*(?=\()|<\/?[a-zA-Z0-9-]+|"[^"]*"|'[^']*')/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(line.slice(lastIndex, matchIndex));
      }

      let colorClass = "text-slate-200";
      if (/^["'`]/.test(matchText)) {
        colorClass = "text-emerald-400 font-medium"; // Strings
      } else if (/^\/\//.test(matchText) || /^\/\*/.test(matchText)) {
        colorClass = "text-slate-400 italic"; // Comments
      } else if (/^\d/.test(matchText)) {
        colorClass = "text-amber-400 font-semibold"; // Numbers
      } else if (/^(const|let|var|function|return|if|else|switch|case|for|while|import|export|from|class|extends|async|await|try|catch|new|null|undefined|true|false)$/.test(matchText)) {
        colorClass = "text-sky-400 font-bold"; // JS/TS Keywords
      } else if (/^(document|window|STATES|MODES)$/.test(matchText)) {
        colorClass = "text-purple-300 font-semibold"; // Globals / Constants
      } else if (/^<\/?[a-zA-Z0-9-]+/.test(matchText)) {
        colorClass = "text-rose-400 font-bold"; // HTML tags
      } else if (/^[a-zA-Z_]\w*$/.test(matchText) && line[matchIndex + matchText.length] === "(") {
        colorClass = "text-blue-400 font-semibold"; // Function calls
      }

      parts.push(
        <span key={matchIndex} className={colorClass}>
          {matchText}
        </span>
      );

      lastIndex = matchIndex + matchText.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <div key={lineIdx} className="table-row">
        <span className="table-cell text-slate-500 font-mono select-none pr-4 text-right text-[10px] opacity-40 leading-relaxed min-w-[2rem]">{lineIdx + 1}</span>
        <span className="table-cell leading-relaxed">{parts.length > 0 ? parts : line}</span>
      </div>
    );
  });
}

function CodeBlockContainer({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = (language || "code").toLowerCase();

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] text-slate-100 shadow-md font-mono text-[11.5px]">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-1 text-slate-300 font-mono font-bold">{lang}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-white/10 hover:text-slate-100 transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto select-all leading-relaxed hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="table w-full border-collapse font-mono whitespace-pre-wrap break-words">
          {highlightSyntax(code, lang)}
        </div>
      </div>
    </div>
  );
}

function detectCodeLanguage(line: string): string | null {
  const trm = line.trim();
  if (!trm) return null;

  // HTML tag detector
  if (/^<\/?(?:div|button|span|p|h[1-6]|section|article|header|footer|main|aside|nav|ul|ol|li|table|tr|th|td|form|input|label|select|option|a|img|script|style|link|meta)\b[^>]*\/?>/i.test(trm)) {
    return "html";
  }

  // CSS rule/property detector
  if (
    /^\.[a-zA-Z0-9_-]+\s*\{/i.test(trm) ||
    /^\#[a-zA-Z0-9_-]+\s*\{/i.test(trm) ||
    /^\/\*\s*Dynamic State/i.test(trm) ||
    (/^[a-zA-Z-]+:\s*[^;]+;/i.test(trm) && !trm.includes("http") && !trm.includes("url("))
  ) {
    return "css";
  }

  // JS/TS code detector
  if (
    /^\s*(?:\/\/\s*---|const|let|var|function|class|import|export|if\s*\(|else|return|switch|case|for\s*\(|while\s*\(|try|catch)\b/.test(trm) ||
    /^\/\*\*/.test(trm) ||
    /^\s*(?:[a-zA-Z_]\w*\.[a-zA-Z_]\w*\s*=|currentState\s*=|startTime\s*=)/.test(trm) ||
    /^(?:IDLE|RUNNING|PAUSED|WORK|BREAK):\s*\{/.test(trm)
  ) {
    return "javascript";
  }

  return null;
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

function deMangleSingleCharLines(text: string): string {
  if (!text) return text;
  const lines = text.split("\n");
  const result: string[] = [];
  let singleCharBuffer: string[] = [];

  const flush = () => {
    if (singleCharBuffer.length > 0) {
      result.push(singleCharBuffer.join(""));
      singleCharBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const isSingleChar = trimmed.length === 1 && !/^[#*\-+]$/.test(trimmed);

    if (isSingleChar) {
      singleCharBuffer.push(trimmed);
    } else {
      flush();
      result.push(line);
    }
  }
  flush();

  return result.join("\n");
}

// Weld list markers and their contents together if separated by a newline
function preProcessMarkdown(text: string): string {
  if (!text) return text;
  const demangled = deMangleSingleCharLines(text);
  const lines = demangled.split("\n");
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

  // Normalize Unicode Delta (Δ) to \Delta
  let normalized = text.replace(/(?<!\\)Δ/g, "\\Delta ");

  const lines = normalized.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Check if line is already wrapped in $$ or $
    const hasBlockWrap = trimmed.startsWith("$$") && trimmed.endsWith("$$");
    const hasInlineWrap = trimmed.startsWith("$") && trimmed.endsWith("$");
    if (hasBlockWrap || hasInlineWrap) {
      return line;
    }

    // Check if the line is a standalone math line:
    const hasMathCommands = /\\(frac|dfrac|sqrt|partial|nabla|theta|alpha|beta|gamma|delta|Delta|lambda|sigma|Sigma|sum|prod|int|iint|iiint|lim|left|right|times|div|approx|in|notin|subset|supset|cup|cap|dots|mathbf|mathbb|mathcal|vec|hat|overline|underline|begin|end|neq|le|leq|ge|geq|propto|equiv|to|rightarrow)\b/.test(trimmed);
    if (hasMathCommands) {
      const words = trimmed.split(/[^a-zA-Z]/).filter((w) => w.length > 3);
      const mathKeywords = [
        "frac", "dfrac", "sqrt", "partial", "nabla", "theta", "alpha", "beta", "gamma", "delta", "Delta", "lambda",
        "sigma", "Sigma", "sum", "prod", "int", "iint", "iiint", "lim", "left", "right", "times", "div",
        "approx", "in", "notin", "subset", "supset", "cup", "cap", "dots", "mathbf", "mathbb", "mathcal",
        "vec", "hat", "overline", "underline", "begin", "end", "neq", "le", "leq", "ge", "geq", "propto",
        "equiv", "to", "rightarrow", "text", "cases", "bmatrix", "pmatrix", "vmatrix"
      ];
      const nonMathWords = words.filter((w) => !mathKeywords.includes(w));

      // If no or very few non-math words, wrap the entire line in $$
      if (nonMathWords.length <= 1) {
        return `$$${trimmed}$$`;
      }
    }

    // Otherwise, replace loose macros (like \Delta t, \theta_1, \alpha, \dots) with $...$
    let lineText = line;
    lineText = lineText.replace(
      /(?<!\$)\\(?:theta|alpha|beta|gamma|delta|Delta|lambda|sigma|Sigma|mu|nu|xi|pi|rho|tau|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|in|notin|subset|supset|cup|cap|dots|cdot|partial|nabla|times|div|approx|neq|le|leq|ge|geq|propto|equiv|to|rightarrow)\b(?:_[a-zA-Z0-9]|_{[^}]+})?(?:\^[a-zA-Z0-9]|^{[^}]+})?(?!\$)/g,
      (match) => {
        return `$${match}$`;
      },
    );

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
          const formula = cleanLatexMathSyntax(token.slice(1, -1)).replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ').replace(/\n/g, ' ');
          try {
            const html = katex.renderToString(formula, { displayMode: false, throwOnError: true, strict: "ignore" });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            const cleanFallback = formula.replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "");
            return <span key={i} className="font-serif italic text-foreground select-all">{cleanFallback || formula}</span>;
          }
        }

        // If it reaches here and it's a matched token (i % 2 === 1), it must be one of the math/LaTeX branches of the regex
        const safeToken = cleanLatexMathSyntax(token).replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ').replace(/\n/g, ' ');
        try {
          const html = katex.renderToString(safeToken, { displayMode: false, throwOnError: true, strict: "ignore" });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          const cleanFallback = safeToken.replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "");
          return <span key={i} className="font-serif italic text-foreground select-all">{cleanFallback || token}</span>;
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
      const trimmedBlock = block.trim();
      const containsCodeOrText =
        /^\s*(?:function|const|let|var|if|else|return|class|stopTimerEngine|currentState|handleReset|handlePause|handleStart|<button|\.pomodoro-card)\b/m.test(trimmedBlock) ||
        /^#{1,6}\s+/m.test(trimmedBlock) ||
        trimmedBlock.length > 400;

      const isMathBlock = bIdx % 2 === 1 && !containsCodeOrText;

      if (isMathBlock) {
        const rawMath = cleanLatexMathSyntax(trimmedBlock).replace(/\\?\$/g, '\\$').replace(/∂/g, '\\partial ');
        try {
          const html = katex.renderToString(rawMath, { displayMode: true, throwOnError: true, strict: "ignore" });
          elements.push(
            <div
              key={`mathblock-${bIdx}`}
              className="my-3 py-2 text-center overflow-x-auto select-all hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden break-words whitespace-normal"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          elements.push(
            <div
              key={`mathblock-${bIdx}`}
              className="my-3 py-2 text-center overflow-x-auto font-serif text-[15px] italic text-foreground select-all whitespace-pre-wrap leading-relaxed min-h-[2rem] flex items-center justify-center hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden break-words"
            >
              {trimmedBlock}
            </div>
          );
        }
      } else {
        const lines = block.split("\n");
        let inList = false;
        let listItems: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBlockLang = "code";
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
              <div key={`table-container-${lineKey}`} className="my-4 overflow-x-auto rounded-xl border border-border bg-elevated/20 shadow-sm hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            // Trim leading/trailing blank lines from diagram block
            let linesToRender = [...diagramLines];
            while (linesToRender.length > 0 && linesToRender[0].trim() === "") linesToRender.shift();
            while (linesToRender.length > 0 && linesToRender[linesToRender.length - 1].trim() === "") linesToRender.pop();

            if (linesToRender.length > 0) {
              elements.push(
                <div
                  key={`diagram-card-${lineKey}`}
                  className="my-4 rounded-xl border border-border/80 bg-muted/40 p-4 shadow-sm overflow-x-auto select-all hide-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <pre className="font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    <code>{linesToRender.join("\n")}</code>
                  </pre>
                </div>
              );
            }
            diagramLines = [];
            inDiagram = false;
          }
        };

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          const key = `blk-${bIdx}-ln-${idx}`;

          const detectedLang = detectCodeLanguage(line);
          const nextNonEmpty = lines.slice(idx + 1).find((l) => l.trim().length > 0);
          const isNextCode = nextNonEmpty ? detectCodeLanguage(nextNonEmpty) !== null : false;

          if (inCodeBlock) {
            if (trimmed.startsWith("```") || (!codeBlockLang.startsWith("fenced:") && !detectedLang && trimmed === "")) {
              elements.push(
                <CodeBlockContainer
                  key={`code-${key}`}
                  code={codeBlockLines.join("\n")}
                  language={codeBlockLang.replace("fenced:", "")}
                />
              );
              codeBlockLines = [];
              codeBlockLang = "code";
              inCodeBlock = false;
            } else {
              codeBlockLines.push(line);
            }
            return;
          }

          // Un-fenced code block auto-detection
          if (detectedLang && !trimmed.startsWith("#") && !trimmed.startsWith("* ") && !trimmed.startsWith("- ")) {
            closeDiagram(key);
            closeTable(key);
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            inCodeBlock = true;
            codeBlockLang = detectedLang;
            codeBlockLines.push(line);
            return;
          }

          // Code block toggle (```)
          if (trimmed.startsWith("```")) {
            closeDiagram(key);
            closeTable(key);
            if (inList) {
              elements.push(<ul key={`list-${key}`} className="list-disc list-inside space-y-1 mb-3 pl-2">{[...listItems]}</ul>);
              listItems = [];
              inList = false;
            }
            inCodeBlock = true;
            codeBlockLang = `fenced:${trimmed.slice(3).trim() || "code"}`;
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
            <CodeBlockContainer
              key={`code-${bIdx}-unclosed`}
              code={codeBlockLines.join("\n")}
              language={codeBlockLang.replace("fenced:", "")}
            />
          );
        }
      }
    });

    return elements;
  };

  return (
    <div className={`prose prose-sm w-full max-w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] text-foreground ${className}`}>
      {parseMarkdown(cleanedContent)}
    </div>
  );
};
