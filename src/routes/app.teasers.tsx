import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Pill } from "@/components/ui-kit";
import {
  Gamepad2,
  Trophy,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Smile,
  Zap,
  Timer,
  Play,
  Eye,
  Layers,
  MousePointer,
  Type,
  TrendingUp,
  Award,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/teasers")({
  head: () => ({ meta: [{ title: "Study Break Games — tutor.vigilance.rw" }] }),
  component: BrainTeasersPage,
});

const mockRiddles = [
  {
    id: 1,
    subject: "Mathematics",
    question:
      "I am a vector space element. When multiplied by a transformation matrix A, my direction remains unchanged, only my length is scaled. What am I?",
    answer: "eigenvector",
    hints: "Av = λv. Think about eigenvalues.",
  },
  {
    id: 2,
    subject: "Neural Networks",
    question:
      "I am the calculus rule used in backpropagation to compute composite partial derivatives layer-by-layer. What am I?",
    answer: "chain rule",
    hints: "dy/dx = (dy/du) * (du/dx).",
  },
  {
    id: 3,
    subject: "Physics",
    question:
      "I am the law stating that current through a conductor is directly proportional to voltage and inversely proportional to resistance. What am I?",
    answer: "ohm's law",
    hints: "V = IR.",
  },
  {
    id: 4,
    subject: "Computer Science",
    question:
      "I am the algorithmic notation describing the worst-case execution time or space limits of a function. What am I?",
    answer: "big-o",
    hints: "For example, O(N log N) or O(1).",
  },
];

const mockScrambleWords = [
  { word: "ADVENTURE", hint: "An unusual and exciting, typically hazardous, experience or activity." },
  { word: "BEAUTIFUL", hint: "Pleasing the senses or mind aesthetically." },
  { word: "CURIOSITY", hint: "A strong desire to know or learn something." },
  { word: "DETERMINED", hint: "Having made a firm decision and being resolved not to change it." },
  { word: "ELEGANT", hint: "Graceful and stylish in appearance or behavior." },
  { word: "FREEDOM", hint: "The power or right to act, speak, or think as one wants." },
  { word: "GENEROUS", hint: "Showing a readiness to give more of something than is strictly necessary." },
  { word: "HARMONY", hint: "The state of being in agreement or concord." },
  { word: "IMAGINE", hint: "Form a mental image or concept of." },
  { word: "JOURNEY", hint: "An act of traveling from one place to another." },
  { word: "KNOWLEDGE", hint: "Facts, information, and skills acquired through experience or education." },
  { word: "LAUGHTER", hint: "The action or sound of laughing." },
  { word: "MYSTERY", hint: "Something that is difficult or impossible to understand or explain." },
  { word: "NATURE", hint: "The phenomena of the physical world collectively, including plants, animals, the landscape." },
  { word: "OPTIMISM", hint: "Hopefulness and confidence about the future or the success of something." },
  { word: "PEACEFUL", hint: "Free from disturbance; tranquil." },
  { word: "QUIETNESS", hint: "The state of being quiet; calmness or silence." },
  { word: "RESILIENCE", hint: "The capacity to recover quickly from difficulties; toughness." },
  { word: "SINCERE", hint: "Free from pretense or deceit; proceeding from genuine feelings." },
  { word: "TRANQUIL", hint: "Free from disturbance; calm." },
  { word: "UNIQUE", hint: "Being the only one of its kind; unlike anything else." },
  { word: "VICTORY", hint: "An act of defeating an enemy or opponent in a battle, game, or other competition." },
  { word: "WISDOM", hint: "The quality of having experience, knowledge, and good judgment." },
  { word: "XENIAL", hint: "Hospitable, especially to visiting strangers or foreigners." },
  { word: "YOUTHFUL", hint: "Having the vitality or freshness of youth." },
  { word: "ZEALOUS", hint: "Having or showing zeal; passionate and devoted." }
];

const MEMORY_SYMBOLS = ["🧠", "💻", "📐", "🔬", "📚", "🎨"];
const BUBBLE_COLORS = [
  "rgba(244,63,94,0.45)",  // Rose
  "rgba(59,130,246,0.45)",  // Blue
  "rgba(16,185,129,0.45)",  // Emerald
  "rgba(245,158,11,0.45)",  // Amber
  "rgba(139,92,246,0.45)",  // Violet
  "rgba(236,72,153,0.45)",  // Pink
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
  }, [navigate]);

  // Tab state
  const [activeTab, setActiveTab] = useState<"riddles" | "memory" | "bubbles" | "reflex" | "scramble" | "breathing">("riddles");

  // Scholar Achievements metrics
  const [xp, setXp] = useState(() => Number(localStorage.getItem("student_xp") || "850"));
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("riddle_streak") || "3"));

  // ── 1. Riddles State
  const [activeIdx, setActiveIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);

  const currentRiddle = mockRiddles[activeIdx];
  const isAlreadySolved = solvedIds.includes(currentRiddle.id);

  // ── 2. Memory Match State
  const [cards, setCards] = useState<Array<{ id: number; symbol: string; flipped: boolean; matched: boolean }>>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [memoryXpAwarded, setMemoryXpAwarded] = useState(false);

  // ── 3. Bubbles State
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; scale: number }>>([]);
  const [poppedCount, setPoppedCount] = useState(0);

  // ── 4. Reflex Target State
  const [isPlayingReflex, setIsPlayingReflex] = useState(false);
  const [reflexScore, setReflexScore] = useState(0);
  const [reflexHighScore, setReflexHighScore] = useState(() => Number(localStorage.getItem("reflex_high_score") || "0"));
  const [reflexTimeLeft, setReflexTimeLeft] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50, size: 45 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── 5. Word Scramble State
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [scrambledWord, setScrambledWord] = useState("");
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [scrambleHintVisible, setScrambleHintVisible] = useState(false);
  const [scrambleFeedback, setScrambleFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [solvedScramblesCount, setSolvedScramblesCount] = useState(0);

  const currentScramble = mockScrambleWords[scrambleIdx];

  // ── 6. Breathing State
  const [breathingState, setBreathingState] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingCycle, setBreathingCycle] = useState(1);

  // Breathing Box cycle animation effect
  useEffect(() => {
    if (activeTab !== "breathing") return;
    
    let timer: NodeJS.Timeout;
    if (breathingState === "inhale") {
      timer = setTimeout(() => setBreathingState("hold"), 4000);
    } else if (breathingState === "hold") {
      timer = setTimeout(() => setBreathingState("exhale"), 4000);
    } else {
      timer = setTimeout(() => {
        setBreathingState("inhale");
        setBreathingCycle((c) => c + 1);
        if (breathingCycle % 2 === 0) {
          addXp(10, `Completed breathing relaxation cycles`, "breathing_cycles_completed");
          toast.success("Breathing sequence completed! Scholar mind rested (+10 XP).");
        }
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [activeTab, breathingState, breathingCycle]);

  // Synchronize XP changes
  const addXp = (amount: number, detailsMsg: string, logAction: string) => {
    const newXp = xp + amount;
    setXp(newXp);
    localStorage.setItem("student_xp", String(newXp));

    // Log action to DB
    const logData = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          await supabase.from("user_logs").insert({
            user_id: u.user.id,
            action_type: logAction,
            details: detailsMsg,
          });
        }
      } catch { /* ignored */ }
    };
    logData();
  };

  // Riddle verify
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const formattedAns = userInput.trim().toLowerCase();
    if (formattedAns === currentRiddle.answer) {
      setFeedback("correct");
      if (!isAlreadySolved) {
        setSolvedIds((prev) => [...prev, currentRiddle.id]);
        const reward = streak > 0 ? 30 : 15;
        addXp(reward, `Solved riddle #${currentRiddle.id} awarding ${reward} XP`, "brain_teaser_solved");
        setStreak((prev) => prev + 1);
        localStorage.setItem("riddle_streak", String(streak + 1));
      }
    } else {
      setFeedback("incorrect");
      setStreak(0);
      localStorage.setItem("riddle_streak", "0");
      setTimeout(() => setFeedback("idle"), 2000);
    }
  };

  const handleNext = () => {
    setUserInput("");
    setFeedback("idle");
    setShowHint(false);
    setActiveIdx((prev) => (prev + 1) % mockRiddles.length);
  };

  // ── Memory Match initialization
  const initMemoryGame = () => {
    const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS]
      .map((symbol, index) => ({ id: index, symbol, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelectedIndices([]);
    setMoves(0);
    setMemoryXpAwarded(false);
  };

  useEffect(() => {
    if (activeTab === "memory") {
      initMemoryGame();
    }
  }, [activeTab]);

  const handleCardClick = (idx: number) => {
    if (cards[idx].flipped || cards[idx].matched || selectedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newSelections = [...selectedIndices, idx];
    setSelectedIndices(newSelections);

    if (newSelections.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newSelections;
      if (cards[firstIdx].symbol === cards[secondIdx].symbol) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[firstIdx].matched = true;
            next[secondIdx].matched = true;
            return next;
          });
          setSelectedIndices([]);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[firstIdx].flipped = false;
            next[secondIdx].flipped = false;
            return next;
          });
          setSelectedIndices([]);
        }, 800);
      }
    }
  };

  // Check memory game win
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched) && !memoryXpAwarded) {
      setMemoryXpAwarded(true);
      addXp(25, `Won memory match game in ${moves} moves`, "memory_teaser_solved");
      toast.success("Brilliant! Memory cards cleared! +25 XP awarded.");
    }
  }, [cards]);

  // ── Bubbles Pop Sandbox initialization
  const spawnBubbles = () => {
    const items = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      size: 32 + Math.random() * 32,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      scale: 1,
    }));
    setBubbles(items);
  };

  useEffect(() => {
    if (activeTab === "bubbles") {
      spawnBubbles();
    }
  }, [activeTab]);

  const handlePop = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setPoppedCount((prev) => prev + 1);

    if (poppedCount > 0 && poppedCount % 10 === 0) {
      addXp(5, `Popped ${poppedCount} sensory relaxer bubbles`, "sensory_bubbles_popped");
      toast.success("Mind refreshed! +5 XP awarded.");
    }

    // Spawn replacement bubble
    setTimeout(() => {
      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80,
          y: 15 + Math.random() * 70,
          size: 32 + Math.random() * 32,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          scale: 1,
        },
      ]);
    }, 400);
  };

  // ── Reflex Target game logic
  const moveReflexTarget = () => {
    setTargetPos({
      x: 5 + Math.random() * 85,
      y: 5 + Math.random() * 80,
      size: 30 + Math.random() * 25,
    });
  };

  const startReflexGame = () => {
    setIsPlayingReflex(true);
    setReflexScore(0);
    setReflexTimeLeft(15);
    moveReflexTarget();
  };

  useEffect(() => {
    if (isPlayingReflex && reflexTimeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setReflexTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (reflexTimeLeft === 0 && isPlayingReflex) {
      setIsPlayingReflex(false);
      if (reflexScore > reflexHighScore) {
        setReflexHighScore(reflexScore);
        localStorage.setItem("reflex_high_score", String(reflexScore));
        toast.success(`New Personal Best reflex score: ${reflexScore}!`);
      }
      const xpReward = reflexScore >= 20 ? 30 : reflexScore >= 10 ? 15 : 5;
      addXp(xpReward, `Finished Click Chase reflex game with score ${reflexScore}`, "reflex_teaser_solved");
      toast.success(`Game over! Score: ${reflexScore} · +${xpReward} XP awarded.`);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlayingReflex, reflexTimeLeft]);

  const handleTargetClick = () => {
    setReflexScore((prev) => prev + 1);
    moveReflexTarget();
  };

  // ── Word Scramble logic
  const scrambleWord = (word: string): string => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const res = arr.join("");
    return res === word ? scrambleWord(word) : res;
  };

  const initScrambleWord = (idx: number) => {
    const item = mockScrambleWords[idx];
    setScrambledWord(scrambleWord(item.word));
    setScrambleGuess("");
    setScrambleHintVisible(false);
    setScrambleFeedback("idle");
  };

  useEffect(() => {
    if (activeTab === "scramble") {
      initScrambleWord(scrambleIdx);
    }
  }, [activeTab, scrambleIdx]);

  const handleScrambleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrambleGuess.trim()) return;

    if (scrambleGuess.trim().toUpperCase() === currentScramble.word) {
      setScrambleFeedback("correct");
      setSolvedScramblesCount((prev) => prev + 1);
      addXp(15, `Solved scrambled word: ${currentScramble.word}`, "word_scramble_solved");
      toast.success("Correct! +15 XP Scholar score added.");
    } else {
      setScrambleFeedback("incorrect");
      setTimeout(() => setScrambleFeedback("idle"), 2000);
    }
  };

  const nextScrambleWord = () => {
    const nextIdx = (scrambleIdx + 1) % mockScrambleWords.length;
    setScrambleIdx(nextIdx);
  };

  return (
    <AppShell title="Scholar Study Break Room">
      <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
        
        {/* Futuristic Arc Header */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-r from-primary/5 via-elevated/40 to-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2.5">
              <Gamepad2 className="h-6 w-6 text-primary animate-pulse" />
              Rest &amp; Cognitive Recharge
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg">
              Take short, deliberate study breaks to reduce cognitive fatigue, boost concentration, and return to learning with absolute clarity.
            </p>
          </div>
          
          {/* Level Progress Widget */}
          <div className="bg-background/60 backdrop-blur border border-border/80 px-5 py-4 rounded-xl min-w-[200px] flex items-center gap-4 hover:border-primary/30 transition shadow-inner">
            <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Scholar Rank</p>
              <p className="text-sm font-black text-foreground truncate mt-0.5">
                Level {Math.floor(xp / 300) + 1}
              </p>
              <div className="w-full bg-border h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${((xp % 300) / 300) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab switch bar with glows */}
        <div className="flex border-b border-border gap-2 pb-px overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-1 bg-elevated/20 rounded-xl border border-border/60">
          {[
            { id: "riddles", label: "Scholar Riddles", icon: HelpCircle },
            { id: "memory", label: "Memory Cards", icon: Layers },
            { id: "bubbles", label: "Bubble Wrap", icon: Sparkles },
            { id: "reflex", label: "Click Reflex", icon: MousePointer },
            { id: "scramble", label: "Word Scramble", icon: Type },
            { id: "breathing", label: "Breathing Box", icon: Smile },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row items-stretch">
          {/* Main game board */}
          <div className="flex-1 space-y-4">

            {/* 1. Scholar Riddles Card */}
            {activeTab === "riddles" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background relative overflow-hidden transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                    {currentRiddle.subject}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Riddle {activeIdx + 1} of {mockRiddles.length}
                  </span>
                </div>

                <div className="my-8 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Riddle Question
                  </h2>
                  <p className="text-xl md:text-2xl font-black text-foreground leading-normal tracking-tight bg-elevated/10 p-5 rounded-2xl border border-border/40 select-text">
                    &ldquo;{currentRiddle.question}&rdquo;
                  </p>
                </div>

                <div className="space-y-4 mt-auto">
                  {feedback === "correct" && (
                    <div className="flex flex-col gap-1 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold animate-bounce">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Outstanding! That is correct.</span>
                      </div>
                      <p className="text-[10px] text-emerald-400/90 font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        <span>Streak Active! Double Reward (+30 XP)</span>
                      </p>
                    </div>
                  )}

                  {feedback === "incorrect" && (
                    <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                      <span>Incorrect answer. Try again or check the hint details!</span>
                    </div>
                  )}

                  {feedback !== "correct" ? (
                    <form onSubmit={handleVerify} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type answer here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition shadow-inner"
                      />
                      <button
                        type="submit"
                        className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-xl text-xs hover:opacity-95 transition shadow-md shadow-primary/10 active:scale-[0.98]"
                      >
                        Verify
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="w-full bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      Next Riddle <ChevronRight className="h-4 w-4" />
                    </button>
                  )}

                  <div className="pt-2">
                    {showHint ? (
                      <p className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl italic leading-relaxed">
                        Hint: {currentRiddle.hints}
                      </p>
                    ) : (
                      <button
                        onClick={() => setShowHint(true)}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        Need a clue?
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 2. Memory Match Cards Card */}
            {activeTab === "memory" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Card Match Memory Break</h3>
                    <p className="text-[11px] text-muted-foreground">Match the active scholar blocks. Rest your mind.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-muted-foreground">Moves: {moves}</span>
                    <button
                      onClick={initMemoryGame}
                      className="flex items-center gap-1 text-primary hover:underline text-xs font-bold"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Restart
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 my-8 max-w-xs mx-auto">
                  {cards.map((card, idx) => {
                    const isFlipped = card.flipped || card.matched;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleCardClick(idx)}
                        className="w-16 h-20 perspective-1000 cursor-pointer"
                      >
                        <div
                          className="relative w-full h-full transform transition-transform duration-350 shadow-sm"
                          style={{
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transformStyle: "preserve-3d",
                          }}
                        >
                          {/* Card Front (Back face-down) */}
                          <div
                            className="absolute inset-0 bg-elevated border border-border rounded-xl flex items-center justify-center text-lg hover:border-primary/40 transition-colors shadow-inner"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            ❓
                          </div>
                          {/* Card Back (Symbol face-up) */}
                          <div
                            className={`absolute inset-0 rounded-xl flex items-center justify-center text-2xl rotate-y-180 shadow-md ${
                              card.matched 
                                ? "bg-emerald-500/10 border border-emerald-500/30 animate-pulse text-emerald-500" 
                                : "bg-primary/5 border border-primary/20 text-primary"
                            }`}
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            {card.symbol}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cards.every((c) => c.matched) ? (
                  <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <Smile className="h-4 w-4" /> All Cards Cleared! +25 Scholar XP Awarded.
                  </div>
                ) : (
                  <div className="text-center text-[10px] text-muted-foreground italic">
                    Rest your left brain for a few minutes. Visual breaks help encode information into long-term memory.
                  </div>
                )}
              </Card>
            )}

            {/* 3. Bubble Wrap Relaxer Card */}
            {activeTab === "bubbles" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sensory Bubble Popper</h3>
                    <p className="text-[11px] text-muted-foreground">Pop colorful bubbles to ease study stress. Satisfaction guaranteed.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-muted-foreground">Popped: {poppedCount}</span>
                    <button
                      onClick={spawnBubbles}
                      className="flex items-center gap-1 text-primary hover:underline text-xs font-bold"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Respawn
                    </button>
                  </div>
                </div>

                {/* Pop Canvas */}
                <div className="flex-1 min-h-[280px] my-4 rounded-2xl border border-border/60 bg-elevated/10 relative overflow-hidden cursor-crosshair shadow-inner">
                  {bubbles.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handlePop(b.id)}
                      onMouseEnter={() => handlePop(b.id)}
                      className="absolute rounded-full border border-white/20 transition-all duration-300 transform hover:scale-95 shadow-md flex items-center justify-center active:scale-75 cursor-pointer"
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                        backgroundColor: b.color,
                        backdropFilter: "blur(0.5px)",
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full absolute top-1.5 left-2" />
                    </button>
                  ))}
                  {bubbles.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic animate-pulse">
                      Spawning bubble wraps...
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] text-muted-foreground italic">
                  Hover or tap bubbles quickly to pop them. Gain +5 XP every 10 pops!
                </div>
              </Card>
            )}

            {/* 4. Click Reflex Speed Game Card */}
            {activeTab === "reflex" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Click Reflex Target</h3>
                    <p className="text-[11px] text-muted-foreground">Click targets quickly. Enhance speed &amp; alertness.</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-primary" /> Record: {reflexHighScore}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Hits: {reflexScore}</span>
                  </div>
                </div>

                {isPlayingReflex ? (
                  <div className="flex-1 min-h-[280px] my-4 rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden shadow-inner">
                    {/* Time indicator */}
                    <div className="absolute top-3 right-3 bg-background border border-border px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                      <Timer className="h-3.5 w-3.5 text-primary animate-pulse" /> {reflexTimeLeft}s remaining
                    </div>

                    {/* Target button */}
                    <button
                      onClick={handleTargetClick}
                      className="absolute rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white/50 active:scale-90 transition-all select-none animate-ping-once cursor-pointer"
                      style={{
                        left: `${targetPos.x}%`,
                        top: `${targetPos.y}%`,
                        width: `${targetPos.size}px`,
                        height: `${targetPos.size}px`,
                        fontSize: `${targetPos.size / 2.5}px`,
                      }}
                    >
                      🎯
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[280px] my-4 rounded-2xl border border-dashed border-border bg-elevated/20 flex flex-col items-center justify-center text-center p-6 gap-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-md">
                      <Zap className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Click Reflex Target Challenge</h4>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      You have 15 seconds to click targets. Clicks scale target sizes dynamically. 10+ clicks reward +15 XP, 20+ clicks reward +30 XP!
                    </p>
                    <button
                      onClick={startReflexGame}
                      className="mt-2 bg-primary text-primary-foreground font-extrabold px-6 py-2.5 rounded-xl text-xs hover:opacity-95 transition flex items-center gap-1.5 shadow-md shadow-primary/10 active:scale-[0.98]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Begin Challenge
                    </button>
                  </div>
                )}

                <div className="text-center text-[10px] text-muted-foreground italic">
                  Take a 15-second physical break to reset target reaction speed.
                </div>
              </Card>
            )}

            {/* 5. Word Scramble Anagram Card */}
            {activeTab === "scramble" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Word Scramble Anagrams</h3>
                    <p className="text-[11px] text-muted-foreground">Unscramble standard english vocabulary. Keep it clear.</p>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Solved: {solvedScramblesCount} words
                  </div>
                </div>

                <div className="my-6 text-center space-y-6 flex-1 flex flex-col justify-center">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 inline-block min-w-[280px] sm:min-w-[340px] shadow-inner max-w-md mx-auto whitespace-nowrap overflow-hidden">
                    <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.18em] text-primary uppercase select-none whitespace-nowrap">
                      {scrambledWord}
                    </p>
                  </div>

                  <div className="max-w-sm mx-auto space-y-4 w-full">
                    {scrambleFeedback === "correct" && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold animate-bounce">
                        🎉 Correct answer! (+15 XP Scholar score added)
                      </div>
                    )}
                    {scrambleFeedback === "incorrect" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold">
                        ❌ Incorrect guess. Check definition and try again!
                      </div>
                    )}

                    {scrambleFeedback !== "correct" ? (
                      <form onSubmit={handleScrambleSubmit} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type unscrambled word..."
                          value={scrambleGuess}
                          onChange={(e) => setScrambleGuess(e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition uppercase shadow-inner"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-xl text-xs hover:opacity-95 transition shrink-0 shadow-md shadow-primary/10"
                        >
                          Guess
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={nextScrambleWord}
                        className="w-full bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        Next Word <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* Hint section */}
                    <div className="pt-2 text-left">
                      {scrambleHintVisible ? (
                        <p className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl italic leading-relaxed">
                          Definition: {currentScramble.hint}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setScrambleHintVisible(true)}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1 mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5" /> Reveal clues
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-muted-foreground italic mt-auto">
                  Tip: Challenge your vocabulary with standard english words.
                </div>
              </Card>
            )}

            {/* 6. Breathing Box Relaxation Card */}
            {activeTab === "breathing" && (
              <Card className="p-6 md:p-8 flex flex-col justify-between min-h-[460px] border border-border bg-background transition-all duration-350 hover:shadow-lg">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sensory Breathing Box</h3>
                    <p className="text-[11px] text-muted-foreground">Follow the bubble to align your heart rate. Ease stress.</p>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Cycles: {breathingCycle}
                  </div>
                </div>

                {/* Animated Breathing Container */}
                <div className="flex-1 flex flex-col items-center justify-center my-6 gap-6">
                  <div className="relative flex items-center justify-center h-48 w-48">
                    {/* Glowing background circles */}
                    <div 
                      className={`absolute rounded-full bg-primary/10 border border-primary/20 transition-all duration-[4000ms] ease-in-out ${
                        breathingState === "inhale" ? "h-44 w-44 scale-100 opacity-100" :
                        breathingState === "hold" ? "h-44 w-44 scale-105 opacity-80 animate-pulse" :
                        "h-20 w-20 scale-75 opacity-40"
                      }`}
                    />
                    <div 
                      className={`absolute rounded-full bg-primary/5 transition-all duration-[4000ms] ease-in-out ${
                        breathingState === "inhale" ? "h-52 w-52 scale-105" :
                        breathingState === "hold" ? "h-52 w-52 scale-110" :
                        "h-28 w-28 scale-90"
                      }`}
                    />
                    
                    {/* Text display */}
                    <div className="z-10 text-center space-y-1">
                      <p className="text-xl font-black text-foreground capitalize tracking-wide animate-pulse">
                        {breathingState}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        {breathingState === "inhale" ? "Breathe In" :
                         breathingState === "hold" ? "Hold Breath" : "Breathe Out"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    Inhale for 4 seconds, hold for 4 seconds, and exhale for 4 seconds. Repeat sequence.
                  </p>
                </div>

                <div className="text-center text-[10px] text-muted-foreground italic">
                  Resting the parasympathetic nervous system boosts long-term recall.
                </div>
              </Card>
            )}

          </div>

          {/* Right Side: Scoreboard & Progress Tracking */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col space-y-4">
            
            {/* Trophy Scoreboard */}
            <Card className="p-5 border border-primary/20 bg-elevated/40 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
              {/* Neon accent top glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10" />
              
              <Trophy className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scholar Achievements
              </h3>
              <p className="text-2xl font-black text-foreground mt-2">{xp} XP</p>
              <Pill className="bg-primary/10 border-primary/20 text-primary uppercase font-bold text-[9px] tracking-wider mt-2.5">
                {xp >= 900 ? "Grandmaster" : xp >= 600 ? "Elite Scholar" : xp >= 300 ? "Junior Scholar" : "Novice Thinker"}
              </Pill>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Rank: Level {Math.floor(xp / 300) + 1} Scholar
              </p>

              <div className="mt-4 pt-3 border-t border-border w-full text-left space-y-2 text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Riddles Solved:</span>
                  <span className="font-bold text-foreground">
                    {solvedIds.length} / {mockRiddles.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Streak:</span>
                  <span className="font-bold text-foreground">{streak} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Reflex High Score:</span>
                  <span className="font-bold text-foreground">{reflexHighScore} clicks</span>
                </div>
                <div className="flex justify-between">
                  <span>Scrambles Solved:</span>
                  <span className="font-bold text-foreground">{solvedScramblesCount} words</span>
                </div>
              </div>
            </Card>

            {/* Puzzle Directory / Riddle Selection List */}
            {activeTab === "riddles" && (
              <Card className="p-5 flex-1 flex flex-col border border-border bg-background">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                  Riddle Collection
                </h3>

                <div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[220px]">
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
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all duration-200 ${
                          active
                            ? "border-primary bg-primary/5 text-foreground font-bold shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span>
                          #{r.id} - {r.subject}
                        </span>
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
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
