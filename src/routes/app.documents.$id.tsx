import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Send,
  Paperclip,
  Sparkles,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Textarea } from "@/components/ui-kit";

export const Route = createFileRoute("/app/documents/$id")({
  head: () => ({ meta: [{ title: "Document — tutor.vigilance.rw" }] }),
  component: DocumentWorkspace,
});

const tabs = ["Summary", "Chat", "Quiz", "Flashcards"] as const;

function DocumentWorkspace() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");

  return (
    <AppShell
      title="Document"
      actions={
        <button className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted md:inline-flex">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      }
    >
      <Link
        to="/app/library"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to library
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-elevated">
            <FileText className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              Linear Algebra — Chapter 4
            </h2>
            <div className="mt-1 text-xs text-muted-foreground">
              PDF · 2.4 MB · 32 pages · Uploaded 2h ago · #{id}
            </div>
          </div>
        </div>
        <button className="rounded-md border border-border p-2 hover:bg-muted" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-px bg-foreground" />}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === "Summary" && <SummaryPanel />}
          {tab === "Chat" && <ChatPanel />}
          {tab === "Quiz" && <QuizPanel />}
          {tab === "Flashcards" && <FlashcardsPanel />}
        </div>
        <aside>
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-medium">Document outline</h3>
            </div>
            <ul className="p-2 text-sm">
              {[
                "4.1 Vector spaces",
                "4.2 Linear independence",
                "4.3 Basis and dimension",
                "4.4 Eigenvalues",
                "4.5 Eigenvectors",
                "4.6 Diagonalization",
              ].map((s, i) => (
                <li key={s}>
                  <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-elevated hover:text-foreground">
                    <span className="truncate">{s}</span>
                    <span className="text-xs">p. {i * 5 + 2}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="mt-6">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-medium">Citations</h3>
            </div>
            <div className="space-y-3 p-5 text-xs text-muted-foreground">
              <p>Answers in this workspace are grounded in the source document. Click any highlighted answer to jump to the passage.</p>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function SummaryPanel() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> AI-generated summary · verified against source
      </div>
      <h3 className="text-lg font-semibold">Key takeaways</h3>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
        <li>An <strong>eigenvector</strong> of a square matrix A is a non-zero vector v whose direction is unchanged when A is applied — only its length scales by a factor λ (the eigenvalue).</li>
        <li>The characteristic polynomial det(A − λI) = 0 yields the eigenvalues; substituting each λ back gives the corresponding eigenvectors.</li>
        <li>A matrix is diagonalizable when it has n linearly independent eigenvectors, enabling A = PDP⁻¹.</li>
        <li>Applications: PCA, stability analysis, quantum mechanics, and Google's original PageRank.</li>
      </ul>

      <div className="mt-6 border-t border-border pt-6">
        <h4 className="text-sm font-medium">Reading time saved</h4>
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
          <Stat k="Original" v="52 min" />
          <Stat k="Summary" v="4 min" />
          <Stat k="Saved" v="48 min" />
        </div>
      </div>
    </Card>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-background p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 text-lg font-semibold">{v}</div>
    </div>
  );
}

function ChatPanel() {
  return (
    <Card className="flex h-[600px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <Message from="user" text="Can you explain eigenvalues intuitively?" />
        <Message
          from="ai"
          text="Sure. Think of a matrix A as a stretching or rotating operation on vectors. Most vectors change direction when A is applied — but a few special ones don't. Those are eigenvectors. The amount they're stretched is the eigenvalue λ. So Av = λv means: A only rescales v, it doesn't rotate it."
          citation="p. 12 · §4.4"
        />
        <Message from="user" text="How do I compute them?" />
        <Message
          from="ai"
          text="Solve det(A − λI) = 0 for λ. Each root is an eigenvalue. Plug each λ back into (A − λI)v = 0 and solve for v — that gives the eigenvectors."
          citation="p. 14 · §4.4"
        />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <button className="rounded-md border border-border p-2 hover:bg-muted" aria-label="Attach">
            <Paperclip className="h-4 w-4" />
          </button>
          <Textarea
            placeholder="Ask a question grounded in this document…"
            className="min-h-11 flex-1"
          />
          <button className="rounded-md bg-primary p-2.5 text-primary-foreground hover:opacity-90" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function Message({ from, text, citation }: { from: "user" | "ai"; text: string; citation?: string }) {
  const isAi = from === "ai";
  return (
    <div className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium">
        {isAi ? <Sparkles className="h-3.5 w-3.5" /> : "AJ"}
      </div>
      <div className={`max-w-[80%] rounded-lg border border-border ${isAi ? "bg-background" : "bg-elevated"} p-4`}>
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
        {citation && (
          <div className="mt-2 inline-flex items-center gap-1 rounded border border-border bg-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {citation}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizPanel() {
  return (
    <Card className="p-6">
      <div className="text-xs text-muted-foreground">Question 3 of 10</div>
      <h3 className="mt-2 text-lg font-medium">
        Which condition guarantees that a matrix A is diagonalizable?
      </h3>
      <div className="mt-6 space-y-2">
        {[
          "A is symmetric.",
          "A has n distinct eigenvalues.",
          "A has n linearly independent eigenvectors.",
          "A is invertible.",
        ].map((opt, i) => (
          <button
            key={opt}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-left text-sm text-foreground transition hover:bg-elevated"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs">
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <button className="text-sm text-muted-foreground hover:text-foreground">Skip</button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Submit answer
        </button>
      </div>
    </Card>
  );
}

function FlashcardsPanel() {
  return (
    <Card className="flex h-96 flex-col items-center justify-center p-6 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Card 4 of 24</div>
      <div className="mt-6 max-w-md text-2xl font-semibold tracking-tight">
        What does det(A − λI) = 0 compute?
      </div>
      <div className="mt-8 flex items-center gap-3">
        <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Show answer</button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
          Next card
        </button>
      </div>
    </Card>
  );
}
