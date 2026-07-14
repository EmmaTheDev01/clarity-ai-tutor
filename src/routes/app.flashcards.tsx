import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill, Button } from "@/components/ui-kit";
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
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { CacheManager } from "@/lib/cache";
import { toast } from "sonner";

export const Route = createFileRoute("/app/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — tutor.vigilance.rw" }] }),
  component: FlashcardsPage,
});

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
        q: "What does det(A - lambda I) = 0 compute?",
        a: "The characteristic equation used to solve for the eigenvalues of a square matrix.",
      },
      {
        q: "What is a basis of a vector space?",
        a: "A set of linearly independent vectors that span the entire vector space.",
      },
      {
        q: "When is a square matrix diagonalizable?",
        a: "When it has n linearly independent eigenvectors, allowing it to be decomposed into PDP inverse.",
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
    .replace(/\*/g, "")  // remove italic markers
    .replace(/#/g, "")   // remove header markers
    .replace(/`/g, "")   // remove backticks
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
      return cards; // Return only smart AI flashcards!
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
  
  return unique.slice(0, 20); // Max 20 cards per note
}

function FlashcardsPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>("deck1");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [deletedCardKeys, setDeletedCardKeys] = useState<Set<string>>(() => new Set());
  const [hiddenDeckIds, setHiddenDeckIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const cacheKey = `notes_data_${userData.user.id}`;
          const cached = CacheManager.get(cacheKey);
          if (cached) {
            setNotes(cached.notes);
            return;
          }

          const { data: dbNotes } = await supabase
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false });

          // Load from LocalStorage fallback
          const stored = window.localStorage.getItem("digital_notebook");
          const localNotes = stored ? JSON.parse(stored) : [];

          const allNotes = [...(dbNotes || []), ...localNotes];
          
          // Unique by ID or title
          const seen = new Set();
          const uniqueNotes: any[] = [];
          allNotes.forEach((n) => {
            if (n.id && !seen.has(n.id)) {
              seen.add(n.id);
              uniqueNotes.push(n);
            }
          });
          setNotes(uniqueNotes);
        }
      } catch (err) {
        console.warn("Failed to load notes for flashcards:", err);
      }
    };
    fetchNotes();
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
    return [...noteDecks, ...defaultDecks];
  }, [noteDecks]);

  const visibleDecks = useMemo(() => {
    return allDecks.filter((d) => !hiddenDeckIds.has(d.id));
  }, [allDecks, hiddenDeckIds]);

  const selectedDeck = useMemo(() => {
    return visibleDecks.find((d) => d.id === activeDeckId) || visibleDecks[0];
  }, [visibleDecks, activeDeckId]);

  const activeDeckCards = useMemo(() => {
    if (!selectedDeck) return [];
    return selectedDeck.cards.filter((card) => {
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
    toast.success("Deck removed from list.");
    if (activeDeckId === deckId) {
      const remaining = allDecks.filter((d) => d.id !== deckId && !hiddenDeckIds.has(d.id));
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
    toast.success("Card deleted from session deck.");
    setShowAnswer(false);
    if (currentCardIdx > 0) {
      setCurrentCardIdx((prev) => prev - 1);
    } else {
      setCurrentCardIdx(0);
    }
  };

  // Canvas Card Exporter (Flashcard-to-Image Engine)
  const exportCardToImage = () => {
    if (activeDeckCards.length === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 800, 500);

    // Draw light card borders
    ctx.strokeStyle = "#cbd5e1"; // slate-300
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 770, 470);

    // Logo & header metadata
    ctx.fillStyle = "#0f172a"; // dark slate
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("CLARITY AI TUTOR", 45, 65);

    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "12px tracking-wider sans-serif";
    ctx.fillText(
      "Purelearn.ai  •  " + selectedDeck.subject.toUpperCase() + " STUDY GUIDE",
      45,
      90,
    );

    // Draw active card mode tag
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("STUDY FLASHCARD", 640, 65);

    // Divider line
    ctx.strokeStyle = "#e2e8f0"; // slate-200
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 115);
    ctx.lineTo(755, 115);
    ctx.stroke();

    // Helper function for wrapping text
    const wrapText = (textStr: string, startX: number, startY: number, maxW: number, lineH: number) => {
      const words = textStr.split(" ");
      let currentLine = "";
      let currentY = startY;
      for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxW && n > 0) {
          ctx.fillText(currentLine, startX, currentY);
          currentLine = words[n] + " ";
          currentY += lineH;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine, startX, currentY);
      return currentY + lineH; // Return next Y position
    };

    // Draw Question block
    ctx.fillStyle = "#64748b"; // label color
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("QUESTION:", 45, 155);

    ctx.fillStyle = "#0f172a"; // text color
    ctx.font = "semibold 18px sans-serif";
    let nextY = wrapText(currentCard.q, 45, 185, 710, 26);

    // Draw Answer block
    ctx.fillStyle = "#10b981"; // emerald green label
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("ANSWER:", 45, nextY + 15);

    ctx.fillStyle = "#334155"; // slightly softer dark text
    ctx.font = "normal 18px sans-serif";
    wrapText(currentCard.a, 45, nextY + 45, 710, 26);

    // Branding signature footer
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "11px sans-serif";
    ctx.fillText(
      "Classroom Verified Material  •  Card " +
      (currentCardIdx + 1) +
      " of " +
      activeDeckCards.length,
      45,
      445,
    );

    // Download URL triggering
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
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Decks
          </h2>
          <div className="space-y-2">
            {visibleDecks.map((deck) => (
              <Card
                key={deck.id}
                onClick={() => selectDeck(deck)}
                className={`relative group/deck cursor-pointer p-4 transition text-left border ${
                  selectedDeck && selectedDeck.id === deck.id
                    ? "border-foreground ring-1 ring-foreground bg-elevated/40"
                    : "border-border hover:bg-elevated/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {deck.subject}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Pill className="text-[10px]">{deck.cards.filter(c => !deletedCardKeys.has(`${deck.id}_${c.q}`)).length} cards</Pill>
                    <button
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                      className="lg:opacity-0 lg:group-hover/deck:opacity-100 p-0.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                      title="Hide Deck"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground pr-5">{deck.title}</h3>
              </Card>
            ))}
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
              <p className="text-xs text-muted-foreground max-w-sm">
                All course decks have been removed from the session. Create new AI notes to automatically populate smart flashcard decks.
              </p>
            </Card>
          ) : (
            <div className="w-full max-w-2xl space-y-6">
              {/* Stats Header */}
              <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground bg-elevated/40 border border-border/50 px-4 py-3 rounded-xl shadow-inner w-full">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Card {activeDeckCards.length > 0 ? currentCardIdx + 1 : 0} of {activeDeckCards.length}
                </span>
                <div className="flex gap-3">
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">✓ {score.correct} Understood</span>
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full">✗ {score.incorrect} Not Understood</span>
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
                      All cards deleted or no content available in this deck.
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
                <div className="flex gap-2">
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
                    title="Delete this card"
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
                      <X className="h-3.5 w-3.5" /> Not Understood
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
    </AppShell>
  );
}
