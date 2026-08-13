import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill, Button, Input, Textarea, Label } from "@/components/ui-kit";
import {
  Layers,
  Sparkles,
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
} from "lucide-react";
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

const defaultDecks = [
  {
    id: "deck1",
    title: "Linear Algebra Fundamentals",
    subject: "Mathematics",
    cards: [
      {
        q: "What is an eigenvector?",
        a: "A non-zero vector that only rescales by a scalar factor called the eigenvalue when a linear transformation is applied.",
      },
      {
        q: "What is an eigenvalue?",
        a: "The scalar factor by which an eigenvector is scaled during a linear transformation.",
      },
      {
        q: "What does det(A - λI) = 0 compute?",
        a: "The characteristic equation used to solve for the eigenvalues of a square matrix.",
      },
      {
        q: "What is a basis of a vector space?",
        a: "A set of linearly independent vectors that span the entire vector space.",
      },
      {
        q: "When is a square matrix diagonalizable?",
        a: "When it has n linearly independent eigenvectors, allowing it to be decomposed into P D P⁻¹.",
      },
      {
        q: "What is the rank of a matrix?",
        a: "The maximum number of linearly independent column vectors or row vectors in the matrix.",
      },
      {
        q: "What is the null space of a matrix?",
        a: "The set of all vectors that result in the zero vector when multiplied by the matrix.",
      },
      {
        q: "What is the determinant of a matrix?",
        a: "A scalar value that measures how much a linear transformation scales areas or volumes.",
      },
      {
        q: "When is a matrix invertible?",
        a: "When its determinant is non-zero, meaning its columns are linearly independent.",
      },
      {
        q: "What is an orthogonal matrix?",
        a: "A square matrix whose transpose is equal to its inverse, preserving lengths and angles.",
      },
    ],
  },
  {
    id: "deck2",
    title: "Neural Networks & Backprop",
    subject: "Artificial Intelligence",
    cards: [
      {
        q: "What is backpropagation?",
        a: "An algorithm that calculates gradients of the loss function with respect to weights using the chain rule backward layer by layer.",
      },
      {
        q: "What is the purpose of an activation function?",
        a: "To introduce non-linearity into the network, allowing it to learn and model complex, non-linear relationships.",
      },
      {
        q: "What is overfitting in machine learning?",
        a: "When a model learns the details and noise of the training data too well, resulting in poor generalization to new data.",
      },
      {
        q: "What is gradient descent?",
        a: "An optimization algorithm used to minimize loss by iteratively moving in the direction of steepest descent.",
      },
      {
        q: "What is a loss function?",
        a: "A mathematical function that measures how far a model's predictions are from the actual target values.",
      },
      {
        q: "What is the vanishing gradient problem?",
        a: "When gradients become extremely small during backpropagation, preventing weights in early layers from updating.",
      },
      {
        q: "What is the learning rate?",
        a: "A hyperparameter that controls the step size taken towards the minimum of a loss function at each iteration.",
      },
      {
        q: "What is the difference between an epoch and a batch?",
        a: "An epoch is one full pass through the entire dataset, while a batch is a small subset of the dataset processed at once.",
      },
      {
        q: "What is regularization?",
        a: "A set of techniques like L1 or L2 normalization used to prevent overfitting by penalizing large weights.",
      },
      {
        q: "What is dropout in neural networks?",
        a: "A regularization technique where randomly selected neurons are ignored during training to reduce co-dependency.",
      },
    ],
  },
];

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
  const [notes, setNotes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [aiDecks, setAiDecks] = useState<any[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>("deck1");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  // Persistence for deleted card keys and hidden deck IDs
  const [deletedCardKeys, setDeletedCardKeys] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !window.localStorage) return new Set();
    try {
      const raw = localStorage.getItem("purelearn_deleted_flashcard_keys");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [hiddenDeckIds, setHiddenDeckIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !window.localStorage) return new Set();
    try {
      const raw = localStorage.getItem("purelearn_hidden_deck_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // AI Generator modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync deleted keys to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("purelearn_deleted_flashcard_keys", JSON.stringify(Array.from(deletedCardKeys)));
    }
  }, [deletedCardKeys]);

  // Sync hidden decks to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("purelearn_hidden_deck_ids", JSON.stringify(Array.from(hiddenDeckIds)));
    }
  }, [hiddenDeckIds]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: dbNotes } = await supabase
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false });

          const stored = window.localStorage.getItem("digital_notebook");
          const localNotes = stored ? JSON.parse(stored) : [];

          const allNotes = [...(dbNotes || []), ...localNotes];
          const seen = new Set();
          const uniqueNotes: any[] = [];
          allNotes.forEach((n) => {
            if (n.id && !seen.has(n.id)) {
              seen.add(n.id);
              uniqueNotes.push(n);
            }
          });
          setNotes(uniqueNotes);

          // Fetch materials for dropdown selector
          const { data: matData } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
          if (matData) {
            setMaterials(matData.map((m) => mapMaterialRow(m)));
          }
        }
      } catch (err) {
        console.warn("Failed to load notes or materials for flashcards:", err);
      }
    };

    // Load custom AI generated decks stored in localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const rawAiDecks = localStorage.getItem("purelearn_ai_custom_decks");
        if (rawAiDecks) {
          setAiDecks(JSON.parse(rawAiDecks));
        }
      } catch {
        // ignore parse error
      }
    }

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
    return [...aiDecks, ...noteDecks, ...defaultDecks];
  }, [aiDecks, noteDecks]);

  const visibleDecks = useMemo(() => {
    return allDecks.filter((d) => !hiddenDeckIds.has(d.id));
  }, [allDecks, hiddenDeckIds]);

  const selectedDeck = useMemo(() => {
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

  const handleNext = () => {
    if (activeDeckCards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev + 1) % activeDeckCards.length);
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
    setScore({ correct: 0, incorrect: 0 });
  };

  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenDeckIds((prev) => {
      const next = new Set(prev);
      next.add(deckId);
      return next;
    });

    // If deck was an AI custom deck, purge from aiDecks state and localStorage
    if (deckId.startsWith("ai_deck_")) {
      const updatedAi = aiDecks.filter((d) => d.id !== deckId);
      setAiDecks(updatedAi);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("purelearn_ai_custom_decks", JSON.stringify(updatedAi));
      }
    }

    toast.success("Deck deleted.");
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

      const newDeck = {
        id: `ai_deck_${Date.now()}`,
        title: res.data.title || topic,
        subject: res.data.subject || mat?.type || "AI Mastery Deck",
        cards: res.data.cards.map((c) => ({
          q: stripMarkdown(c.q),
          a: stripMarkdown(c.a),
        })),
      };

      const nextAiDecks = [newDeck, ...aiDecks];
      setAiDecks(nextAiDecks);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("purelearn_ai_custom_decks", JSON.stringify(nextAiDecks));
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
              <Sparkles className="h-3.5 w-3.5" /> Create AI Deck
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
          {visibleDecks.length === 0 ? (
            <Card className="w-full max-w-2xl p-12 text-center border border-dashed border-border rounded-2xl flex flex-col items-center justify-center min-h-[340px]">
              <Layers className="h-10 w-10 text-muted-foreground mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-foreground mb-2">No Decks Available</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                All course decks have been removed. Click below to generate precision key-point flashcards using Gemini AI.
              </p>
              <Button
                onClick={() => setShowAiModal(true)}
                className="gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground"
              >
                <Sparkles className="h-4 w-4" /> Create AI Flashcards
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
                    ✓ {score.correct} Understood
                  </span>
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                    ✗ {score.incorrect} Review
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
                        setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }));
                        handleNext();
                      }}
                      className="rounded-xl inline-flex items-center gap-1.5 px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-extrabold"
                    >
                      <X className="h-3.5 w-3.5" /> Review
                    </Button>
                    <Button
                      onClick={() => {
                        setScore((s) => ({ ...s, correct: s.correct + 1 }));
                        handleNext();
                      }}
                      className="rounded-xl inline-flex items-center gap-1.5 px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-extrabold"
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
                  <Sparkles className="h-5 w-5" />
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
                    <Sparkles className="h-4 w-4" /> Generate Deck
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

