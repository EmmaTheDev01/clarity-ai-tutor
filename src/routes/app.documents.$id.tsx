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
  BookOpen,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Textarea } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { LearningMaterial, mapMaterialRow, uploadLearningMaterial } from "@/lib/learning-materials";
import { generateGeminiText } from "@/lib/gemini";
import { toast } from "sonner";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const encryptText = (text: string): { cipher: string; iv: string } => {
  const iv = Math.random().toString(36).substring(2, 10);
  const cipher = btoa(unescape(encodeURIComponent(text))) + "::" + iv;
  return { cipher, iv };
};

const decryptText = (cipher: string): string => {
  if (!cipher) return "";
  try {
    const base64 = cipher.split("::")[0];
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return cipher;
  }
};

const loadSessionMessages = async (studentId: string, activeMaterialId: string) => {
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("student_id", studentId)
    .eq("active_material_id", activeMaterialId)
    .limit(1)
    .maybeSingle();

  const sessionId = session?.id;
  if (sessionId) {
    const { data: dbMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (dbMessages) {
      return {
        sessionId,
        messages: dbMessages.map((m) => ({
          from: m.sender_role === "student" ? ("user" as const) : ("ai" as const),
          text: decryptText(m.encrypted_content),
          citation: m.citation || undefined,
        })),
      };
    }
  }
  return { sessionId, messages: [] };
};

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

function renderContent(text?: string | null) {
  if (!text) return null;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground select-text">
      {text.split("\n").map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-sm font-semibold mt-4 mb-2 text-foreground">
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="text-base font-bold mt-4 mb-2 text-foreground">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2 key={idx} className="text-lg font-extrabold mt-4 mb-2 text-foreground">
              {trimmed.replace(/^#\s*/, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <li key={idx} className="ml-4 list-disc text-sm text-foreground my-1">
              {trimmed.replace(/^[-*]\s*/, "")}
            </li>
          );
        }
        if (trimmed === "") return <div key={idx} className="h-2" />;
        return (
          <p key={idx} className="text-sm text-foreground my-1 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function SummaryPanel({ material }: { material: LearningMaterial | null }) {
  const [isSaving, setIsSaving] = useState(false);

  const saveToNotebook = async () => {
    if (!material?.content) return;
    setIsSaving(true);
    try {
      const newNote = {
        id: "auto_" + Date.now(),
        title: `Summary: ${material.title}`,
        subject: material.type || "General",
        content: material.content,
        updated: "Just now",
        isAi: true,
      };


      // Save to Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("notes").insert({
          student_id: userData.user.id,
          title: newNote.title,
          subject: newNote.subject,
          content: newNote.content,
          is_ai_generated: true,
        });

        await supabase.from("user_logs").insert({
          user_id: userData.user.id,
          action_type: "note_created",
          details: `Generated study note from ${material.type}: "${material.title}"`,
        });
      }

      toast.success("Study note saved to your notebook!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save study note.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> AI-ready summary context
      </div>
      <h3 className="text-lg font-semibold">{material?.title || "Material overview"}</h3>

      {material?.content ? (
        <div className="mt-4 border-t border-border/40 pt-4">{renderContent(material.content)}</div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No study notes extracted yet. Ask about a page, timestamp, image detail, or pasted excerpt
          for best results.
        </p>
      )}

      {material?.url && (
        <p className="mt-4 text-xs text-muted-foreground truncate">
          Source URL:{" "}
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {material.url}
          </a>
        </p>
      )}

      {material?.content && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
          <button
            onClick={saveToNotebook}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Notes to Notebook"}
          </button>
        </div>
      )}

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

  // Load chat session history from database whenever the material is selected/changed
  useEffect(() => {
    if (!material) return;
    const fetchHistory = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { messages: dbMsgs } = await loadSessionMessages(userData.user.id, material.id);
          setMessages(
            dbMsgs.length > 0
              ? dbMsgs
              : [
                  {
                    from: "ai",
                    text: `This workspace is ready for ${material.title}. Ask your first question to begin.`,
                  },
                ],
          );
        }
      } catch (err) {
        console.warn("Failed to load chat history from database:", err);
      }
    };
    fetchHistory();
  }, [material]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const nextMessages = [...messages, { from: "user" as const, text: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      // Build conversation history excluding initial greeting
      const chatHistory = messages
        .slice(1)
        .map((msg) => `${msg.from === "user" ? "Student" : "Tutor"}: ${msg.text}`)
        .join("\n\n");

      const systemPrompt = `You are a brilliant AI study tutor. GROUND YOUR ANSWERS STRICTLY in the active material below:
Title: ${material?.title || "Unknown"}
Type: ${material?.type || "Unknown"}
URL: ${material?.url || "None"}
Extracted content/Study Notes: ${material?.content || "No extracted text available yet."}

Core Instructions:
- Answer the student's question accurately using details from the active material.
- Explain concepts clearly with bullet points if helpful.
- Suggest one useful practice question or next step.
- Ground citations in the material title.`;

      const prompt = `${systemPrompt}

Conversation History:
${chatHistory}

Student: ${trimmed}
Tutor:`;

      const { text } = await generateGeminiText(prompt, 1200);
      setMessages([...nextMessages, { from: "ai", text, citation: material?.title }]);

      // Save user & AI response to database in background
      (async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user && material?.id) {
            const encryptedUser = encryptText(trimmed);
            const encryptedAi = encryptText(text);

            let { data: session } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("student_id", userData.user.id)
              .eq("active_material_id", material.id)
              .limit(1)
              .maybeSingle();

            let sId = session?.id;
            if (!sId) {
              const { data: newSession, error: insertErr } = await supabase
                .from("chat_sessions")
                .insert({
                  student_id: userData.user.id,
                  active_material_id: material.id,
                })
                .select("id")
                .maybeSingle();

              if (insertErr || !newSession) {
                const { data: retrySession } = await supabase
                  .from("chat_sessions")
                  .select("id")
                  .eq("student_id", userData.user.id)
                  .eq("active_material_id", material.id)
                  .limit(1)
                  .maybeSingle();
                sId = retrySession?.id;
              } else {
                sId = newSession.id;
              }
            }

            if (sId) {
              await supabase.from("messages").insert([
                {
                  session_id: sId,
                  sender_role: "student",
                  encrypted_content: encryptedUser.cipher,
                  encryption_iv: encryptedUser.iv,
                },
                {
                  session_id: sId,
                  sender_role: "assistant",
                  encrypted_content: encryptedAi.cipher,
                  encryption_iv: encryptedAi.iv,
                  citation: material.title,
                },
              ]);
            }
          }
        } catch (dbErr) {
          console.warn("Failed to save message to database:", dbErr);
        }
      })();
    } catch (err) {
      console.error("Gemini call failed in Document workspace:", err);
      setMessages([
        ...nextMessages,
        {
          from: "ai",
          text: `Connection failed: ${err instanceof Error ? err.message : "AI request failed."}\n\nPlease check your VITE_GEMINI_API_KEY environment variable.`,
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
