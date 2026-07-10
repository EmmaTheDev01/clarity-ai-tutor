import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

type DragDropOverlayProps = {
  onFilesDropped: (files: FileList) => void;
};

export function DragDropOverlay({ onFilesDropped }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onFilesDropped(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFilesDropped]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md border-4 border-dashed border-primary/40 m-4 rounded-2xl transition-all duration-300 pointer-events-none animate-fade-in">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-elevated border border-border/80 shadow-2xl scale-[1.02] transform transition duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary animate-bounce">
          <Upload className="h-7 w-7" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Drop your study files here</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload study notes, PDFs, or media to Clarity AI Tutor</p>
        </div>
      </div>
    </div>
  );
}
