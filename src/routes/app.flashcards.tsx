import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import {
  Layers,
  Sparkles,
  Check,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { MarkdownRenderer } from "@/components/markdown";

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
        a: "A non-zero vector v that only rescales by a factor λ (eigenvalue) when a matrix A is applied: Av = λv.",
      },
      {
        q: "What does det(A − λI) = 0 compute?",
        a: "The characteristic equation used to solve for eigenvalues of matrix A.",
      },
      {
        q: "What is a basis?",
        a: "A set of linearly independent vectors that span a given vector space.",
      },
      {
        q: "When is a matrix diagonalizable?",
        a: "When it has n linearly independent eigenvectors, allowing it to be decomposed into PDP⁻¹.",
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
        a: "An algorithm that calculates gradients of the loss function with respect to weights using the chain rule backward layer-by-layer.",
      },
      {
        q: "What is the purpose of an activation function?",
        a: "To introduce non-linearity into the network, allowing it to learn and model complex, non-linear relationships.",
      },
      {
        q: "What is overfitting?",
        a: "When a model learns the details and noise of the training data too well, resulting in poor generalization to new data.",
      },
    ],
  },
];

function generateCardsFromNoteContent(content: string): Array<{ q: string; a: string }> {
  const cards: Array<{ q: string; a: string }> = [];
  if (!content) return cards;

  // Split by headings
  const sections = content.split(/(?=###?#? )/g);
  sections.forEach((sec) => {
    const lines = sec.trim().split("\n");
    const heading = lines[0].replace(/^###* /, "").trim();
    const body = lines.slice(1).join(" ").replace(/\s+/g, " ").trim();
    if (heading && body && body.length > 10) {
      cards.push({
        q: `What is the significance of "${heading}"?`,
        a: body.substring(0, 220) + (body.length > 220 ? "..." : ""),
      });
    }
  });

  // Extract bold definitions: **Term**: Definition or **Term** - Definition
  const listRegex = /[*\-]\s+\*\*([^*:]+)\*\*[\s:-]+([^\n]+)/g;
  let listMatch;
  while ((listMatch = listRegex.exec(content)) !== null) {
    cards.push({
      q: `What is defined as "${listMatch[1].trim()}"?`,
      a: listMatch[2].trim(),
    });
  }

  // Fallback: If no cards were extracted, split by sentences or generate a default one
  if (cards.length === 0) {
    cards.push({
      q: "What is the main topic of this note?",
      a: content.substring(0, 150) + (content.length > 150 ? "..." : "") || "Please expand the note content to generate detailed study flashcards.",
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
  
  return unique.slice(0, 10); // Max 10 cards per note
}

function FlashcardsPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>("deck1");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
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

  const selectedDeck = useMemo(() => {
    return allDecks.find((d) => d.id === activeDeckId) || allDecks[0] || defaultDecks[0];
  }, [allDecks, activeDeckId]);

  const currentCard = selectedDeck.cards[currentCardIdx] || { q: "No question", a: "No answer" };
  const progressPercent = selectedDeck.cards.length > 0 ? Math.round((currentCardIdx / selectedDeck.cards.length) * 100) : 0;

  const handleNext = () => {
    if (selectedDeck.cards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev + 1) % selectedDeck.cards.length);
  };

  const handlePrev = () => {
    if (selectedDeck.cards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev - 1 + selectedDeck.cards.length) % selectedDeck.cards.length);
  };

  const selectDeck = (deck: typeof allDecks[number]) => {
    setActiveDeckId(deck.id);
    setCurrentCardIdx(0);
    setShowAnswer(false);
    setScore({ correct: 0, incorrect: 0 });
  };

  // Canvas Card Exporter (Flashcard-to-Image Engine)
  const exportCardToImage = () => {
    if (!selectedDeck || selectedDeck.cards.length === 0) return;
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
      selectedDeck.cards.length,
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
    <AppShell title="Flashcards Study">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column: Decks */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Decks
          </h2>
          <div className="space-y-2">
            {allDecks.map((deck) => (
              <Card
                key={deck.id}
                onClick={() => selectDeck(deck)}
                className={`cursor-pointer p-4 transition text-left border ${selectedDeck.id === deck.id ? "border-foreground ring-1 ring-foreground bg-elevated/40" : "border-border hover:bg-elevated/20"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {deck.subject}
                  </span>
                  <Pill className="text-[10px]">{deck.cards.length} cards</Pill>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{deck.title}</h3>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column: Flashcard Workspace */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          <div className="w-full max-w-xl space-y-6">
            {/* Stats Header */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Card {selectedDeck.cards.length > 0 ? currentCardIdx + 1 : 0} of {selectedDeck.cards.length}
              </span>
              <div className="flex gap-4">
                <span className="text-green-600 font-medium">✓ {score.correct}</span>
                <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Flashcard Box */}
            <div
              onClick={() => {
                if (selectedDeck.cards.length > 0) {
                  setShowAnswer(!showAnswer);
                }
              }}
              className="group relative h-80 w-full cursor-pointer rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md flex flex-col justify-between p-8 text-center"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {showAnswer ? "Answer" : "Question"}
              </div>

              <div className="my-auto text-base md:text-lg font-semibold tracking-tight text-foreground select-none px-4 flex justify-center items-center w-full">
                {selectedDeck.cards.length > 0 ? (
                  <MarkdownRenderer content={showAnswer ? currentCard.a : currentCard.q} />
                ) : (
                  "This note does not have enough content to generate cards. Try adding headings or lists."
                )}
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                Click card to flip
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 border border-border rounded-md hover:bg-muted"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 border border-border rounded-md hover:bg-muted"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={exportCardToImage}
                  disabled={selectedDeck.cards.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-background rounded-md text-xs font-semibold hover:bg-muted text-foreground transition disabled:opacity-50"
                  title="Export Card to Image"
                >
                  <Download className="h-3.5 w-3.5" /> Export Image
                </button>
              </div>

              {showAnswer && selectedDeck.cards.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }));
                      handleNext();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 text-xs font-semibold rounded-md hover:bg-red-100/80 transition"
                  >
                    <X className="h-3.5 w-3.5" /> Forgot
                  </button>
                  <button
                    onClick={() => {
                      setScore((s) => ({ ...s, correct: s.correct + 1 }));
                      handleNext();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 text-xs font-semibold rounded-md hover:bg-green-100/80 transition"
                  >
                    <Check className="h-3.5 w-3.5" /> Got it
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
