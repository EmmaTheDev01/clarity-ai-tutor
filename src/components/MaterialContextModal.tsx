import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LearningMaterial, getMaterialAttachments, getBaseMaterialContent } from "@/lib/learning-materials";
import { MarkdownRenderer } from "@/components/markdown";
import {
  FileText,
  File,
  Plus,
  Copy,
  Check,
  Paperclip,
  BookOpen,
  Layers,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface MaterialContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: LearningMaterial | null;
  onAddAttachment?: (file: File) => Promise<void>;
  onAskAboutContext?: (promptText: string) => void;
}

export function MaterialContextModal({
  isOpen,
  onClose,
  material,
  onAddAttachment,
  onAskAboutContext,
}: MaterialContextModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>("base");
  const [copied, setCopied] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!material) return null;

  const attachments = getMaterialAttachments(material.content);
  const baseContent = getBaseMaterialContent(material.content);

  const activeContent =
    selectedTab === "base"
      ? baseContent
      : attachments.find((a) => a.name === selectedTab)?.content || "";

  const activeTitle =
    selectedTab === "base"
      ? material.title
      : selectedTab;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeContent);
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAddAttachment) return;
    setIsAttaching(true);
    try {
      await onAddAttachment(file);
      setSelectedTab(file.name);
    } catch {
      // Error handled by parent
    } finally {
      setIsAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const wordCount = activeContent.split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-background border border-border">
        {/* Header */}
        <div className="p-5 border-b border-border bg-muted/20">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-4 pr-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold text-foreground truncate">
                    {material.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{material.type} Source</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground/80">
                      {attachments.length === 0
                        ? "No supplemental files attached yet"
                        : `${attachments.length} supplemental file${attachments.length > 1 ? "s" : ""} attached`}
                    </span>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                  title="Copy content to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                {onAddAttachment && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,audio/*,video/*"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAttaching}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isAttaching ? "Adding..." : "Add Document"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs (Base Material vs Attached Documents) */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pt-1 hide-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTab("base")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                selectedTab === "base"
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Primary Material Notes</span>
            </button>

            {attachments.map((att) => {
              const isSelected = selectedTab === att.name;
              return (
                <button
                  key={att.name}
                  type="button"
                  onClick={() => setSelectedTab(att.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                {selectedTab === "base" ? (
                  <>
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Primary Learning Guide</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span>Attachment: {selectedTab}</span>
                  </>
                )}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {wordCount} words extracted · Fully active in your AI tutor study context
              </p>
            </div>

            {onAskAboutContext && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskAboutContext(
                    selectedTab === "base"
                      ? `Help me master the primary concepts from "${material.title}". What are the core theorems and takeaways?`
                      : `Explain the key points and formulas from the attached document "${selectedTab}". How does this connect to "${material.title}"?`
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
              >
                <span>Ask AI about this</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-elevated/20 p-5 overflow-x-auto">
            {activeContent ? (
              <MarkdownRenderer content={activeContent} />
            ) : (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No text extracted for this section yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
