import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { LearningMaterial, mapMaterialRow, uploadLearningMaterial } from "@/lib/learning-materials";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export const Route = createFileRoute("/app/documents/$id")({
  head: () => ({ meta: [{ title: "Document — tutor.vigilance.rw" }] }),
  component: DocumentWorkspace,
});

const tabs = ["Summary", "Chat", "Quiz", "Flashcards"] as const;

function DocumentWorkspace() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");
  const [material, setMaterial] = useState<LearningMaterial | null>(null);

  useEffect(() => {
    const loadMaterial = async () => {
      const { data } = await supabase.from("materials").select("*").eq("id", id).single();
      if (data) setMaterial(mapMaterialRow(data));
    };
    loadMaterial();
  }, [id]);

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
              {material?.title || "Study material"}
            </h2>
            <div className="mt-1 text-xs text-muted-foreground">
              {material
                ? `${material.type} · ${material.size} · Updated ${material.updated}`
                : `Loading material · #${id}`}
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
          {tab === "Summary" && <SummaryPanel material={material} />}
          {tab === "Chat" && <ChatPanel material={material} />}
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
              <p>
                Answers in this workspace are grounded in the source document. Click any highlighted
                answer to jump to the passage.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function SummaryPanel({ material }: { material: LearningMaterial | null }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> AI-ready summary context
      </div>
      <h3 className="text-lg font-semibold">{material?.title || "Material overview"}</h3>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
        <li>
          This {material?.type || "material"} is available as chat context for explanations, study
          plans, quizzes, and flashcards.
        </li>
        <li>
          {material?.content ||
            "No extracted text is stored yet. Ask about a page, timestamp, image detail, or pasted excerpt for best results."}
        </li>
        {material?.url && <li>Source link: {material.url}</li>}
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

function ChatPanel({ material }: { material: LearningMaterial | null }) {
  const [messages, setMessages] = useState<
    Array<{ from: "user" | "ai"; text: string; citation?: string }>
  >([
    {
      from: "ai",
      text: "Ask a question about this material. You can also attach another file to make it the active context.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const nextMessages = [...messages, { from: "user" as const, text: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-flash-latest";
    try {
      if (!apiKey) throw new Error("Missing Gemini API key");
      const prompt = `You are an AI study tutor. Use this active material when possible.
Title: ${material?.title || "Unknown"}
Type: ${material?.type || "Unknown"}
URL: ${material?.url || "None"}
Extracted content: ${material?.content || "No extracted text available yet."}

Student question: ${trimmed}

Explain clearly, ask one useful follow-up, and cite the material title when relevant.`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
          }),
        },
      );
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!response.ok || !text) throw new Error(data?.error?.message || "AI response failed");
      setMessages([...nextMessages, { from: "ai", text, citation: material?.title }]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          from: "ai",
          text: "I can help with this material. Share the page, timestamp, image detail, or paragraph you want to understand, and I will break it into the main idea, examples, and a practice step.",
          citation: material?.title,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const attachFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const uploaded = await uploadLearningMaterial({ file });
      setMessages((prev) => [
        ...prev,
        {
          from: "ai",
          text: `${uploaded.title} was uploaded. Open it from the library or ask a question about it here.`,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: getErrorMessage(err, "Could not upload that file.") },
      ]);
    }
  };

  return (
    <Card className="flex h-[600px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message, index) => (
          <Message
            key={index}
            from={message.from}
            text={message.text}
            citation={message.citation}
          />
        ))}
        {isSending && (
          <Message from="ai" text="Thinking through the material..." citation={material?.title} />
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,audio/*,video/*"
            onChange={(event) => attachFile(event.target.files?.[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-border p-2 hover:bg-muted"
            aria-label="Attach"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Textarea
            placeholder="Ask a question grounded in this document…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            className="min-h-11 flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="rounded-md bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-60"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function Message({
  from,
  text,
  citation,
}: {
  from: "user" | "ai";
  text: string;
  citation?: string;
}) {
  const isAi = from === "ai";
  return (
    <div className={`flex gap-3 ${isAi ? "" : "flex-row-reverse"}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium">
        {isAi ? <Sparkles className="h-3.5 w-3.5" /> : "AJ"}
      </div>
      <div
        className={`max-w-[80%] rounded-lg border border-border ${isAi ? "bg-background" : "bg-elevated"} p-4`}
      >
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
        <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Show answer
        </button>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
          Next card
        </button>
      </div>
    </Card>
  );
}
