import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Minus,
  Strikethrough,
  Undo,
  Redo,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cleanLatexMathSyntax } from "./markdown";

/* ─── Markdown → HTML ───────────────────────────────────────────────── */

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

function formatInlineHtml(text: string): string {
  // 1. Block Math (double dollar signs)
  text = text.replace(
    /\$\$([^$]+)\$\$/g,
    '<div style="margin:12px 0;text-align:center;font-family:serif;font-size:1.05em;color:var(--color-primary);background:var(--color-elevated);padding:8px;border-radius:8px;border:1px solid var(--color-border);overflow-x:auto;">$1</div>'
  );

  // 2. Inline Math (single dollar signs)
  text = text.replace(
    /(?<!\$)\$([^$]+)\$(?!\$)/g,
    '<span style="font-family:serif;color:var(--color-primary);font-style:italic;background:var(--color-elevated);padding:2px 4px;border-radius:4px;">$1</span>'
  );

  // 3. Math tokens with subscripts/superscripts or explicit LaTeX commands
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\$[^\$]+\$|\*[^*]+\*|f\([a-zA-Z0-9_^{}\-+=/*\\]+\)\s*=\s*[a-zA-Z0-9_^{}\-+=/*\\]+|[a-zA-Z0-9\-+/*=()]+(?:_\{[^{}]+\}|_[a-zA-Z0-9]+|\^\{[^{}]+\}|\^[a-zA-Z0-9]+)+|\\(?:mu|Sigma|frac|mathbf|alpha|beta|theta|lambda|pi|phi|sigma|delta|gamma|omega|Sigma|Pi|Delta|Gamma|Omega|ln|log|left|right|[a-zA-Z]+)(?:\{[^{}]+\})*(?:\^[^{}]+|\^T|\^\{[^{}]+\})?(?:_[^{}]+|_[a-zA-Z0-9]+|_(?:\{[^{}]+\}))?)/g;

  const parts = text.split(regex);
  return parts.map((token) => {
    if (!token) return "";

    if (token.startsWith("<") && token.endsWith(">")) {
      return token;
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      return `<strong>${token.slice(2, -2)}</strong>`;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return `<em>${token.slice(1, -1)}</em>`;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return `<code>${token.slice(1, -1)}</code>`;
    }
    if (token.startsWith("$") && token.endsWith("$")) {
      const math = token.slice(1, -1);
      try {
        const rendered = katex.renderToString(math, { throwOnError: false });
        return rendered.replace(/^<span class="katex">/, `<span class="katex" data-latex="${math.replace(/"/g, '&quot;')}">`);
      } catch (e) {
        return `<span style="font-family:serif;font-style:italic;user-select:all;">${math}</span>`;
      }
    }

    const isLaTeXToken = token.startsWith("\\") || /^[\\{}_^T()\-+/*=]+|\\Sigma|\\mu|\\frac|\\mathbf|\\{N-1\}/i.test(token);
    if (isLaTeXToken) {
      try {
        const rendered = katex.renderToString(token, { throwOnError: false });
        return rendered.replace(/^<span class="katex">/, `<span class="katex" data-latex="${token.replace(/"/g, '&quot;')}">`);
      } catch (e) {
        return `<span style="font-family:serif;font-style:italic;user-select:all;">${token}</span>`;
      }
    }

    return token
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--color-primary);text-decoration:underline;">$1</a>');
  }).join("");
}

function markdownToHtml(md: string): string {
  const preProcessed = preProcessMarkdown(md);
  const parts = preProcessed.split("$$");
  let html = "";

  parts.forEach((part, partIdx) => {
    const isMathBlock = partIdx % 2 === 1;
    if (isMathBlock) {
      const rawMath = part.trim();
      try {
        const rendered = katex.renderToString(rawMath, { displayMode: true, throwOnError: false });
        html += rendered.replace(/^<span class="katex-display">/, `<span class="katex-display katex-block" data-latex="${rawMath.replace(/"/g, '&quot;')}">`);
      } catch (e) {
        html += `<div style="margin:12px auto;text-align:center;font-family:serif;font-size:1.05em;overflow-x:auto;max-width:100%;white-space:pre-wrap;line-height:1.6;user-select:all;font-style:italic;">${rawMath}</div>`;
      }
    } else {
      const lines = part.split("\n");
      let inUl = false;
      let inOl = false;
      let inTable = false;
      let tableRows: string[][] = [];
      let tableAlignments: string[] = [];

      const closeList = () => {
        if (inUl) {
          html += "</ul>";
          inUl = false;
        }
        if (inOl) {
          html += "</ol>";
          inOl = false;
        }
      };

      const closeTable = () => {
        if (inTable && tableRows.length > 0) {
          html += '<table style="width:100%;margin:1em 0;border-collapse:collapse;border:1px solid var(--color-border);font-size:0.9em;">';
          tableRows.forEach((row, i) => {
            html += "<tr>";
            row.forEach((cell, j) => {
              const Tag = i === 0 ? "th" : "td";
              const align = tableAlignments[j] || "left";
              const style = i === 0
                ? `border:1px solid var(--color-border);padding:8px 12px;background:var(--color-elevated);font-weight:bold;text-align:${align};`
                : `border:1px solid var(--color-border);padding:8px 12px;text-align:${align};`;
              html += `<${Tag} style="${style}">${formatInlineHtml(cell)}</${Tag}>`;
            });
            html += "</tr>";
          });
          html += "</table>";
          tableRows = [];
          tableAlignments = [];
          inTable = false;
        }
      };

      const closeAll = () => {
        closeList();
        closeTable();
      };

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
          closeAll();
          continue;
        }

        if (isStandaloneMath(line)) {
          closeAll();
          html += `<div style="margin:8px auto;text-align:left;font-family:serif;font-size:1em;overflow-x:auto;max-width:100%;white-space:pre-wrap;line-height:1.6;user-select:all;font-style:italic;">${trimmed}</div>`;
          continue;
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
            continue;
          } else {
            closeTable();
          }
        }

        if (isTableRow && !inTable) {
          closeAll();
          inTable = true;
          const cells = line
            .split("|")
            .map((s) => s.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cells);
          continue;
        }

        const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (hMatch) {
          closeAll();
          const level = hMatch[1].length;
          const sizes = ["1.5em", "1.3em", "1.15em", "1em", "0.95em", "0.9em"];
          html += `<h${level} style="font-size:${sizes[level - 1]};font-weight:700;margin:0.75em 0 0.4em;">${formatInlineHtml(hMatch[2])}</h${level}>`;
          continue;
        }

        if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
          closeAll();
          html += '<hr style="border:none;border-top:1px solid var(--color-border);margin:1em 0;">';
          continue;
        }

        if (trimmed.startsWith("> ")) {
          closeAll();
          html += `<blockquote style="border-left:3px solid var(--color-primary);padding:4px 12px;margin:0.5em 0;background:var(--color-elevated);border-radius:4px;font-style:italic;color:var(--color-muted-foreground);">${formatInlineHtml(trimmed.slice(2))}</blockquote>`;
          continue;
        }

        const bulletMatch = trimmed.match(/^[\-\*]\s+(.*)/);
        if (bulletMatch) {
          closeTable();
          if (inOl) {
            html += "</ol>";
            inOl = false;
          }
          if (!inUl) {
            html += '<ul style="list-style:disc;padding-left:1.5em;margin:0.4em 0;">';
            inUl = true;
          }
          html += `<li style="margin:0.15em 0;">${formatInlineHtml(bulletMatch[1])}</li>`;
          continue;
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          closeTable();
          if (inUl) {
            html += "</ul>";
            inUl = false;
          }
          if (!inOl) {
            html += '<ol style="list-style:decimal;padding-left:1.5em;margin:0.4em 0;">';
            inOl = true;
          }
          html += `<li style="margin:0.15em 0;">${formatInlineHtml(numMatch[2])}</li>`;
          continue;
        }

        if (trimmed === "") {
          closeAll();
          html += "<br>";
          continue;
        }

        closeAll();
        html += `<p style="margin:0.3em 0;">${formatInlineHtml(trimmed)}</p>`;
      }

      closeAll();
    }
  });

  return html;
}

/* ─── HTML → Markdown ───────────────────────────────────────────────── */

function htmlToMarkdown(element: HTMLElement): string {
  let result = "";

  for (const node of Array.from(element.childNodes)) {
    result += nodeToMd(node);
  }

  return result.replace(/\n{3,}/g, "\n\n").trim();
}

function nodeToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map(nodeToMd).join("");

  switch (tag) {
    case "h1":
      return `# ${children.trim()}\n\n`;
    case "h2":
      return `## ${children.trim()}\n\n`;
    case "h3":
      return `### ${children.trim()}\n\n`;
    case "h4":
      return `#### ${children.trim()}\n\n`;
    case "h5":
      return `##### ${children.trim()}\n\n`;
    case "h6":
      return `###### ${children.trim()}\n\n`;
    case "p":
      return `${children}\n\n`;
    case "br":
      return "\n";
    case "strong":
    case "b":
      return `**${children}**`;
    case "em":
    case "i":
      return `*${children}*`;
    case "del":
    case "s":
      return `~~${children}~~`;
    case "code":
      return `\`${children}\``;
    case "a":
      return `[${children}](${el.getAttribute("href") || ""})`;
    case "blockquote":
      return `> ${children.trim()}\n\n`;
    case "ul":
      return (
        Array.from(el.children)
          .map((li) => `- ${childrenMd(li).trim()}\n`)
          .join("") + "\n"
      );
    case "ol":
      return (
        Array.from(el.children)
          .map((li, i) => `${i + 1}. ${childrenMd(li).trim()}\n`)
          .join("") + "\n"
      );
    case "li":
      return children;
    case "hr":
      return "---\n\n";
    case "span":
      // Math spans
      if (el.classList.contains("katex-inline") || el.classList.contains("katex")) {
        const latex = el.getAttribute("data-latex");
        if (latex !== null) {
          if (el.classList.contains("katex-display") || el.classList.contains("katex-block")) {
            return `$$\n${latex}\n$$\n\n`;
          }
          return `$${latex}$`;
        }
        
        // Try to extract original LaTeX from MathML annotation if data-latex is missing (e.g., copy-pasted from Chat)
        const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation && annotation.textContent) {
          if (el.classList.contains("katex-display") || el.classList.contains("katex-block")) {
            return `$$\n${annotation.textContent}\n$$\n\n`;
          }
          return `$${annotation.textContent}$`;
        }

        // Fallback for badly formatted katex nodes
        return "";
      }
      if (el.style.fontFamily?.includes("serif")) return `$${children}$`;
      return children;
    case "div":
      if (el.classList.contains("katex-block")) {
        return `$$\n${el.getAttribute("data-latex") || children.trim()}\n$$\n\n`;
      }
      if (el.style.fontFamily?.includes("serif")) return `$$\n${children.trim()}\n$$\n\n`;
      return `${children}\n`;
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";

      const mdRows = rows.map((tr, idx) => {
        const cells = Array.from(tr.querySelectorAll("th, td")).map(c => childrenMd(c).trim());
        const rowStr = `| ${cells.join(" | ")} |`;
        if (idx === 0) {
          const sep = `| ${cells.map(() => "---").join(" | ")} |`;
          return `${rowStr}\n${sep}`;
        }
        return rowStr;
      });
      return `\n${mdRows.join("\n")}\n\n`;
    }
    case "tr":
    case "th":
    case "td":
      return ""; // Handled by table parsing
    default:
      return children;
  }
}

function childrenMd(node: Node): string {
  return Array.from(node.childNodes).map(nodeToMd).join("");
}

/* ─── Rich Editor Component ─────────────────────────────────────────── */

interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let clean = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");

  // Remove event handlers like onload, onerror, onclick, etc.
  clean = clean.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, 'href="#"');

  return clean;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  onSave,
  isSaving = false,
  readOnly = false,
  placeholder = "Start writing...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);
  const debounceTimer = useRef<any>(null);
  const [showSpecialChars, setShowSpecialChars] = useState(false);

  const specialCharsGroups: { label: string; chars: string[] }[] = [
    {
      label: "Greek",
      chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Λ", "Μ", "Ξ", "Π", "Σ", "Φ", "Ψ", "Ω"],
    },
    {
      label: "Math",
      chars: ["±", "×", "÷", "≠", "≈", "≡", "≤", "≥", "∞", "∑", "∏", "√", "∂", "∫", "∇", "∆", "∈", "∉", "⊂", "⊃", "∩", "∪", "∅", "∀", "∃", "¬", "∧", "∨", "⊕", "⊗", "ℝ", "ℤ", "ℕ", "ℚ", "ℂ", "ℍ", "°", "‰", "′", "″"],
    },
    {
      label: "Arrows",
      chars: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇔", "⟹", "⟺", "↦", "↪", "↩", "⤴", "⤵", "↗", "↘", "↖", "↙"],
    },
    {
      label: "Symbols",
      chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "·", "…", "–", "—", "′", "〈", "〉", "⟨", "⟩", "‖", "∥", "⊥", "∠", "⌈", "⌉", "⌊", "⌋", "⟦", "⟧"],
    },
  ];

  const insertChar = useCallback((char: string) => {
    if (readOnly || !editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(char);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand("insertText", false, char);
    }
    handleInput();
  }, [readOnly]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const html = markdownToHtml(cleanLatexMathSyntax(value));
      editorRef.current.innerHTML = sanitizeHtml(html);
      setIsEmpty(!value);
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    setIsEmpty(!editorRef.current.textContent?.trim());

    // Debounce save to avoid too many updates
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (editorRef.current) {
        const md = htmlToMarkdown(editorRef.current);
        onChange(md);
      }
    }, 400);
  }, [onChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (readOnly) return;
      e.preventDefault();

      const htmlData = e.clipboardData.getData("text/html");
      const plainText = e.clipboardData.getData("text/plain");

      const insertContent = (content: string, isHtml: boolean) => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          
          if (isHtml) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = content;
            const frag = document.createDocumentFragment();
            while (tempDiv.firstChild) frag.appendChild(tempDiv.firstChild);
            
            const lastChild = frag.lastChild;
            range.insertNode(frag);
            if (lastChild) {
              range.setStartAfter(lastChild);
              range.setEndAfter(lastChild);
            }
          } else {
            const textNode = document.createTextNode(content);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          document.execCommand(isHtml ? "insertHTML" : "insertText", false, content);
        }
      };

      if (htmlData) {
        // Parse the pasted HTML into Markdown to strip weird formatting, then convert back to our editor HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlData;
        const md = htmlToMarkdown(tempDiv);
        if (md) {
          const cleanHtml = markdownToHtml(cleanLatexMathSyntax(md));
          insertContent(cleanHtml, true);
          handleInput();
          return;
        }
      }

      insertContent(plainText, false);
      handleInput();
    },
    [readOnly, handleInput],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly) return;
      // Intentionally NOT calling e.preventDefault() so the native browser context menu opens!
      // This allows users to still use native spell-check and copy/paste.
      if (editorRef.current) {
        const md = htmlToMarkdown(editorRef.current);
        onChange(md);
      }
      if (onSave) onSave();
    },
    [readOnly, onChange, onSave],
  );

  const execCmd = useCallback(
    (command: string, val?: string) => {
      if (readOnly) return;
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      handleInput();
    },
    [readOnly, handleInput],
  );

  const formatBlock = useCallback(
    (tag: string) => {
      if (readOnly) return;
      editorRef.current?.focus();
      document.execCommand("formatBlock", false, tag);
      handleInput();
    },
    [readOnly, handleInput],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        if (editorRef.current) {
          const md = htmlToMarkdown(editorRef.current);
          onChange(md);
        }
        if (onSave) onSave();
      } else if (mod && e.key === "b") {
        e.preventDefault();
        execCmd("bold");
      } else if (mod && e.key === "i") {
        e.preventDefault();
        execCmd("italic");
      } else if (mod && e.key === "u") {
        e.preventDefault();
        execCmd("underline");
      } else if (mod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          execCmd("redo");
        } else {
          execCmd("undo");
        }
      }
    },
    [execCmd, onSave],
  );

  const toolbarButtons: Array<{
    icon: React.ElementType;
    label: string;
    action: () => void;
    separator?: boolean;
  }> = [
      { icon: Undo, label: "Undo (⌘Z)", action: () => execCmd("undo") },
      {
        icon: Redo,
        label: "Redo (⌘⇧Z)",
        action: () => execCmd("redo"),
        separator: true,
      },
      { icon: Bold, label: "Bold (⌘B)", action: () => execCmd("bold") },
      { icon: Italic, label: "Italic (⌘I)", action: () => execCmd("italic") },
      {
        icon: Strikethrough,
        label: "Strikethrough",
        action: () => execCmd("strikethrough"),
      },
      {
        icon: Code,
        label: "Inline Code",
        action: () => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const code = document.createElement("code");
            code.style.background = "var(--color-elevated)";
            code.style.padding = "1px 4px";
            code.style.borderRadius = "3px";
            code.style.fontFamily = "monospace";
            code.style.fontSize = "0.85em";
            try {
              range.surroundContents(code);
              handleInput();
            } catch {
              /* selection spans multiple nodes */
            }
          }
        },
        separator: true,
      },
      {
        icon: Heading1,
        label: "Heading 1",
        action: () => formatBlock("<h1>"),
      },
      {
        icon: Heading2,
        label: "Heading 2",
        action: () => formatBlock("<h2>"),
      },
      {
        icon: Heading3,
        label: "Heading 3",
        action: () => formatBlock("<h3>"),
        separator: true,
      },
      {
        icon: List,
        label: "Bullet List",
        action: () => execCmd("insertUnorderedList"),
      },
      {
        icon: ListOrdered,
        label: "Numbered List",
        action: () => execCmd("insertOrderedList"),
      },
      {
        icon: Quote,
        label: "Blockquote",
        action: () => formatBlock("<blockquote>"),
        separator: true,
      },
      {
        icon: Minus,
        label: "Divider",
        action: () => execCmd("insertHorizontalRule"),
      },
      {
        icon: Link,
        label: "Insert Link",
        action: () => {
          const url = prompt("Enter URL:");
          if (url) execCmd("createLink", url);
        },
      },
    ];

  return (
    <div className={`flex flex-col flex-1 ${className}`}>
      {/* Formatting Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 flex-wrap rounded-t-xl border border-border bg-elevated/80 px-2 py-1.5 sticky top-0 z-10 backdrop-blur-sm relative">
          {toolbarButtons.map((btn, i) => (
            <React.Fragment key={btn.label}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  btn.action();
                }}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground hover:shadow-sm"
                title={btn.label}
              >
                <btn.icon className="h-3.5 w-3.5" />
              </button>
              {btn.separator && (
                <div className="mx-0.5 h-4 w-px bg-border/60 shrink-0" />
              )}
            </React.Fragment>
          ))}

          {/* Special Characters Button */}
          <div className="mx-0.5 h-4 w-px bg-border/60 shrink-0" />
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowSpecialChars((v) => !v);
              }}
              className={`rounded-md px-1.5 py-1 text-xs font-bold transition hover:bg-background hover:text-foreground hover:shadow-sm ${showSpecialChars ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              title="Special Characters & Math Symbols"
            >
              Ω
            </button>

            {showSpecialChars && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-background shadow-lg p-3 flex flex-col gap-2"
                onMouseDown={(e) => e.preventDefault()}
              >
                {specialCharsGroups.map((group) => (
                  <div key={group.label}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{group.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.chars.map((char) => (
                        <button
                          key={char}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertChar(char);
                          }}
                          className="h-7 w-7 rounded-md border border-border text-sm font-mono hover:bg-primary/10 hover:border-primary/30 transition flex items-center justify-center text-foreground"
                          title={char}
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saving Indicator */}
          <div className="ml-auto flex items-center text-xs text-muted-foreground mr-1">
            {isSaving ? (
              <span className="flex items-center gap-1.5 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* Editable Content Area */}
      <div className="relative flex-1">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          className={`w-full min-h-[300px] flex-1 text-foreground font-sans leading-relaxed text-sm focus:outline-none ${readOnly
            ? "cursor-default"
            : "border border-border rounded-b-xl p-4 focus:ring-1 focus:ring-primary/30 bg-background"
            }`}
          style={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
          data-placeholder={placeholder}
        />
        {isEmpty && !readOnly && (
          <div className="absolute top-4 left-4 text-muted-foreground/50 text-sm pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
