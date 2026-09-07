import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill, Button, Input, Textarea, Label } from "@/components/ui-kit";
import {
  Layers,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Trash2,
  Plus,
  Loader2,
  FileText,
  Flame,
  Trophy,
  RotateCcw,
  BookmarkPlus,
  ArrowRight,
  BrainCircuit,
  BookmarkCheck,
  Zap,
} from "lucide-react";
import { triggerCelebration, unlockBadge } from "@/lib/celebration";
import { SvgBadge } from "@/components/ui/svg-badges";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { CacheManager } from "@/lib/cache";
import { generateGeminiStructured } from "@/lib/gemini";
import { LearningMaterial, mapMaterialRow } from "@/lib/learning-materials";
import { toast } from "sonner";

export const Route = createFileRoute("/app/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — tutor.vigilance.rw" }] }),
  component: FlashcardsPage,
});

const sliceText = (text: string, maxLength: number) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength).trim() + "…" : text;
};


function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "") // remove bold markers
    .replace(/\*/g, "") // remove italic markers
    .replace(/#/g, "") // remove header markers
    .replace(/`/g, "") // remove backticks
    .replace(/^[*\-\+]\s+/gm, "") // remove list indicators
    .replace(/\s+/g, " ") // clean whitespace
    .trim();
}

function generateCardsFromNoteContent(content: string): Array<{ q: string; a: string }> {
  const cards: Array<{ q: string; a: string }> = [];
  if (!content) return cards;

  // Check if AI-generated flashcards block is present
  const flashcardsIdx = content.indexOf("[FLASHCARDS]");
  if (flashcardsIdx !== -1) {
    const block = content.substring(flashcardsIdx);
    const lines = block.split("\n");
    lines.forEach((line) => {
      const match = line.match(/^Q:\s*([^|]+)\|\s*A:\s*(.+)$/i);
      if (match) {
        cards.push({
          q: stripMarkdown(match[1].trim()),
          a: stripMarkdown(match[2].trim()),
        });
      }
    });
    if (cards.length > 0) {
      return cards;
    }
  }

  // Split by headings
  const sections = content.split(/(?=###?#? )/g);
  sections.forEach((sec) => {
    const lines = sec.trim().split("\n");
    const heading = lines[0].replace(/^###* /, "").trim();
    const body = lines.slice(1).join(" ").replace(/\s+/g, " ").trim();
    if (heading && body && body.length > 10) {
      cards.push({
        q: stripMarkdown(`What is the significance of "${heading}"?`),
        a: stripMarkdown(body.substring(0, 220)),
      });
    }
  });

  // Extract bold definitions: **Term**: Definition or **Term** - Definition
  const listRegex = /[*\-]\s+\*\*([^*:]+)\*\*[\s:-]+([^\n]+)/g;
  let listMatch;
  while ((listMatch = listRegex.exec(content)) !== null) {
    cards.push({
      q: stripMarkdown(`What is defined as "${listMatch[1].trim()}"?`),
      a: stripMarkdown(listMatch[2].trim()),
    });
  }

  // Fallback: If no cards were extracted, split by sentences or generate a default one
  if (cards.length === 0) {
    cards.push({
      q: "What is the main topic of this note?",
      a: stripMarkdown(content.substring(0, 150)) || "Please expand the note content to generate detailed study flashcards.",
    });
  }

  // Unique filter
  const unique: typeof cards = [];
  const seen = new Set();
  cards.forEach((c) => {
    const key = c.q.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  });

  return unique.slice(0, 25);
}

function FlashcardsPage() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [dbDecks, setDbDecks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [aiDecks, setAiDecks] = useState<any[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>("");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [unlockedBadgeTitle, setUnlockedBadgeTitle] = useState<string | null>(null);

  // Persistence for deleted card keys and hidden deck IDs
  const [deletedCardKeys, setDeletedCardKeys] = useState<Set<string>>(new Set());
  const [hiddenDeckIds, setHiddenDeckIds] = useState<Set<string>>(new Set());

  // AI Generator modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync deleted keys to localStorage per user
  useEffect(() => {
    if (currentUserId && typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(`purelearn_deleted_flashcard_keys_${currentUserId}`, JSON.stringify(Array.from(deletedCardKeys)));
    }
  }, [deletedCardKeys, currentUserId]);

  // Sync hidden decks to localStorage per user
  useEffect(() => {
    if (currentUserId && typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(`purelearn_hidden_deck_ids_${currentUserId}`, JSON.stringify(Array.from(hiddenDeckIds)));
    }
  }, [hiddenDeckIds, currentUserId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const uid = userData.user.id;
          setCurrentUserId(uid);

          // 1. Fetch strictly authenticated user's own notes
          const { data: userNotes } = await supabase
            .from("notes")
            .select("*")
            .eq("student_id", uid)
            .order("created_at", { ascending: false });

          const stored = window.localStorage.getItem(`digital_notebook_${uid}`) || window.localStorage.getItem("digital_notebook");
          let localNotes: any[] = [];
          try {
            localNotes = stored ? JSON.parse(stored) : [];
          } catch {}

          const allNotes = [...(userNotes || []), ...localNotes];
          const seenNotes = new Set();
          const uniqueNotes: any[] = [];
          allNotes.forEach((n) => {
            if (n.id && !seenNotes.has(n.id)) {
              seenNotes.add(n.id);
              uniqueNotes.push(n);
            }
          });
          setNotes(uniqueNotes);

          // 2. Fetch strictly authenticated user's own flashcard decks from DB
          const { data: userDecks } = await supabase
            .from("flashcard_decks")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false });

          if (userDecks) {
            setDbDecks(
              userDecks.map((d) => ({
                id: d.id,
                title: d.title,
                subject: d.subject || "Flashcards",
                cards: Array.isArray(d.cards) ? d.cards : [],
              }))
            );
          }

          // 3. Load user-scoped AI generated decks
          if (typeof window !== "undefined" && window.localStorage) {
            try {
              const rawAiDecks = localStorage.getItem(`purelearn_ai_custom_decks_${uid}`);
              if (rawAiDecks) {
                setAiDecks(JSON.parse(rawAiDecks));
              }
              const rawDel = localStorage.getItem(`purelearn_deleted_flashcard_keys_${uid}`);
              if (rawDel) {
                setDeletedCardKeys(new Set(JSON.parse(rawDel)));
              }
              const rawHidden = localStorage.getItem(`purelearn_hidden_deck_ids_${uid}`);
              if (rawHidden) {
                setHiddenDeckIds(new Set(JSON.parse(rawHidden)));
              }
            } catch {
              // ignore parse errors
            }
          }

          // 4. Fetch strictly logged-in user's materials for dropdown selector
          const { data: matData } = await supabase
            .from("materials")
            .select("*")
            .eq("uploaded_by", uid)
            .order("created_at", { ascending: false });
          if (matData) {
            setMaterials(matData.map((m) => mapMaterialRow(m)));
          }
        }
      } catch (err) {
        console.warn("Failed to load user-isolated flashcards data:", err);
      }
    };

    fetchData();
  }, []);

  const noteDecks = useMemo(() => {
    return notes.map((n) => {
      const generatedCards = generateCardsFromNoteContent(n.content);
      return {
        id: `note_${n.id}`,
        title: n.title,
        subject: n.subject || "Study Note",
        cards: generatedCards,
      };
    });
  }, [notes]);

  const allDecks = useMemo(() => {
    // Only user's own decks: database decks, user's AI decks, and user's study note decks
    const combined = [...dbDecks, ...aiDecks, ...noteDecks];
    const seen = new Set();
    const unique: typeof combined = [];
    combined.forEach((d) => {
      if (d.id && !seen.has(d.id)) {
        seen.add(d.id);
        unique.push(d);
      }
    });
    return unique;
  }, [dbDecks, aiDecks, noteDecks]);

  const visibleDecks = useMemo(() => {
    return allDecks.filter((d) => !hiddenDeckIds.has(d.id));
  }, [allDecks, hiddenDeckIds]);

  // Keep activeDeckId synchronized with available user decks
  useEffect(() => {
    if (visibleDecks.length > 0) {
      if (!activeDeckId || !visibleDecks.some((d) => d.id === activeDeckId)) {
        setActiveDeckId(visibleDecks[0].id);
        setCurrentCardIdx(0);
        setShowAnswer(false);
      }
    } else {
      setActiveDeckId("");
    }
  }, [visibleDecks, activeDeckId]);

  const selectedDeck = useMemo(() => {
    if (visibleDecks.length === 0) return null;
    return visibleDecks.find((d) => d.id === activeDeckId) || visibleDecks[0];
  }, [visibleDecks, activeDeckId]);

  const activeDeckCards = useMemo(() => {
    if (!selectedDeck) return [];
    return selectedDeck.cards.filter((card: { q: string; a: string }) => {
      const key = `${selectedDeck.id}_${card.q}`;
      return !deletedCardKeys.has(key);
    });
  }, [selectedDeck, deletedCardKeys]);

  const currentCard = activeDeckCards[currentCardIdx] || { q: "No active cards", a: "No active cards" };
  const progressPercent = activeDeckCards.length > 0 ? Math.round((currentCardIdx / activeDeckCards.length) * 100) : 0;

  const completeSession = () => {
    setSessionCompleted(true);
    triggerCelebration({ particleCount: 85 });
    const badge = unlockBadge("first_flashcard_mastery");
    if (badge) {
      setUnlockedBadgeTitle(badge.title);
    }
    const bonus = 30 + (score.correct * 5);
    setEarnedXp(bonus);
  };

  const handleNext = () => {
    if (activeDeckCards.length === 0) return;
    if (currentCardIdx >= activeDeckCards.length - 1) {
      completeSession();
      return;
    }
    setShowAnswer(false);
    setCurrentCardIdx((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (activeDeckCards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev - 1 + activeDeckCards.length) % activeDeckCards.length);
  };

  const selectDeck = (deck: typeof allDecks[number]) => {
    setActiveDeckId(deck.id);
    setCurrentCardIdx(0);
    setShowAnswer(false);
    setSessionCompleted(false);
    setScore({ correct: 0, incorrect: 0 });
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenDeckIds((prev) => {
      const next = new Set(prev);
      next.add(deckId);
      return next;
    });

    if (currentUserId) {
      try {
        await supabase
          .from("flashcard_decks")
          .delete()
          .eq("id", deckId)
          .eq("user_id", currentUserId);
      } catch (err) {
        console.warn("Could not delete deck from DB:", err);
      }

      const updatedDb = dbDecks.filter((d) => d.id !== deckId);
      setDbDecks(updatedDb);

      const updatedAi = aiDecks.filter((d) => d.id !== deckId);
      setAiDecks(updatedAi);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`purelearn_ai_custom_decks_${currentUserId}`, JSON.stringify(updatedAi));
      }
    }

    toast.success("Deck removed.");
    if (activeDeckId === deckId) {
      const remaining = visibleDecks.filter((d) => d.id !== deckId);
      if (remaining.length > 0) {
        setActiveDeckId(remaining[0].id);
        setCurrentCardIdx(0);
        setShowAnswer(false);
      } else {
        setActiveDeckId("");
      }
    }
  };

  const handleDeleteCard = () => {
    if (activeDeckCards.length === 0 || !selectedDeck) return;
    const card = activeDeckCards[currentCardIdx];
    const key = `${selectedDeck.id}_${card.q}`;
    setDeletedCardKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    toast.success("Card deleted from deck.");
    setShowAnswer(false);
    if (currentCardIdx > 0) {
      setCurrentCardIdx((prev) => prev - 1);
    } else {
      setCurrentCardIdx(0);
    }
  };

  // Generate AI Flashcards using Gemini structured JSON schema
  const handleGenerateAiDeck = async () => {
    const mat = materials.find((m) => m.id === selectedMaterialId);
    const topic = customTopic.trim() || mat?.title || "Key Subject Concepts";

    if (!topic && !mat) {
      toast.error("Please enter a topic or select a study material.");
      return;
    }

    setIsGenerating(true);
    try {
      const flashcardsSchema = {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          subject: { type: "STRING" },
          cards: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                q: { type: "STRING" },
                a: { type: "STRING" },
              },
              required: ["q", "a"],
            },
          },
        },
        required: ["title", "subject", "cards"],
      };

      const sourceContent = mat?.content
        ? `\n\nStudy Material Text:\n${mat.content.slice(0, 4000)}`
        : "";

      const prompt = `You are a world-class AI professor creating precision study flashcards for students.
Generate 8-12 high-impact, key-point flashcards for mastering the topic: "${topic}".
Each question must target a fundamental key concept, definition, or equation. Each answer must be concise, accurate, and pedagogically clear.${sourceContent}`;

      const res = await generateGeminiStructured<{
        title: string;
        subject: string;
        cards: Array<{ q: string; a: string }>;
      }>({
        systemInstruction: "You generate precision educational flashcard decks in valid JSON.",
        prompt,
        responseSchema: flashcardsSchema,
      });

      const cleanedCards = res.data.cards.map((c) => ({
        q: stripMarkdown(c.q),
        a: stripMarkdown(c.a),
      }));

      const newDeck = {
        id: `ai_deck_${Date.now()}`,
        title: res.data.title || topic,
        subject: res.data.subject || mat?.type || "AI Mastery Deck",
        cards: cleanedCards,
      };

      if (currentUserId) {
        try {
          const { data: insertedDeck } = await supabase
            .from("flashcard_decks")
            .insert({
              title: newDeck.title,
              subject: newDeck.subject,
              user_id: currentUserId,
              cards: newDeck.cards,
            })
            .select()
            .single();

          if (insertedDeck) {
            newDeck.id = insertedDeck.id;
          }
        } catch (dbErr) {
          console.warn("Could not save AI deck to database:", dbErr);
        }

        const nextAiDecks = [newDeck, ...aiDecks];
        setAiDecks(nextAiDecks);
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(`purelearn_ai_custom_decks_${currentUserId}`, JSON.stringify(nextAiDecks));
        }
      } else {
        setAiDecks((prev) => [newDeck, ...prev]);
      }

      setActiveDeckId(newDeck.id);
      setCurrentCardIdx(0);
      setShowAnswer(false);
      setShowAiModal(false);
      setCustomTopic("");
      setSelectedMaterialId("");
      toast.success("AI Flashcard Deck generated successfully!");
    } catch (err) {
      console.error("AI Flashcard generation error:", err);
      toast.error("Failed to generate AI flashcards. Please check your network connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Canvas Card Exporter (Flashcard-to-Image Engine)
  const exportCardToImage = () => {
    if (activeDeckCards.length === 0 || !selectedDeck) return;
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 800, 500);

    // Draw light card borders
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 770, 470);

    // Header metadata
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Purelearn.ai", 45, 65);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText(
      "Purelearn.ai  •  " + selectedDeck.subject.toUpperCase() + " STUDY GUIDE",
      45,
      90,
    );

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("STUDY FLASHCARD", 640, 65);

    // Divider line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 115);
    ctx.lineTo(755, 115);
    ctx.stroke();

    const wrapText = (textStr: string, startX: number, startY: number, maxW: number, lineH: number) => {
      const words = textStr.split(" ");
      let currentLine = "";
      let currentY = startY;
      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && n > 0) {
          ctx.fillText(currentLine, startX, currentY);
          currentLine = words[n] + " ";
          currentY += lineH;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine, startX, currentY);
      return currentY + lineH;
    };

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("QUESTION:", 45, 155);

    ctx.fillStyle = "#0f172a";
    ctx.font = "semibold 18px sans-serif";
    const nextY = wrapText(currentCard.q, 45, 185, 710, 26);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("ANSWER:", 45, nextY + 15);

    ctx.fillStyle = "#334155";
    ctx.font = "normal 18px sans-serif";
    wrapText(currentCard.a, 45, nextY + 45, 710, 26);

    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.fillText(
      "Classroom Verified Material  •  Card " +
      (currentCardIdx + 1) +
      " of " +
      activeDeckCards.length,
      45,
      445,
    );

    const link = document.createElement("a");
    link.download = `flashcard-${selectedDeck.id}-${currentCardIdx + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <AppShell title="Flashcard Decks">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column: Decks List */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Decks ({visibleDecks.length})
            </h2>
            <Button
              onClick={() => setShowAiModal(true)}
              className="text-xs font-bold gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            >
              <BrainCircuit className="h-3.5 w-3.5" /> Create AI Deck
            </Button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {visibleDecks.map((deck) => {
              const activeCount = deck.cards.filter((c: { q: string; a: string }) => !deletedCardKeys.has(`${deck.id}_${c.q}`)).length;
              const isSelected = selectedDeck && selectedDeck.id === deck.id;
              return (
                <Card
                  key={deck.id}
                  onClick={() => selectDeck(deck)}
                  className={`relative group/deck cursor-pointer p-4 transition text-left border ${isSelected
                      ? "border-foreground ring-1 ring-foreground bg-elevated/40"
                      : "border-border hover:bg-elevated/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[140px]"
                      title={deck.subject}
                    >
                      {sliceText(deck.subject, 18)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Pill className="text-[10px]">{activeCount} cards</Pill>
                      <button
                        onClick={(e) => handleDeleteDeck(deck.id, e)}
                        className="opacity-60 group-hover/deck:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                        title="Delete Deck"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3
                    className="mt-2 text-sm font-semibold text-foreground pr-5 truncate"
                    title={deck.title}
                  >
                    {sliceText(deck.title, 32)}
                  </h3>
                </Card>
              );
            })}

            {visibleDecks.length === 0 && (
              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">No active decks remaining.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Flashcard Workspace */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {sessionCompleted ? (
            <Card className="w-full max-w-2xl p-8 md:p-10 text-center border border-primary/30 bg-elevated/80 shadow-2xl rounded-2xl flex flex-col items-center justify-center animate-fade-in">
              <div className="relative mb-4">
                <SvgBadge type="Flashcard Ace" size={64} />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Session Mastery Accomplished
              </span>
              <h2 className="mt-1 text-2xl font-black text-foreground">
                Deck Review Complete!
              </h2>
              <p className="mt-2 text-xs text-muted-foreground max-w-md leading-relaxed">
                You've successfully reviewed all {activeDeckCards.length} flashcards in <span className="font-semibold text-foreground">"{selectedDeck?.title}"</span>.
              </p>

              {/* Variable Rewards Card */}
              <div className="my-6 grid grid-cols-3 gap-3 w-full max-w-md">
                <div className="p-3 rounded-xl border border-border/80 bg-background flex flex-col items-center">
                  <span className="text-emerald-500 text-lg font-black">
                    {score.correct}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Understood</span>
                </div>
                <div className="p-3 rounded-xl border border-border/80 bg-background flex flex-col items-center">
                  <span className="text-red-500 text-lg font-black">
                    {score.incorrect}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Need Review</span>
                </div>
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-500 text-lg font-black">
                    <Flame className="h-4 w-4 fill-current" /> +{earnedXp}
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">XP Bonus</span>
                </div>
              </div>

              {unlockedBadgeTitle && (
                <div className="mb-6 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary flex items-center gap-2 text-xs font-bold animate-pulse">
                  <Trophy className="h-4 w-4" />
                  <span>Badge Unlocked: {unlockedBadgeTitle}!</span>
                </div>
              )}

              {/* Investment Prompt (Hook Cycle) */}
              <div className="w-full max-w-md pt-5 border-t border-border/60 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                  <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" /> Invest in Your Knowledge Vault:
                </span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={async () => {
                      try {
                        const { data: userData } = await supabase.auth.getUser();
                        if (userData?.user && selectedDeck) {
                          const summaryContent = `# Flashcard Study Review: ${selectedDeck.title}\n\n**Subject:** ${selectedDeck.subject}\n**Completed:** ${new Date().toLocaleDateString()}\n**Performance:** ${score.correct} understood, ${score.incorrect} reviewed.\n\n### Key Concepts Covered:\n${activeDeckCards.map((c: any, i: number) => `${i + 1}. **${c.q}**\n   - *${c.a}*`).join("\n\n")}`;
                          
                          await supabase.from("notes").insert({
                            student_id: userData.user.id,
                            title: `${selectedDeck.title} — Review Summary`,
                            subject: selectedDeck.subject,
                            content: summaryContent,
                            is_ai_generated: false,
                          });
                          unlockBadge("knowledge_investor");
                          toast.success("Deck summary saved into Notes! +40 XP");
                        }
                      } catch (err) {
                        toast.error("Could not save to notes.");
                      }
                    }}
                    className="flex-1 min-h-[44px] rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" /> Save Summary to Notes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentCardIdx(0);
                      setShowAnswer(false);
                      setSessionCompleted(false);
                      setScore({ correct: 0, incorrect: 0 });
                    }}
                    className="min-h-[44px] rounded-xl text-xs font-bold border-border bg-background hover:bg-muted text-foreground gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Practice Again
                  </Button>
                </div>
              </div>
            </Card>
          ) : visibleDecks.length === 0 ? (
            <Card className="w-full max-w-2xl p-12 text-center border border-dashed border-border rounded-2xl flex flex-col items-center justify-center min-h-[340px]">
              <Layers className="h-10 w-10 text-muted-foreground mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-foreground mb-2">No Flashcards Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                You don't have any flashcard decks yet. Click below to generate AI flashcards from your study materials or any concept.
              </p>
              <Button
                onClick={() => setShowAiModal(true)}
                className="gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground"
              >
                <BrainCircuit className="h-4 w-4" /> Create AI Flashcards
              </Button>
            </Card>
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              {/* Stats Header */}
              <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground bg-elevated/40 border border-border/50 px-4 py-3 rounded-xl shadow-inner w-full">
                <div className="flex items-center gap-2 truncate max-w-[240px]">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate font-semibold text-foreground" title={selectedDeck?.title}>
                    {sliceText(selectedDeck?.title || "Deck", 24)}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({activeDeckCards.length > 0 ? currentCardIdx + 1 : 0}/{activeDeckCards.length})
                  </span>
                </div>
                <div className="flex gap-3 shrink-0">
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {score.correct} Understood
                  </span>
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                    {score.incorrect} Review
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-muted border border-border/40 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full shadow-sm shadow-primary/30"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Flashcard Box */}
              <div
                onClick={() => {
                  if (activeDeckCards.length > 0) {
                    setShowAnswer(!showAnswer);
                  }
                }}
                className="group relative min-h-[340px] w-full cursor-pointer rounded-2xl border border-border bg-background shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-8 text-center select-none overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  {showAnswer ? "Answer Context" : "Question Context"}
                </div>

                <div className="my-auto py-6 px-4 flex justify-center items-center w-full">
                  {activeDeckCards.length > 0 ? (
                    <p className="text-base md:text-lg font-medium leading-relaxed text-foreground whitespace-pre-line tracking-wide">
                      {showAnswer ? currentCard.a : currentCard.q}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      All cards deleted from this deck.
                    </p>
                  )}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5 bg-muted/30 py-2.5 rounded-xl border border-border/40 max-w-xs mx-auto px-4 group-hover:bg-muted/65 transition-all">
                  <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin-slow" />
                  Click card to flip
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="rounded-xl p-2.5 border border-border bg-background hover:bg-muted text-foreground"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    className="rounded-xl p-2.5 border border-border bg-background hover:bg-muted text-foreground"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCardToImage}
                    disabled={activeDeckCards.length === 0}
                    className="rounded-xl inline-flex items-center gap-1.5 px-4 font-bold border border-border bg-background hover:bg-muted text-foreground text-xs"
                    title="Export Card to Image"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" /> Export Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteCard}
                    disabled={activeDeckCards.length === 0}
                    className="rounded-xl inline-flex items-center gap-1.5 px-4 font-bold border border-red-200 bg-background hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-muted-foreground transition text-xs"
                    title="Delete this flashcard"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Card
                  </Button>
                </div>

                {showAnswer && activeDeckCards.length > 0 && (
                  <div className="flex gap-2 animate-fade-in">
                    <Button
                      onClick={() => {
                        const newIncorrect = score.incorrect + 1;
                        setScore((s) => ({ ...s, incorrect: newIncorrect }));
                        if (currentCardIdx >= activeDeckCards.length - 1) {
                          completeSession();
                        } else {
                          handleNext();
                        }
                      }}
                      className="rounded-xl min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-extrabold cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" /> Review
                    </Button>
                    <Button
                      onClick={() => {
                        const newCorrect = score.correct + 1;
                        setScore((s) => ({ ...s, correct: newCorrect }));
                        if (currentCardIdx >= activeDeckCards.length - 1) {
                          completeSession();
                        } else {
                          handleNext();
                        }
                      }}
                      className="rounded-xl min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-extrabold cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Understood
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Flashcard Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-lg p-6 space-y-5 border border-border bg-background shadow-2xl rounded-2xl relative">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Create AI Flashcard Deck</h3>
                  <p className="text-xs text-muted-foreground">Generate key point questions & concise answers using Gemini AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1.5 block">Select Study Material (Optional)</Label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose from your uploaded materials --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.type}: {sliceText(m.title, 45)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground mb-1.5 block">Custom Subject or Topic</Label>
                <Input
                  type="text"
                  placeholder="e.g. Organic Chemistry Functional Groups, Fourier Transforms, World War II"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAiModal(false)}
                disabled={isGenerating}
                className="text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateAiDeck}
                disabled={isGenerating}
                className="text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating Deck...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Generate Deck
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

