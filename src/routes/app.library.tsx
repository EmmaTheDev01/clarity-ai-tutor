import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Filter, MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input, Pill } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { MaterialUploader } from "@/components/material-uploader";
import { LearningMaterial, mapMaterialRow } from "@/lib/learning-materials";

export const Route = createFileRoute("/app/library")({
  head: () => ({ meta: [{ title: "Library — tutor.vigilance.rw" }] }),
  component: LibraryPage,
});

const filters = ["All", "PDFs", "Videos", "Slides", "Audio", "Images", "Links", "Files"] as const;

function LibraryPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LearningMaterial[]>([]);

  useEffect(() => {
    const loadMaterials = async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setItems(data.map(mapMaterialRow));
      } else {
        setItems([]);
      }
    };

    loadMaterials();
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
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
    });
  }, [active, items, query]);
  return (
    <AppShell title="Library">
      <MaterialUploader onUploaded={(material) => setItems((prev) => [material, ...prev])} />

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
      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_40px] items-center gap-4 border-b border-border bg-elevated px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div>Name</div>
          <div className="hidden md:block">Size</div>
          <div className="hidden md:block">Updated</div>
          <div />
        </div>
        <ul>
          {visibleItems.map((it, i) => (
            <li key={it.id} className={i > 0 ? "border-t border-border" : ""}>
              <Link
                to="/app/documents/$id"
                params={{ id: it.id }}
                className="grid grid-cols-[minmax(0,1fr)_120px_120px_40px] items-center gap-4 px-5 py-4 transition hover:bg-elevated"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <it.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{it.title}</div>
                    <div className="mt-0.5 md:hidden">
                      <Pill>{it.type}</Pill>
                    </div>
                  </div>
                </div>
                <div className="hidden text-sm text-muted-foreground md:block">{it.size}</div>
                <div className="hidden text-sm text-muted-foreground md:block">{it.updated}</div>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="justify-self-end rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </Link>
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
