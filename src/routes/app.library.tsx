import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Filter, MoreHorizontal, Loader2, Trash2, X, Pin, PinOff, PencilLine } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input, Pill } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { MaterialUploader } from "@/components/material-uploader";
import { LearningMaterial, mapMaterialRow, uploadLearningMaterial, togglePinMaterial, renameMaterial } from "@/lib/learning-materials";
import { DragDropOverlay } from "@/components/drag-drop-overlay";
import { CacheManager } from "@/lib/cache";
import { toast } from "sonner";

export const Route = createFileRoute("/app/library")({
  head: () => ({ meta: [{ title: "Library — tutor.vigilance.rw" }] }),
  component: LibraryPage,
});

const filters = ["All", "PDFs", "Videos", "Slides", "Audio", "Images", "Links", "Files"] as const;

function LibraryPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LearningMaterial[]>([]);
  const [isDropUploading, setIsDropUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LearningMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<LearningMaterial | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRenameSubmit = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      await renameMaterial(renameTarget.id, renameValue.trim());
      setItems((prev) =>
        prev.map((item) => (item.id === renameTarget.id ? { ...item, title: renameValue.trim() } : item))
      );
      CacheManager.invalidate("materials_");
      toast.success(`Material renamed to "${renameValue.trim()}"`);
      setRenameTarget(null);
    } catch (err: any) {
      toast.error("Failed to rename material.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleFilesDropped = async (files: FileList) => {
    if (files.length === 0) return;
    setIsDropUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const material = await uploadLearningMaterial({ file });
        setItems((prev) => [material, ...prev]);
      }
      CacheManager.invalidate("materials_");
      toast.success(`${files.length} file(s) uploaded to library.`);
    } catch (err) {
      toast.error("Failed to upload dropped files.");
      console.warn("Drop upload error:", err);
    } finally {
      setIsDropUploading(false);
    }
  };

  useEffect(() => {
    const loadMaterials = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const cacheKey = `materials_${userData.user.id}`;
      const cached = CacheManager.get(cacheKey);
      if (cached) {
        setItems(cached);
        return;
      }

      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("uploaded_by", userData.user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map(mapMaterialRow);
        setItems(mapped);
        CacheManager.set(cacheKey, mapped, 30000);
      } else {
        setItems([]);
      }
    };

    loadMaterials();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("materials").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      CacheManager.invalidate("materials_");
      toast.success(`"${deleteTarget.title}" deleted from library.`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete material.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePinToggle = async (doc: LearningMaterial, nextPinned: boolean) => {
    try {
      await togglePinMaterial(doc.id, nextPinned);
      setItems((prev) =>
        prev.map((item) => (item.id === doc.id ? { ...item, pinned: nextPinned } : item))
      );
      CacheManager.invalidate("materials_");
      toast.success(nextPinned ? `Pinned "${doc.title}"` : `Unpinned "${doc.title}"`);
    } catch (error) {
      toast.error("Could not update pin state.");
    }
  };

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
        if (!matchesQuery) return false;
        if (active === "All") return true;
        if (active === "PDFs") return item.type === "PDF";
        if (active === "Videos") return item.type === "YouTube" || item.type === "Video";
        if (active === "Slides") return item.type === "Slides";
        if (active === "Audio") return item.type === "Audio";
        if (active === "Images") return item.type === "Image";
        if (active === "Links") return item.type === "Link" || item.type === "YouTube";
        if (active === "Files")
          return item.type === "File" || item.type === "Word" || item.type === "Text";
        return true;
      })
      .sort((a, b) => {
        const aPinned = Boolean(a.pinned);
        const bPinned = Boolean(b.pinned);
        if (aPinned === bPinned) return 0;
        return aPinned ? -1 : 1;
      });
  }, [active, items, query]);

  return (
    <AppShell title="Library">
      <DragDropOverlay onFilesDropped={handleFilesDropped} />

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Delete Material</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-extrabold transition flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <PencilLine className="h-4 w-4 text-primary" />
              </div>
              <button
                onClick={() => setRenameTarget(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Rename Material</h3>
            <div className="mt-4">
              <label htmlFor="rename-input" className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Material Title
              </label>
              <input
                id="rename-input"
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRenameTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={isRenaming || !renameValue.trim() || renameValue.trim() === renameTarget.title}
                className="rounded-xl bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-xs font-extrabold transition flex items-center gap-2"
              >
                {isRenaming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {isDropUploading && (
        <div className="fixed bottom-4 right-4 z-40 bg-elevated/90 backdrop-blur border border-border p-4 rounded-xl shadow-xl flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-semibold">Uploading dropped files...</span>
        </div>
      )}

      <MaterialUploader
        onUploaded={(material) => {
          setItems((prev) => [material, ...prev]);
          CacheManager.invalidate("materials_");
          toast.success(`"${material.title}" added to library.`);
        }}
      />

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active === f
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 md:w-64"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Sort
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-border w-full">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_120px_120px_100px] items-center gap-4 border-b border-border bg-elevated px-4 md:px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div>Name</div>
          <div className="hidden md:block">Size</div>
          <div className="hidden md:block">Updated</div>
          <div className="text-right">Actions</div>
        </div>
        <ul>
          {visibleItems.map((it, i) => (
            <li key={it.id} className={i > 0 ? "border-t border-border" : ""}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_120px_120px_100px] items-center gap-4 px-4 md:px-5 py-3.5 transition hover:bg-elevated">
                <Link
                  to="/app/documents/$id"
                  params={{ id: it.id }}
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <it.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="truncate min-w-0 max-w-xs sm:max-w-md md:max-w-lg" title={it.title}>
                        {it.title}
                      </span>
                      {it.pinned && (
                        <Pin className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground md:hidden">
                      <Pill>{it.type}</Pill>
                      <span>•</span>
                      <span>{it.updated}</span>
                    </div>
                  </div>
                </Link>
                <div className="hidden text-sm text-muted-foreground md:block">{it.size}</div>
                <div className="hidden text-sm text-muted-foreground md:block">{it.updated}</div>
                <div className="flex items-center justify-end gap-0.5 md:gap-1">
                  <button
                    onClick={() => handlePinToggle(it, !it.pinned)}
                    className={`rounded-md p-1.5 transition ${
                      it.pinned
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-label={it.pinned ? "Unpin material" : "Pin material"}
                    title={it.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(it)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition"
                    aria-label="Delete material"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setRenameTarget(it);
                      setRenameValue(it.title);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    aria-label="Rename material"
                    title="Rename"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {visibleItems.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              No materials match your search yet.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
