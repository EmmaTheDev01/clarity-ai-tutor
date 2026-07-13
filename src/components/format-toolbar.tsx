import React, { useRef, useCallback } from "react";
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
  Type,
} from "lucide-react";

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
}

type FormatAction =
  | { type: "wrap"; before: string; after: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "insert"; text: string };

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  textareaRef,
  value,
  onChange,
}) => {
  const applyFormat = useCallback(
    (action: FormatAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);

      let newValue = value;
      let newCursorStart = start;
      let newCursorEnd = end;

      if (action.type === "wrap") {
        const { before, after } = action;
        // If text is already wrapped, unwrap it
        if (selected.startsWith(before) && selected.endsWith(after)) {
          const unwrapped = selected.slice(before.length, -after.length || undefined);
          newValue = value.substring(0, start) + unwrapped + value.substring(end);
          newCursorEnd = start + unwrapped.length;
        } else {
          const wrapped = before + (selected || "text") + after;
          newValue = value.substring(0, start) + wrapped + value.substring(end);
          newCursorStart = start + before.length;
          newCursorEnd = start + before.length + (selected || "text").length;
        }
      } else if (action.type === "line-prefix") {
        const { prefix } = action;
        // Find the start of the current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const actualEnd = lineEnd === -1 ? value.length : lineEnd;
        const lineText = value.substring(lineStart, actualEnd);

        // Toggle prefix
        if (lineText.startsWith(prefix)) {
          const stripped = lineText.substring(prefix.length);
          newValue = value.substring(0, lineStart) + stripped + value.substring(actualEnd);
          newCursorStart = Math.max(lineStart, start - prefix.length);
          newCursorEnd = Math.max(lineStart, end - prefix.length);
        } else {
          newValue = value.substring(0, lineStart) + prefix + lineText + value.substring(actualEnd);
          newCursorStart = start + prefix.length;
          newCursorEnd = end + prefix.length;
        }
      } else if (action.type === "insert") {
        newValue = value.substring(0, start) + action.text + value.substring(end);
        newCursorStart = start + action.text.length;
        newCursorEnd = newCursorStart;
      }

      onChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
      });
    },
    [value, onChange, textareaRef],
  );

  const buttons: Array<{
    icon: React.ElementType;
    label: string;
    action: FormatAction;
    separator?: boolean;
  }> = [
    { icon: Bold, label: "Bold", action: { type: "wrap", before: "**", after: "**" } },
    { icon: Italic, label: "Italic", action: { type: "wrap", before: "*", after: "*" } },
    { icon: Strikethrough, label: "Strikethrough", action: { type: "wrap", before: "~~", after: "~~" } },
    { icon: Code, label: "Inline Code", action: { type: "wrap", before: "`", after: "`" }, separator: true },
    { icon: Heading1, label: "Heading 1", action: { type: "line-prefix", prefix: "# " } },
    { icon: Heading2, label: "Heading 2", action: { type: "line-prefix", prefix: "## " } },
    { icon: Heading3, label: "Heading 3", action: { type: "line-prefix", prefix: "### " }, separator: true },
    { icon: List, label: "Bullet List", action: { type: "line-prefix", prefix: "- " } },
    { icon: ListOrdered, label: "Numbered List", action: { type: "line-prefix", prefix: "1. " } },
    { icon: Quote, label: "Blockquote", action: { type: "line-prefix", prefix: "> " }, separator: true },
    { icon: Minus, label: "Divider", action: { type: "insert", text: "\n---\n" } },
    { icon: Link, label: "Link", action: { type: "wrap", before: "[", after: "](url)" } },
    { icon: Type, label: "Math", action: { type: "wrap", before: "$", after: "$" } },
  ];

  return (
    <div className="flex items-center gap-0.5 flex-wrap rounded-xl border border-border bg-elevated/60 px-2 py-1.5 mb-2">
      {buttons.map((btn, i) => (
        <React.Fragment key={btn.label}>
          <button
            type="button"
            onClick={() => applyFormat(btn.action)}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title={btn.label}
          >
            <btn.icon className="h-3.5 w-3.5" />
          </button>
          {btn.separator && (
            <div className="mx-0.5 h-4 w-px bg-border/60 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
