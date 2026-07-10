import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowUpRight, Search, Send, Paperclip, Sparkles, ChevronRight, Plus, Loader2, X, FileText, Image as ImageIcon, MoreHorizontal, Pin, PinOff, PencilLine, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Textarea, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { MaterialUploader } from "@/components/material-uploader";
import {
  LearningMaterial,
  createGeneralChatMaterial,
  deleteMaterial,
  mapMaterialRow,
  renameMaterial,
  togglePinMaterial,
  uploadLearningMaterial,
} from "@/lib/learning-materials";
import { geminiModel, generateGeminiText } from "@/lib/gemini";
import { DragDropOverlay } from "@/components/drag-drop-overlay";
import { toast } from "sonner";

const getStoredItem = (key: string, fallback = "") => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

const setStoredItem = (key: string, value: string) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(key, value);
};

const getStoredJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// Simulated Cryptographic Encryption Utility (Encrypted Chat Storage in DB)
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

const loadSessionMessages = async (studentId: string, activeMaterialId: string | null) => {
  let query = supabase.from("chat_sessions").select("id").eq("student_id", studentId);

  if (activeMaterialId) {
    query = query.eq("active_material_id", activeMaterialId);
  } else {
    query = query.is("active_material_id", null);
  }

  const { data: session } = await query.limit(1).maybeSingle();
  let sessionId = session?.id;

  if (!sessionId) {
    const { data: newSession, error: insertErr } = await supabase
      .from("chat_sessions")
      .insert({
        student_id: studentId,
        active_material_id: activeMaterialId,
      })
      .select("id")
      .maybeSingle();

    if (insertErr || !newSession) {
      const { data: retrySession } = await query.limit(1).maybeSingle();
      sessionId = retrySession?.id;
    } else {
      sessionId = newSession.id;
    }
  }

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
          timestamp: new Date(m.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        })),
      };
    }
  }
  return { sessionId, messages: [] };
};

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — tutor.vigilance.rw" }] }),
  component: Dashboard,
});

const filters = ["All", "PDFs", "Videos", "Slides", "Audio", "Images", "Links", "Files"] as const;
const onboardingPrompt =
  "Welcome to your study workspace. Add a lesson or link, then ask your first question to begin.";

type Message = {
  from: "user" | "ai";
  text: string;
  citation?: string;
  timestamp?: string;
};

type CognitiveProfile = "standard" | "adhd" | "dyslexia" | "sensory";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const formatTimestamp = (timestamp?: string) => timestamp || "Just now";

// Bionic Reading text transformer for saccadic eye tracking
function toBionic(text: string) {
  return text.split(" ").map((word, i) => {
    const cleaned = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (cleaned.length <= 3) {
      return (
        <span key={i} className="inline-block mr-1">
          <strong className="font-extrabold">{word}</strong>
        </span>
      );
    }
    const mid = Math.ceil(cleaned.length * 0.4);
    const boldPart = word.slice(0, mid);
    const restPart = word.slice(mid);
    return (
      <span key={i} className="inline-block mr-1">
        <strong className="font-extrabold text-foreground">{boldPart}</strong>
        {restPart}
      </span>
    );
  });
}

function Dashboard() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [activeDoc, setActiveDoc] = useState<LearningMaterial | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cognitive adaptive profiles states
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile>("standard");
  const [checkpoints, setCheckpoints] = useState<
    Array<{ id: string; label: string; completed: boolean }>
  >([]);
  const [showReward, setShowReward] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userDisplayName, setUserDisplayName] = useState("You");
  const [focusedMsgIndex, setFocusedMsgIndex] = useState<number | null>(null);
  const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
  const [attachmentMessage, setAttachmentMessage] = useState("");
  const [attachedFilePreview, setAttachedFilePreview] = useState<{ name: string; size: string; type: string } | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  // Gamification metrics
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDropUploading, setIsDropUploading] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    doc: LearningMaterial;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ doc: LearningMaterial; value: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearningMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFilesDropped = async (files: FileList) => {
    if (files.length === 0) return;
    setIsDropUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const material = await uploadLearningMaterial({ file });
        setMaterials((prev) => [material, ...prev]);
        setActiveDoc(material);
        setInputText((prev) => prev || `Help me study ${material.title}`);
        setAttachedFilePreview({ name: file.name, size: formatFileSize(file.size), type: file.type });
      }
      toast.success(`${files.length} file(s) attached as chat context.`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not attach dropped file(s)."));
    } finally {
      setIsDropUploading(false);
    }
  };

  // Read student profile for customized Socratic tutorials
  const [studentProfile, setStudentProfile] = useState<{
    educationLevel: string;
    gradeLevel: string;
  }>({
    educationLevel: "Undergraduate",
    gradeLevel: "2nd Year",
  });

  useEffect(() => {
    const storedXp = Number(getStoredItem("student_xp", "0"));
    setXp(Number.isFinite(storedXp) ? storedXp : 0);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handlePointerDown = () => setContextMenu(null);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [contextMenu]);

  // Auth Guard & Dynamic DB loader
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = "/auth/sign-in";
        return;
      }

      // Load Profile
      try {
        let stdProf = null;
        const { data: existingStdProf, error: stdProfErr } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("student_id", data.session.user.id)
          .maybeSingle();

        if (stdProfErr || !existingStdProf) {
          const newName = data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0] || "Student User";
          await supabase
            .from("profiles")
            .insert({
              id: data.session.user.id,
              name: newName,
              email: data.session.user.email || "",
              role: "student",
            })
            .select("*")
            .maybeSingle();

          const { data: createdStdProf } = await supabase
            .from("student_profiles")
            .insert({
              student_id: data.session.user.id,
              education_level: "Undergraduate",
              grade_level: "2nd Year",
              cognitive_profile: "standard",
            })
            .select("*")
            .maybeSingle();
          stdProf = createdStdProf;
        } else {
          stdProf = existingStdProf;
        }

        if (stdProf) {
          setStudentProfile({
            educationLevel: stdProf.education_level || "Undergraduate",
            gradeLevel: stdProf.grade_level || "2nd Year",
          });
          setCognitiveProfile((stdProf.cognitive_profile || "standard") as CognitiveProfile);
        }

        const hasSeenOnboarding = getStoredItem("clarity_onboarding_complete") === "true";
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.warn("Could not load student profile settings from DB:", err);
      }

      // Load Materials
      try {
        const { data: dbMats } = await supabase
          .from("materials")
          .select("*")
          .order("created_at", { ascending: false });
        if (dbMats && dbMats.length > 0) {
          const mapped = dbMats.map(mapMaterialRow);
          setMaterials(mapped);
          setPinnedIds(new Set(mapped.filter((item) => item.pinned).map((item) => item.id)));
          setActiveDoc(mapped[0]);
          setShowOnboarding(false);
        } else {
          setMaterials([]);
          setActiveDoc(null);
          const hasSeenOnboarding = getStoredItem("clarity_onboarding_complete") === "true";
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.warn("Error loading materials from DB, using fallback list:", err);
      }
    };
    checkAuthAndLoad();
  }, []);

  // Message history indexed by document ID (or "general" for global library chat)
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({
    general: [
      {
        from: "ai",
        text: onboardingPrompt,
      },
    ],
  });

  const activeDocId = activeDoc ? activeDoc.id : "general";
  const currentMessages = useMemo(
    () =>
      chatHistories[activeDocId] || [
        {
          from: "ai" as const,
          text: activeDoc
            ? `This workspace is ready for ${activeDoc.title}. Ask your first question to begin.`
            : onboardingPrompt,
        },
      ],
    [activeDoc, activeDocId, chatHistories],
  );

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const materialId = activeDoc ? activeDoc.id : null;
          const { messages: dbMsgs } = await loadSessionMessages(userData.user.id, materialId);
          setChatHistories((prev) => ({
            ...prev,
            [activeDocId]:
              dbMsgs.length > 0
                ? dbMsgs
                : [
                  {
                    from: "ai",
                    text: activeDoc
                      ? `This workspace is ready for ${activeDoc.title}. Ask your first question to begin.`
                      : onboardingPrompt,
                  },
                ],
          }));
        }
      } catch (err) {
        console.warn("Failed to load chat history from database:", err);
      }
    };
    fetchHistory();
  }, [activeDocId, activeDoc]);
  const avatarLabel =
    userDisplayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "Y";
  const reminderItems =
    materials.length > 0
      ? [
        "Keep momentum by asking one focused question about the current material.",
        "Add another lesson or link when you are ready to expand the workspace.",
      ]
      : [
        "Add your first lesson or link to build a study workspace.",
        "Ask the tutor a question and it will guide you from there.",
      ];
  const quickPrompts = activeDoc
    ? [
      `Explain ${activeDoc.title} simply`,
      `Create a study plan from ${activeDoc.title}`,
      `Quiz me on the key ideas`,
    ]
    : materials.length > 0
      ? ["Summarize the newest material", "Create practice questions", "Help me study this topic"]
      : ["Upload or link a lesson", "Start with a study question", "Show me how to begin"];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isTyping]);

  const runSimulatedSocraticResponse = (trimmed: string, updatedHistory: Message[]) => {
    setTimeout(() => {
      setIsTyping(false);

      const eduLevel = studentProfile.educationLevel || "Undergraduate";
      const grade = studentProfile.gradeLevel || "2nd Year";

      let coachText = "";
      let noteSummary = "";

      const lower = trimmed.toLowerCase();
      if (lower.includes("eigenvector") || lower.includes("eigenvalue")) {
        coachText = `[Socratic Tutor Level: ${eduLevel} (${grade})]\n\nI see you're working on eigenvectors. Since you're studying at the ${eduLevel} level, let's look at this mathematically: when matrix A acts on vector v, the direction is unchanged — it is only rescaled.\n\nWe write this as Av = λv. To solve for eigenvalues λ, we solve the characteristic equation det(A - λI) = 0.\n\nWhat is the next step you would take to find the determinant of your matrix? How does subtracting λ change the diagonal entries?`;
        noteSummary =
          "\n\n[NOTE_SUMMARY] Title: Eigenvectors & Characteristic Math | Subject: Mathematics | Content: Eigenvectors maintain direction under matrix action, scaling by eigenvalue λ. Solved using characteristic polynomial equation det(A - λI) = 0.";
      } else if (
        lower.includes("neural") ||
        lower.includes("backprop") ||
        lower.includes("gradient")
      ) {
        coachText = `[Socratic Tutor Level: ${eduLevel} (${grade})]\n\nYou're exploring backpropagation at the ${eduLevel} level. Recall that it computes gradients backward from the output layer to apply weight adjustments.\n\nThink of the calculus Chain Rule: ∂Loss/∂Weight = (∂Loss/∂Out) * (∂Out/∂Net) * (∂Net/∂Weight).\n\nWhere do you think the local error gradient (δ) comes from at a hidden neuron? What activation function derivative is scaled here?`;
        noteSummary =
          "\n\n[NOTE_SUMMARY] Title: Backpropagation & Chain Rule Math | Subject: Neural Networks | Content: Backpropagation propagates gradients from output back to weights recursively using the calculus chain rule for neural network optimization.";
      } else {
        coachText = `[Socratic Tutor Level: ${eduLevel} (${grade})]\n\nThat's an interesting question. I can help you learn it from the material you provide: files, links, images, audio, video, or pasted text.\n\nFirst, name the concept or point me to the part of the uploaded source that feels confusing. Then we can break it into the core idea, a worked intuition, and one practice step.\n\nWhat is the exact section, timestamp, paragraph, diagram, or term you want to understand?`;
        noteSummary = `\n\n[NOTE_SUMMARY] Title: AI Study Workflow | Subject: App Learning Skills | Content: Use uploaded materials and focused questions so the tutor can explain concepts, generate notes, and guide practice from source context.`;
      }

      if (noteSummary) {
        const titleMatch = noteSummary.match(/Title:\s*([^|]+)/);
        const subjectMatch = noteSummary.match(/Subject:\s*([^|]+)/);
        const contentMatch = noteSummary.match(/Content:\s*(.+)$/);

        if (titleMatch && subjectMatch && contentMatch) {
          const newNote = {
            id: "auto_" + Date.now(),
            title: titleMatch[1].trim(),
            subject: subjectMatch[1].trim(),
            content: contentMatch[1].trim(),
            updated: "Just now",
            isAi: true,
          };

          const stored = getStoredItem("digital_notebook", "[]");
          const currentNotes = stored ? JSON.parse(stored) : [];
          setStoredItem("digital_notebook", JSON.stringify([newNote, ...currentNotes]));

          setShowAutoSaveNotice(true);
          setTimeout(() => setShowAutoSaveNotice(false), 3000);
        }
      }

      const aiMessage: Message = {
        from: "ai",
        text: coachText,
        citation: activeDoc ? `p. 1 · ${activeDoc.title}` : "STEM Mentorship Engine",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [activeDocId]: [...updatedHistory, aiMessage],
      }));
    }, 1500);
  };

  const handleSend = async (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const resolvedDoc = activeDoc ?? (await createGeneralChatMaterial());
    if (!activeDoc && resolvedDoc) {
      setMaterials((prev) => (prev.some((item) => item.id === resolvedDoc.id) ? prev : [resolvedDoc, ...prev]));
      setActiveDoc(resolvedDoc);
    }

    // Encrypt the chat message block before database write log simulation
    const encryptedPayload = encryptText(trimmed);

    const userMessage: Message = {
      from: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    const updatedHistory = [...currentMessages, userMessage];
    const activeDocForResponse = resolvedDoc;
    const activeDocIdForResponse = activeDocForResponse ? activeDocForResponse.id : "general";

    setChatHistories((prev) => ({
      ...prev,
      [activeDocIdForResponse]: updatedHistory,
    }));
    setInputText("");
    setIsTyping(true);

    // Award +15 XP on active study chat submission
    const newXp = xp + 15;
    setXp(newXp);
    setStoredItem("student_xp", String(newXp));

    // Log the user action in user_logs in background
    const currentLogs = getStoredJson<Array<{ action: string; details: string; time: string }>>(
      "user_logs",
      [],
    );
    currentLogs.push({
      action: "chat_query_submitted",
      details: `Asked: "${trimmed.substring(0, 40)}..." (Encrypted: ${encryptedPayload.cipher.substring(0, 15)}...)`,
      time: new Date().toISOString(),
    });
    setStoredItem("user_logs", JSON.stringify(currentLogs));

    // 1. Live Gemini API Socratic coaching adapter
    const systemInstruction = `You are an elite Socratic STEM and engineering mentor.
The student you are teaching is at the ${studentProfile.educationLevel || "Undergraduate"} level (Grade/GPA: ${studentProfile.gradeLevel || "2nd Year"}).
YOUR CORE INSTRUCTION:
- Coach the student so they learn how to solve their own technical and scientific problems.
- If the student's message is a greeting or simple pleasantry, reply briefly and warmly.
- If the student asks for study notes, conceptual explanations, summaries, or definitions of general topics (e.g., Machine Learning, Calculus, physics concepts), you MUST provide a detailed, highly descriptive, structured, and complete explanation with key notes, terms, and practical examples.
- The restriction on providing final answers or direct solutions only applies to specific homework problems, direct code debugging requests (do not write the direct code fix), or math assignments. Do not withhold educational notes or concepts.
- If the student's message is not a greeting, provide a detailed, helpful explanation with context, clear structure, and practical examples.
- Treat uploaded files, links, images, audio, video, and pasted text as study sources. If source text is sparse, say what context is available and ask for the missing page, section, timestamp, or image detail.
- Use the active source when present: ${activeDocForResponse ? `Title: ${activeDocForResponse.title}; Type: ${activeDocForResponse.type}; URL: ${activeDocForResponse.url || "not available"}; Extracted content: ${activeDocForResponse.content || "No extracted text yet."}` : "No active source selected."}
- Use short paragraphs or bullet points, explain the idea in plain language, and end with one concrete next step or question.
- You are EXPLICITLY FORBIDDEN from providing final answers, completed code files, or direct mathematical solutions to assignment questions.
- Identify the logical flaw or missing fundamental principle in the student's question.
- Offer structured hints, mention governing laws (e.g. det(A-λI)=0, Ohm's law, Big-O limits, Chain rule), and ask 1 or 2 guiding questions.
- If they debug code, point to the conceptual issue or line range. Explain why it fails and provide small analogies. Do NOT write patch code.
- Dynamically adjust the granularity of hints.
- ALWAYS append a hidden note summary metadata block at the very end of your response in the EXACT format:
[NOTE_SUMMARY] Title: [Short note title] | Subject: [Subject field] | Content: [One sentence high-level summary of the concept discussed for their notebook]`;

    try {
      const chatHistoryContext = currentMessages
        .slice(-10)
        .map((msg) => `${msg.from === "user" ? "Student" : "Mentor"}: ${msg.text}`)
        .join("\n\n");

      const { text: generatedText, model: respondingModel } = await generateGeminiText(
        `${systemInstruction}\n\nConversation History:\n${chatHistoryContext}\n\nStudent Message:\n${trimmed}`,
        1200,
      );

      let coachText = generatedText;
      let noteSummary = "";

      const summaryIdx = generatedText.indexOf("[NOTE_SUMMARY]");
      if (summaryIdx !== -1) {
        coachText = generatedText.substring(0, summaryIdx).trim();
        noteSummary = generatedText.substring(summaryIdx).trim();
        if (!coachText) {
          coachText = generatedText;
        }
      }

      // Process Note Auto-save in the background
      if (noteSummary) {
        const titleMatch = noteSummary.match(/Title:\s*([^|]+)/);
        const subjectMatch = noteSummary.match(/Subject:\s*([^|]+)/);
        const contentMatch = noteSummary.match(/Content:\s*(.+)$/);

        if (titleMatch && subjectMatch && contentMatch) {
          const newNote = {
            id: "auto_" + Date.now(),
            title: titleMatch[1].trim(),
            subject: subjectMatch[1].trim(),
            content: contentMatch[1].trim(),
            updated: "Just now",
            isAi: true,
          };

          const stored = getStoredItem("digital_notebook", "[]");
          const currentNotes = stored ? JSON.parse(stored) : [];
          setStoredItem("digital_notebook", JSON.stringify([newNote, ...currentNotes]));

          // Sync note to Supabase "notes" table
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              await supabase.from("notes").insert({
                student_id: userData.user.id,
                title: newNote.title,
                subject: newNote.subject,
                content: newNote.content,
                is_ai_generated: true,
              });
            }
          } catch (err) {
            console.warn("Supabase notes save fail:", err);
          }

          setShowAutoSaveNotice(true);
          setTimeout(() => setShowAutoSaveNotice(false), 3000);
        }
      }

      // Encrypt messages for Supabase write logs
      const cipherObj = encryptText(coachText);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const materialId = activeDocForResponse ? activeDocForResponse.id : null;
          let query = supabase
            .from("chat_sessions")
            .select("id")
            .eq("student_id", userData.user.id);

          if (materialId) {
            query = query.eq("active_material_id", materialId);
          } else {
            query = query.is("active_material_id", null);
          }

          const { data: session } = await query.limit(1).maybeSingle();

          let sId = session?.id;
          if (!sId) {
            const { data: newSession, error: insertErr } = await supabase
              .from("chat_sessions")
              .insert({
                student_id: userData.user.id,
                active_material_id: materialId,
              })
              .select("id")
              .maybeSingle();

            if (insertErr || !newSession) {
              const { data: retrySession } = await query.limit(1).maybeSingle();
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
                encrypted_content: encryptedPayload.cipher,
                encryption_iv: encryptedPayload.iv,
              },
              {
                session_id: sId,
                sender_role: "assistant",
                encrypted_content: cipherObj.cipher,
                encryption_iv: cipherObj.iv,
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Supabase messages sync failure:", err);
      }

      setIsTyping(false);
      const aiMessage: Message = {
        from: "ai",
        text: coachText,
        citation: activeDocForResponse ? `p. 1 · ${activeDocForResponse.title}` : `Gemini ${respondingModel}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [activeDocIdForResponse]: [...updatedHistory, aiMessage],
      }));
    } catch (err) {
      console.error("Gemini API error:", err);
      const fallbackMessage: Message = {
        from: "ai",
        text: `Gemini connection issue: ${getErrorMessage(err, "The AI request failed.")}\n\nI can still help once the Gemini API key and model are valid. Check that your key is a Google AI Studio API key, restart the dev server, then try again.`,
        citation: "Gemini setup",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };
      setIsTyping(false);
      setChatHistories((prev) => ({
        ...prev,
        [activeDocIdForResponse]: [...updatedHistory, fallbackMessage],
      }));
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const finishOnboarding = () => {
    setStoredItem("clarity_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const filteredDocs = [...materials]
    .filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === "PDFs") return doc.type === "PDF";
      if (activeFilter === "Videos") return doc.type === "YouTube" || doc.type === "Video";
      if (activeFilter === "Slides") return doc.type === "Slides";
      if (activeFilter === "Audio") return doc.type === "Audio";
      if (activeFilter === "Images") return doc.type === "Image";
      if (activeFilter === "Links") return doc.type === "Link" || doc.type === "YouTube";
      if (activeFilter === "Files")
        return doc.type === "File" || doc.type === "Word" || doc.type === "Text";
      return true;
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.has(a.id) || Boolean(a.pinned);
      const bPinned = pinnedIds.has(b.id) || Boolean(b.pinned);
      if (aPinned === bPinned) return 0;
      return aPinned ? -1 : 1;
    });

  const handlePinToggle = async (doc: LearningMaterial, nextPinned: boolean) => {
    try {
      await togglePinMaterial(doc.id, nextPinned);
      setMaterials((prev) => prev.map((item) => (item.id === doc.id ? { ...item, pinned: nextPinned } : item)));
      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (nextPinned) next.add(doc.id);
        else next.delete(doc.id);
        return next;
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update pin state."));
    }
  };

  const handleRenameSubmit = async (doc: LearningMaterial, nextValue: string) => {
    const normalized = nextValue.trim();
    if (!normalized || normalized === doc.title) {
      setRenameTarget(null);
      return;
    }

    setIsRenaming(true);
    try {
      await renameMaterial(doc.id, normalized);
      setMaterials((prev) => prev.map((item) => (item.id === doc.id ? { ...item, title: normalized } : item)));
      if (activeDoc?.id === doc.id) {
        setActiveDoc((prev) => (prev && prev.id === doc.id ? { ...prev, title: normalized } : prev));
      }
      toast.success(`Renamed to “${normalized}”.`);
      setRenameTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not rename the material."));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMaterial(deleteTarget.id);
      setMaterials((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setPinnedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      if (activeDoc?.id === deleteTarget.id) {
        setActiveDoc(null);
      }
      toast.success(`“${deleteTarget.title}” deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete the material."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAttachFile = async (file?: File | null) => {
    if (!file) return;
    setAttachedFilePreview({ name: file.name, size: formatFileSize(file.size), type: file.type });
    setAttachmentMessage("Uploading attachment...");
    try {
      const material = await uploadLearningMaterial({ file });
      setMaterials((prev) => [material, ...prev]);
      setActiveDoc(material);
      setInputText((prev) => prev || `Help me study ${material.title}`);
      setAttachmentMessage("");
      toast.success(`"${material.title}" attached as chat context.`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not attach this file."));
      setAttachedFilePreview(null);
      setAttachmentMessage("");
    } finally {
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  };

  return (
    <>
      <DragDropOverlay onFilesDropped={handleFilesDropped} />

      {isDropUploading && (
        <div className="fixed bottom-4 right-4 z-40 bg-elevated/90 backdrop-blur border border-border p-4 rounded-xl shadow-xl flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-semibold">Uploading dropped files...</span>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-4 text-sm font-black uppercase tracking-wider text-foreground">Delete Material</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to permanently delete “{deleteTarget.title}”? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-600"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[60] min-w-30 rounded-xl border border-border bg-background/95 p-1 shadow-2xl backdrop-blur"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenameTarget({ doc: contextMenu.doc, value: contextMenu.doc.title });
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Rename
          </button>
          <button
            onClick={() => {
              void handlePinToggle(contextMenu.doc, !pinnedIds.has(contextMenu.doc.id));
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
          >
            {pinnedIds.has(contextMenu.doc.id) ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {pinnedIds.has(contextMenu.doc.id) ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => {
              setDeleteTarget(contextMenu.doc);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 px-4 py-8 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-border/80 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Onboarding
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  Welcome to your learning workspace
                </h2>
              </div>
              <button
                onClick={finishOnboarding}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Skip
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-elevated/60 p-5">
              {onboardingStep === 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    Start with the goal that matters most
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Bring in your notes, lessons, or links and let the tutor turn them into guided
                    chats, summaries, and study prompts.
                  </p>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Add your first material</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Upload a PDF, paste a YouTube link, or open the library to build your first
                    study workspace from real content.
                  </p>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Ask your first question</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    The assistant will guide you with prompts and save notes automatically so the
                    experience stays personal and useful.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {[0, 1, 2].map((step) => (
                  <span
                    key={step}
                    className={`h-2.5 w-2.5 rounded-full ${onboardingStep === step ? "bg-primary" : "bg-border"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnboardingStep((prev) => Math.max(0, prev - 1))}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                  disabled={onboardingStep === 0}
                >
                  Back
                </button>
                {onboardingStep < 2 ? (
                  <button
                    onClick={() => setOnboardingStep((prev) => prev + 1)}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={finishOnboarding}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Start learning
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      <AppShell
        title="Chat & Study Workspace"
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
              Cognitive Mode:
            </span>
            <select
              value={cognitiveProfile}
              onChange={(e) => {
                setCognitiveProfile(e.target.value as CognitiveProfile);
                setFocusedMsgIndex(null);
              }}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-ring focus:outline-none"
            >
              <option value="standard">Standard Mode</option>
              <option value="adhd">ADHD & Focus Mode</option>
              <option value="dyslexia">Dyslexia Friendly</option>
              <option value="sensory">Sensory Friendly</option>
            </select>
          </div>
        }
      >
        <div
          className={`flex h-[calc(100dvh-8rem)] min-h-0 flex-1 flex-col gap-6 items-stretch overflow-hidden transition-all duration-300 xl:flex-row ${cognitiveProfile === "sensory" ? "grayscale animate-none" : ""
            }`}
        >
          {/* Left Side: Library Drawer/Column - Chat Sidebar */}
          <div
            className={`shrink-0 flex flex-col transition-all duration-300 ${cognitiveProfile === "adhd" ? "w-full xl:w-64" : "w-full xl:w-72 2xl:w-80"
              }`}
          >
            <Card className="flex h-full min-h-0 flex-col overflow-hidden">
              {/* Search + Add material toggle */}
              <div className="p-4 space-y-3 border-b border-border">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search materials…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-3 text-xs focus:border-ring focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddMaterialForm((visible) => !visible)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {showAddMaterialForm ? "Hide form" : "Add material"}
                  </button>
                </div>

                {showAddMaterialForm && (
                  <div className="mt-2">
                    <MaterialUploader
                      compact
                      onUploaded={(material) => {
                        setMaterials((prev) => [material, ...prev]);
                        setActiveDoc(material);
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${activeFilter === f
                        ? "border-foreground bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents List */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredDocs.length > 0 ? (
                  (() => {
                    const pinnedDocs = filteredDocs.filter((doc) => pinnedIds.has(doc.id) || Boolean(doc.pinned));
                    const regularDocs = filteredDocs.filter((doc) => !pinnedIds.has(doc.id) && !doc.pinned);
                    return (
                      <>
                        {pinnedDocs.length > 0 && (
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Pinned
                          </div>
                        )}
                        {pinnedDocs.map((doc) => {
                          const isSelected = activeDoc?.id === doc.id;
                          const isEditing = renameTarget?.doc.id === doc.id;
                          return (
                            <div key={doc.id} className="group relative border-b border-border/60 last:border-b-0">
                              <div className={`flex items-center gap-2 px-4 py-3 transition ${isSelected ? "bg-elevated font-medium text-foreground" : "hover:bg-elevated/40"}`}>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(doc)}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    setContextMenu({ x: event.clientX, y: event.clientY, doc });
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${isSelected
                                      ? "border-foreground/30 bg-background"
                                      : "border-border bg-elevated"
                                      }`}
                                  >
                                    <doc.icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                      <input
                                        autoFocus
                                        value={renameTarget?.value ?? doc.title}
                                        onChange={(event) => setRenameTarget((current) => current ? { ...current, value: event.target.value } : current)}
                                        onBlur={() => {
                                          if (renameTarget) {
                                            void handleRenameSubmit(doc, renameTarget.value);
                                          }
                                        }}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();
                                            void handleRenameSubmit(doc, renameTarget?.value ?? doc.title);
                                          }
                                          if (event.key === "Escape") {
                                            setRenameTarget(null);
                                          }
                                        }}
                                        className="w-full truncate rounded-md border border-primary/30 bg-background px-2 py-1 text-xs font-semibold text-foreground"
                                      />
                                    ) : (
                                      <div className="truncate text-xs font-semibold text-foreground">{doc.title}</div>
                                    )}
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <span>{doc.type}</span>
                                      <span>·</span>
                                      <span>{doc.updated}</span>
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setContextMenu({ x: event.clientX, y: event.clientY, doc });
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                    aria-label="More options"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 transition-transform ${isSelected ? "text-foreground translate-x-0.5" : "text-muted-foreground"
                                      }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {regularDocs.length > 0 && pinnedDocs.length > 0 && (
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Other materials
                          </div>
                        )}
                        {regularDocs.map((doc) => {
                          const isSelected = activeDoc?.id === doc.id;
                          const isEditing = renameTarget?.doc.id === doc.id;
                          return (
                            <div key={doc.id} className="group relative border-b border-border/60 last:border-b-0">
                              <div className={`flex items-center gap-2 px-4 py-3 transition ${isSelected ? "bg-elevated font-medium text-foreground" : "hover:bg-elevated/40"}`}>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(doc)}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    setContextMenu({ x: event.clientX, y: event.clientY, doc });
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${isSelected
                                      ? "border-foreground/30 bg-background"
                                      : "border-border bg-elevated"
                                      }`}
                                  >
                                    <doc.icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                      <input
                                        autoFocus
                                        value={renameTarget?.value ?? doc.title}
                                        onChange={(event) => setRenameTarget((current) => current ? { ...current, value: event.target.value } : current)}
                                        onBlur={() => {
                                          if (renameTarget) {
                                            void handleRenameSubmit(doc, renameTarget.value);
                                          }
                                        }}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();
                                            void handleRenameSubmit(doc, renameTarget?.value ?? doc.title);
                                          }
                                          if (event.key === "Escape") {
                                            setRenameTarget(null);
                                          }
                                        }}
                                        className="w-full truncate rounded-md border border-primary/30 bg-background px-2 py-1 text-xs font-semibold text-foreground"
                                      />
                                    ) : (
                                      <div className="truncate text-xs font-semibold text-foreground">{doc.title}</div>
                                    )}
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <span>{doc.type}</span>
                                      <span>·</span>
                                      <span>{doc.updated}</span>
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setContextMenu({ x: event.clientX, y: event.clientY, doc });
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                    aria-label="More options"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 transition-transform ${isSelected ? "text-foreground translate-x-0.5" : "text-muted-foreground"
                                      }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-muted-foreground">
                    No materials yet. Add your first lesson or upload a file to start.
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 bg-elevated/20 text-center">
                <Link
                  to="/app/library"
                  className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-2"
                >
                  Manage full library
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Side: Chat Workspace */}
          <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
            <Card
              className={`flex h-full flex-col overflow-hidden transition-all duration-300 ${cognitiveProfile === "dyslexia" ? "bg-[#FAF6EE] border-[#E6DCC8]" : ""
                }`}
            >
              {/* Chat Context Header */}
              <div
                className={`flex items-center justify-between border-b border-border bg-elevated/30 px-5 py-3 ${cognitiveProfile === "dyslexia" ? "border-b-[#E6DCC8] bg-[#F3EFE6]/50" : ""
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary ${cognitiveProfile === "dyslexia" ? "bg-[#E6DCC8] text-[#605544]" : ""
                      }`}
                  >
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`truncate text-xs font-semibold ${cognitiveProfile === "dyslexia" ? "text-[#2D281E]" : "text-foreground"
                        }`}
                    >
                      {activeDoc ? `Chatting with: ${activeDoc.title}` : "General Library Chat"}
                    </h3>
                    <p
                      className={`text-xs truncate ${cognitiveProfile === "dyslexia" ? "text-[#605544]" : "text-muted-foreground"
                        }`}
                    >
                      {activeDoc
                        ? `Grounded in ${activeDoc.type} source`
                        : "Synthesizing across all materials"}
                    </p>
                  </div>
                </div>
                {activeDoc && (
                  <button
                    onClick={() => setActiveDoc(null)}
                    className={`rounded border px-2 py-0.5 text-xs transition ${cognitiveProfile === "dyslexia"
                      ? "border-[#E6DCC8] bg-[#FAF6EE] text-[#605544] hover:bg-[#F3EFE6]"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Clear focus
                  </button>
                )}
              </div>

              {/* Chat Message Feed */}
              <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {showAutoSaveNotice && (
                  <div className="sticky top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border border-emerald-400/20 rounded-full px-4 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce z-20">
                    <Sparkles className="h-3 w-3 text-white" />
                    Concept auto-saved to Digital Notebook in background!
                  </div>
                )}
                {cognitiveProfile === "adhd" && (
                  <p className="mb-2 text-center text-xs text-muted-foreground italic">
                    ADHD Mode: Click any chat bubble to focus attention on that block.
                  </p>
                )}
                {currentMessages.map((msg, i) => {
                  const isAi = msg.from === "ai";
                  const isFocused = focusedMsgIndex === i;
                  const isDimmed = focusedMsgIndex !== null && focusedMsgIndex !== i;
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 transition-all duration-300 ${isAi ? "" : "flex-row-reverse"} ${isDimmed ? "opacity-25 blur-[0.5px]" : "opacity-100"
                        }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${isAi
                          ? cognitiveProfile === "dyslexia"
                            ? "border-[#E6DCC8] bg-[#F3EFE6] text-[#605544]"
                            : "border-primary/20 bg-primary/5 text-primary"
                          : "border-border bg-elevated"
                          }`}
                      >
                        {isAi ? <Sparkles className="h-3 w-3" /> : avatarLabel}
                      </div>
                      <div className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}>
                        <div
                          onClick={() => {
                            if (cognitiveProfile === "adhd") {
                              setFocusedMsgIndex(focusedMsgIndex === i ? null : i);
                            }
                          }}
                          className={`w-fit max-w-[min(${isAi ? "90%" : "70%"},42rem)] rounded-xl border px-3 py-2.5 transition-all shadow-sm ${isAi
                            ? cognitiveProfile === "dyslexia"
                              ? "bg-[#FFFDF9] border-[#E6DCC8] text-[#2D281E]"
                              : "bg-background border-border/80"
                            : cognitiveProfile === "dyslexia"
                              ? "bg-[#F3EFE6] border-[#E6DCC8] text-[#2D281E]"
                              : "bg-foreground text-background border-foreground"
                            } ${isFocused ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : ""} ${cognitiveProfile === "adhd"
                              ? "cursor-pointer hover:border-primary/50"
                              : ""
                            }`}
                        >
                          <p
                            className={`text-xs leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere ${cognitiveProfile === "dyslexia"
                              ? "tracking-wide leading-loose text-[14px]"
                              : ""
                              }`}
                          >
                            {cognitiveProfile === "dyslexia" && isAi
                              ? toBionic(msg.text)
                              : msg.text}
                          </p>
                        </div>
                        <div
                          className={`mt-1.5 flex items-center gap-2 text-[9px] ${isAi ? "text-muted-foreground" : "text-muted-foreground"}`}
                        >
                          <span>{formatTimestamp(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${cognitiveProfile === "dyslexia"
                        ? "border-[#E6DCC8] bg-[#F3EFE6] text-[#605544]"
                        : "border-primary/20 bg-primary/5 text-primary"
                        }`}
                    >
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div
                      className={`max-w-[85%] rounded-lg border p-3.5 flex items-center gap-1.5 ${cognitiveProfile === "dyslexia"
                        ? "bg-[#FFFDF9] border-[#E6DCC8]"
                        : "border-border bg-background"
                        }`}
                    >
                      {cognitiveProfile === "sensory" ? (
                        <span className="text-xs text-muted-foreground font-medium">
                          Tutor is compiling response...
                        </span>
                      ) : (
                        <>
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Semantic Boundary Prompt Anchors (ADHD Focus Helper) */}
              {cognitiveProfile === "adhd" && (
                <div className="px-5 py-2.5 border-t border-border bg-elevated/20 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mr-1.5">
                    Prompt Boundaries:
                  </span>
                  {[
                    "Explain eigenvectors simply",
                    "Test my eigenvalues knowledge",
                    "Summarize backpropagation",
                    "Explain learning rates with analogy",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInputText(prompt)}
                      className="rounded-full border border-primary/20 bg-background hover:bg-primary/5 text-primary px-2.5 py-0.5 text-[9px] font-semibold transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions Toolbar */}
              {currentMessages.length <= 2 && cognitiveProfile !== "adhd" && (
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  {quickPrompts.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSuggestionClick(sug)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition"
                    >
                      {sug} <ArrowUpRight className="h-2.5 w-2.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Message input */}
              <div
                className={`border-t border-border p-4 ${cognitiveProfile === "dyslexia"
                  ? "bg-[#FAF6EE] border-[#E6DCC8]"
                  : "bg-background"
                  }`}
              >
                <div
                  className={`relative rounded-xl border border-border bg-elevated/40 p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all input-glow-pulse ${cognitiveProfile === "dyslexia" ? "border-[#E6DCC8] bg-[#FFFDF9]" : ""
                    }`}
                >
                  <Textarea
                    placeholder="Ask anything across your entire library…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none text-xs min-h-12 max-h-36 py-2 px-3 text-foreground placeholder:text-muted-foreground"
                  />

                  <div className="flex items-center justify-between border-t border-border/40 mt-1 pt-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={attachInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,audio/*,video/*"
                        onChange={(event) => handleAttachFile(event.target.files?.[0])}
                      />
                      <button
                        onClick={() => attachInputRef.current?.click()}
                        className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0"
                        aria-label="Attach file"
                        title="Attach file"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleSend()}
                      disabled={!inputText.trim()}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${inputText.trim()
                        ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                        : "bg-muted text-muted-foreground/60 cursor-not-allowed"
                        }`}
                      aria-label="Send message"
                    >
                      <span>Send</span>
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                  {/* File preview chip */}
                  {attachedFilePreview && (
                    <div className="mx-2 mb-2 mt-1 flex items-center gap-2 rounded-xl border border-border bg-elevated/60 backdrop-blur px-3 py-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        {attachedFilePreview.type.startsWith("image/") ? (
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{attachedFilePreview.name}</p>
                        <p className="text-xs text-muted-foreground">{attachedFilePreview.size}</p>
                      </div>
                      {attachmentMessage ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                      ) : (
                        <button
                          onClick={() => setAttachedFilePreview(null)}
                          className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                          aria-label="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: Gamification, Reminders & Focus Checkpoints */}
          <div className="flex w-full shrink-0 flex-col gap-4 xl:w-72">
            {/* Gamification Dashboard Card */}
            <Card className="p-5 border-primary/20 bg-elevated/50 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                Study progress
              </h3>

              {/* Level & Streak */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">
                    Scholar Level {Math.floor((isHydrated ? xp : 0) / 300) + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isHydrated ? xp : 0} total XP
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-500">
                  {isHydrated ? streak : 0} day streak
                </div>
              </div>

              {/* Progress Bar to next level */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                  <span>Progress to next Rank</span>
                  <span>{(isHydrated ? xp : 0) % 300} / 300 XP</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(((isHydrated ? xp : 0) % 300) / 300) * 100}%` }}
                  />
                </div>
              </div>

              {/* Badges */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <Label className="text-xs text-muted-foreground uppercase font-bold">
                  Highlights
                </Label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {unlockedBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Daily Reminders Nudge Card */}
            <Card className="p-5 border-border bg-card flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                Study reminders
              </h3>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {reminderItems.map((item) => (
                  <div key={item} className="flex items-start gap-1.5 leading-normal">
                    <span className="mt-0.5 text-primary">•</span>
                    <span>{item}</span>
                  </div>
                ))}
                {(isHydrated ? xp : 0) < 1000 && (
                  <div className="flex items-start gap-1.5 leading-normal font-medium text-amber-500">
                    <span className="mt-0.5">•</span>
                    <span>
                      Only {1000 - (isHydrated ? xp : 0)} XP needed to reach the next milestone.
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Focus Checkpoints (ADHD Dopaminergic Loop) */}
            {cognitiveProfile === "adhd" && (
              <Card className="flex flex-col flex-1 overflow-hidden p-5 border-primary/20 bg-elevated/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Focus checkpoints
                </h3>

                {/* Micro-reward Banner */}
                {showReward && (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-center text-xs font-semibold text-emerald-500 animate-bounce">
                    Focus check complete. +15 XP
                  </div>
                )}

                <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto min-h-[200px]">
                  {checkpoints.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-background/70 p-3 text-xs text-muted-foreground">
                      Add your first study goal to see checkpoints here.
                    </div>
                  ) : (
                    checkpoints.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${c.completed
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-background border-border hover:bg-muted"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={c.completed}
                          onChange={() => {
                            const updated = checkpoints.map((item) =>
                              item.id === c.id ? { ...item, completed: !item.completed } : item,
                            );
                            setCheckpoints(updated);
                            if (!c.completed) {
                              const newXp = xp + 15;
                              setXp(newXp);
                              setStoredItem("student_xp", String(newXp));
                              setShowReward(true);
                              setTimeout(() => setShowReward(false), 2000);
                            }
                          }}
                          className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span
                          className={`text-xs leading-tight ${c.completed
                            ? "line-through text-muted-foreground font-medium"
                            : "text-foreground font-semibold"
                            }`}
                        >
                          {c.label}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </AppShell>
    </>
  );
}
