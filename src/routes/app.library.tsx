import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText,
  Youtube,
  Presentation,
  Mic,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input, Pill } from "@/components/ui-kit";

export const Route = createFileRoute("/app/library")({
  head: () => ({ meta: [{ title: "Library — tutor.vigilance.rw" }] }),
  component: LibraryPage,
});

const items = [
  { id: "d1", title: "Linear Algebra — Chapter 4", type: "PDF", size: "2.4 MB", updated: "2h ago", icon: FileText },
  { id: "d2", title: "Neural Networks Lecture", type: "YouTube", size: "1h 42m", updated: "Yesterday", icon: Youtube },
  { id: "d3", title: "Cell Biology Slides", type: "Slides", size: "84 slides", updated: "2d ago", icon: Presentation },
  { id: "d4", title: "Interview with Dr. Adeyemi", type: "Audio", size: "38 min", updated: "3d ago", icon: Mic },
  { id: "d5", title: "Organic Chemistry Notes", type: "PDF", size: "5.1 MB", updated: "1w ago", icon: FileText },
  { id: "d6", title: "Kigali Urban Planning Doc", type: "PDF", size: "3.3 MB", updated: "2w ago", icon: FileText },
];

const filters = ["All", "PDFs", "Videos", "Slides", "Audio"] as const;

function LibraryPage() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  return (
    <AppShell title="Library">
      {/* Upload zone */}
      <div className="rounded-lg border border-dashed border-border bg-elevated p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
          <Upload className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Drop a PDF, slide deck, or paste a YouTube link
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Up to 200 MB per file. Supports .pdf, .txt, .pptx, .mp3, YouTube URLs.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Upload className="h-4 w-4" /> Upload material
        </button>
      </div>

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
            <Input placeholder="Search materials…" className="pl-9 md:w-64" />
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
          {items.map((it, i) => (
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
        </ul>
      </div>
    </AppShell>
  );
}
