import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import { Gamepad2, Trophy, Sparkles, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/teasers")({
  head: () => ({ meta: [{ title: "Brain Teasers — tutor.vigilance.rw" }] }),
  component: BrainTeasersPage,
});

const mockRiddles = [
  {
    id: 1,
    subject: "Mathematics",
    question: "I am a vector space element. When multiplied by a transformation matrix A, my direction remains unchanged, only my length is scaled. What am I?",
    answer: "eigenvector",
    hints: "Av = λv. Think about eigenvalues.",
  },
  {
    id: 2,
    subject: "Neural Networks",
    question: "I am the calculus rule used in backpropagation to compute composite partial derivatives layer-by-layer. What am I?",
    answer: "chain rule",
    hints: "dy/dx = (dy/du) * (du/dx).",
  },
  {
    id: 3,
    subject: "Physics",
    question: "I am the law stating that current through a conductor is directly proportional to voltage and inversely proportional to resistance. What am I?",
    answer: "ohm's law",
    hints: "V = IR.",
  },
  {
    id: 4,
    subject: "Computer Science",
    question: "I am the algorithmic notation describing the worst-case execution time or space limits of a function. What am I?",
    answer: "big-o",
    hints: "For example, O(N log N) or O(1).",
  },
];

function BrainTeasersPage() {
  const navigate = useNavigate();

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth/sign-in" as any });
      }
    };
    checkAuth();
  }, []);

  const [xp, setXp] = useState(() => {
    return Number(localStorage.getItem("student_xp") || "850");
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);

  const currentRiddle = mockRiddles[activeIdx];
  const isAlreadySolved = solvedIds.includes(currentRiddle.id);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const formattedAns = userInput.trim().toLowerCase();
    if (formattedAns === currentRiddle.answer) {
      setFeedback("correct");
      if (!isAlreadySolved) {
        const updatedSolved = [...solvedIds, currentRiddle.id];
        setSolvedIds(updatedSolved);
        
        // Award +15 XP
        const newXp = xp + 15;
        setXp(newXp);
        localStorage.setItem("student_xp", String(newXp));

        // Log action in user_logs in background
        const currentLogs = JSON.parse(localStorage.getItem("user_logs") || "[]");
        currentLogs.push({
          action: "brain_teaser_solved",
          details: `Solved riddle #${currentRiddle.id} (${currentRiddle.subject})`,
          time: new Date().toISOString(),
        });
        localStorage.setItem("user_logs", JSON.stringify(currentLogs));
      }
    } else {
      setFeedback("incorrect");
      setTimeout(() => setFeedback("idle"), 2000);
    }
  };

  const handleNext = () => {
    setUserInput("");
    setFeedback("idle");
    setShowHint(false);
    setActiveIdx((prev) => (prev + 1) % mockRiddles.length);
  };

  return (
    <AppShell title="Brain Teasers & Riddles">
      <div className="flex flex-col gap-6 lg:flex-row max-w-5xl mx-auto items-stretch">
        
        {/* Left Card: Dynamic Puzzle Interface */}
        <div className="flex-1 space-y-4">
          <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[450px] relative overflow-hidden">
            {/* Subject badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                {currentRiddle.subject} puzzle
              </span>
              <span className="text-xs text-muted-foreground">
                Riddle {activeIdx + 1} of {mockRiddles.length}
              </span>
            </div>

            {/* Riddle text */}
            <div className="my-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                Riddle Question
              </h2>
              <p className="text-lg md:text-xl font-bold text-foreground leading-normal tracking-tight">
                &ldquo;{currentRiddle.question}&rdquo;
              </p>
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              {feedback === "correct" && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-semibold animate-bounce">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Brilliant! That is correct. +15 XP added to your scholar score!</span>
                </div>
              )}

              {feedback === "incorrect" && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold">
                  <span>Incorrect. Let&apos;s try again or check the hint.</span>
                </div>
              )}

              {feedback !== "correct" ? (
                <form onSubmit={handleVerify} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    disabled={feedback === "correct"}
                  />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-xs hover:opacity-90 transition"
                  >
                    Verify
                  </button>
                </form>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full bg-emerald-500 text-white font-semibold py-2 rounded-md text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  Next Riddle <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Hint section */}
              <div className="pt-2">
                {showHint ? (
                  <p className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded italic">
                    Hint: {currentRiddle.hints}
                  </p>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Need a hint?
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Scoreboard & Progress Tracking */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col space-y-4">
          {/* Trophy Scoreboard */}
          <Card className="p-5 border-primary/20 bg-elevated/40 flex flex-col items-center text-center">
            <Trophy className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scholar Achievements</h3>
            <p className="text-2xl font-bold text-foreground mt-2">{xp} XP</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Rank: Level {Math.floor(xp / 300) + 1} Scholar</p>

            <div className="mt-4 pt-3 border-t border-border w-full text-left space-y-2 text-[10px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Riddles Solved:</span>
                <span className="font-bold text-foreground">{solvedIds.length} / {mockRiddles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Streak:</span>
                <span className="font-bold text-foreground">9 Days</span>
              </div>
            </div>
          </Card>

          {/* Puzzle List Directory */}
          <Card className="p-5 flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <Gamepad2 className="h-3.5 w-3.5 text-primary" />
              Riddle Collection
            </h3>
            
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {mockRiddles.map((r, idx) => {
                const active = idx === activeIdx;
                const solved = solvedIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveIdx(idx);
                      setUserInput("");
                      setFeedback("idle");
                      setShowHint(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition ${
                      active
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>#{r.id} - {r.subject}</span>
                    {solved ? (
                      <span className="text-emerald-500 font-bold text-[10px]">✓ Done</span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Play</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

      </div>
    </AppShell>
  );
}
