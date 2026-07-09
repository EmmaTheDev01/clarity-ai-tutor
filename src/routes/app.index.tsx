import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Youtube,
  Mic,
  Presentation,
  ArrowUpRight,
  Clock,
  MessageSquare,
  FileCheck2,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — tutor.vigilance.rw" }] }),
  component: Dashboard,
});

const stats = [
  { label: "Materials", value: "24" },
  { label: "Chat sessions", value: "138" },
  { label: "Quizzes taken", value: "12" },
  { label: "Study streak", value: "9 days" },
];

const recentDocs = [
  { id: "d1", title: "Linear Algebra — Chapter 4", type: "PDF", icon: FileText, updated: "2h ago" },
  { id: "d2", title: "Neural Networks Lecture", type: "YouTube", icon: Youtube, updated: "Yesterday" },
  { id: "d3", title: "Cell Biology Slides", type: "Slides", icon: Presentation, updated: "2d ago" },
  { id: "d4", title: "Interview with Dr. Adeyemi", type: "Audio", icon: Mic, updated: "3d ago" },
];

const recentChats = [
  { id: "c1", title: "Eigenvectors intuition", doc: "Linear Algebra — Chapter 4", when: "2h ago" },
  { id: "c2", title: "What is backpropagation?", doc: "Neural Networks Lecture", when: "Yesterday" },
  { id: "c3", title: "Summarize mitosis phases", doc: "Cell Biology Slides", when: "2d ago" },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Good morning, Alex.</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Ready to keep learning?
          </h2>
        </div>
        <Link
          to="/app/library"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New material
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent materials */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium">Recent materials</h3>
            <Link to="/app/library" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <ul>
            {recentDocs.map((d, i) => (
              <li key={d.id} className={i > 0 ? "border-t border-border" : ""}>
                <Link
                  to="/app/documents/$id"
                  params={{ id: d.id }}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-elevated"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border">
                      <d.icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{d.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{d.type}</span>
                        <span>·</span>
                        <span>{d.updated}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent chats */}
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium">Recent chats</h3>
            <Pill>
              <MessageSquare className="h-3 w-3" /> 3
            </Pill>
          </div>
          <ul>
            {recentChats.map((c, i) => (
              <li key={c.id} className={i > 0 ? "border-t border-border" : ""}>
                <div className="px-5 py-4">
                  <div className="text-sm font-medium text-foreground">{c.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {c.when} · {c.doc}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Suggested quizzes */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-medium">Practice recommended for you</h3>
          <Pill>
            <FileCheck2 className="h-3 w-3" /> Based on your recent reads
          </Pill>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
          {[
            { title: "Eigen decomposition — 10 Qs", meta: "Linear Algebra" },
            { title: "Backprop mechanics — 8 Qs", meta: "Neural Networks" },
            { title: "Mitosis vs. meiosis — 12 Qs", meta: "Cell Biology" },
          ].map((q) => (
            <button
              key={q.title}
              className="bg-background p-5 text-left transition hover:bg-elevated"
            >
              <div className="text-sm font-medium text-foreground">{q.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{q.meta}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                Start quiz <ArrowUpRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
