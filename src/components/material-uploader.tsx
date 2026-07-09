import { useRef, useState } from "react";
import { Link, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui-kit";
import { LearningMaterial, uploadLearningMaterial } from "@/lib/learning-materials";

type MaterialUploaderProps = {
  compact?: boolean;
  onUploaded?: (material: LearningMaterial) => void;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function MaterialUploader({ compact = false, onUploaded }: MaterialUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const addMaterial = async (file?: File | null) => {
    const trimmedLink = link.trim();
    if (!file && !trimmedLink) {
      fileInputRef.current?.click();
      return;
    }

    setIsUploading(true);
    setMessage("");
    try {
      const material = await uploadLearningMaterial({
        file,
        link: file ? undefined : trimmedLink,
        title: title.trim() || undefined,
      });
      setLink("");
      setTitle("");
      setMessage(`${material.title} is ready for AI study.`);
      onUploaded?.(material);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Could not add this material yet."));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={
        compact
          ? "space-y-2"
          : "rounded-lg border border-dashed border-border bg-elevated p-6 text-center"
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,audio/*,video/*"
        onChange={(event) => addMaterial(event.target.files?.[0])}
      />

      {!compact && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
            <Upload className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            Add files, media, or links for AI learning
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports PDF, Word, slides, images, audio, video, text files, YouTube, and web links.
          </p>
        </>
      )}

      <div
        className={
          compact
            ? "space-y-2"
            : "mx-auto mt-4 grid max-w-2xl gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
        }
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          className="text-xs"
        />
        <Input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Paste YouTube or web link"
          className="text-xs"
        />
        <button
          type="button"
          onClick={() => addMaterial(null)}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link className="h-3.5 w-3.5" />
          )}
          Add link
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload
        </button>
      </div>

      {message && <p className="mt-2 text-[10px] font-medium text-muted-foreground">{message}</p>}
    </div>
  );
}
