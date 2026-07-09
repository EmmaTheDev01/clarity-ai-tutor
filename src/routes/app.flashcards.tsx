import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import { Layers, Sparkles, Check, X, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState } from "react";

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
      { q: "What is an eigenvector?", a: "A non-zero vector v that only rescales by a factor λ (eigenvalue) when a matrix A is applied: Av = λv." },
      { q: "What does det(A − λI) = 0 compute?", a: "The characteristic equation used to solve for eigenvalues of matrix A." },
      { q: "What is a basis?", a: "A set of linearly independent vectors that span a given vector space." },
      { q: "When is a matrix diagonalizable?", a: "When it has n linearly independent eigenvectors, allowing it to be decomposed into PDP⁻¹." },
    ],
  },
  {
    id: "deck2",
    title: "Neural Networks & Backprop",
    subject: "Artificial Intelligence",
    cards: [
      { q: "What is backpropagation?", a: "An algorithm that calculates gradients of the loss function with respect to weights using the chain rule backward layer-by-layer." },
      { q: "What is the purpose of an activation function?", a: "To introduce non-linearity into the network, allowing it to learn and model complex, non-linear relationships." },
      { q: "What is overfitting?", a: "When a model learns the details and noise of the training data too well, resulting in poor generalization to new data." },
    ],
  },
];

function FlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState(defaultDecks[0]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  const currentCard = selectedDeck.cards[currentCardIdx];
  const progressPercent = Math.round(((currentCardIdx) / selectedDeck.cards.length) * 100);

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev + 1) % selectedDeck.cards.length);
  };

  const handlePrev = () => {
    setShowAnswer(false);
    setCurrentCardIdx((prev) => (prev - 1 + selectedDeck.cards.length) % selectedDeck.cards.length);
  };

  const selectDeck = (deck: typeof defaultDecks[number]) => {
    setSelectedDeck(deck);
    setCurrentCardIdx(0);
    setShowAnswer(false);
    setScore({ correct: 0, incorrect: 0 });
  };

  // Canvas Card Exporter (Flashcard-to-Image Engine)
  const exportCardToImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, "#0f172a"); // slate-900
    grad.addColorStop(1, "#1e293b"); // slate-800
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Draw card borders
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 770, 470);

    // Logo & header metadata
    ctx.fillStyle = "#38bdf8"; // sky-400
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("CLARITY AI TUTOR", 45, 65);

    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "12px tracking-wider sans-serif";
    ctx.fillText("tutor.vigilance.rw  •  " + selectedDeck.subject.toUpperCase() + " STUDY GUIDE", 45, 90);

    // Draw active card mode tag
    ctx.fillStyle = showAnswer ? "#10b981" : "#f59e0b"; // emerald or amber
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(showAnswer ? "ANSWER DECK" : "CONCEPT FLASHCARD", 650, 65);

    // Divider line
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 115);
    ctx.lineTo(755, 115);
    ctx.stroke();

    // Word Wrap Text Content
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.font = "semibold 22px sans-serif";
    const text = showAnswer ? currentCard.a : currentCard.q;
    const words = text.split(" ");
    let line = "";
    const x = 50;
    let y = 190;
    const maxWidth = 700;
    const lineHeight = 35;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);

    // Branding signature footer
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "11px sans-serif";
    ctx.fillText("Classroom Verified Material  •  Card " + (currentCardIdx + 1) + " of " + selectedDeck.cards.length, 45, 445);

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
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Decks</h2>
          <div className="space-y-2">
            {defaultDecks.map((deck) => (
              <Card
                key={deck.id}
                onClick={() => selectDeck(deck)}
                className={`cursor-pointer p-4 transition text-left border ${
                  selectedDeck.id === deck.id ? "border-foreground ring-1 ring-foreground" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {deck.subject}
                  </span>
                  <Pill className="text-[10px]">{deck.cards.length} cards</Pill>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  {deck.title}
                </h3>
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
                Card {currentCardIdx + 1} of {selectedDeck.cards.length}
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
              onClick={() => setShowAnswer(!showAnswer)}
              className="group relative h-80 w-full cursor-pointer rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md flex flex-col justify-between p-8 text-center"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {showAnswer ? "Answer" : "Question"}
              </div>

              <div className="my-auto text-xl md:text-2xl font-semibold tracking-tight text-foreground select-none px-4">
                {showAnswer ? currentCard.a : currentCard.q}
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-background rounded-md text-xs font-semibold hover:bg-muted text-foreground transition"
                  title="Export Card to Image"
                >
                  <Download className="h-3.5 w-3.5" /> Export Image
                </button>
              </div>

              {showAnswer && (
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
