import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  LayoutGrid,
  Library,
  FileText,
  PenTool,
  Layers,
  BarChart3,
  Settings,
  Plus,
  Volume2,
  Paperclip,
  ArrowUp,
  Bot,
  HelpCircle,
  Headphones,
  Check,
} from "lucide-react";

interface DemoChapter {
  id: string;
  sidebarActive: string;
  title: string;
  durationSec: number;
}

const CHAPTERS: DemoChapter[] = [
  {
    id: "chat",
    sidebarActive: "Dashboard",
    title: "Socratic Chat & Verified Citations",
    durationSec: 8,
  },
  {
    id: "commands",
    sidebarActive: "Dashboard",
    title: "In-Chat '@' Fast Action Palette",
    durationSec: 7,
  },
  {
    id: "audio",
    sidebarActive: "Notes",
    title: "Dual-Speaker Socratic Audio Dialogue",
    durationSec: 7,
  },
  {
    id: "scratchpad",
    sidebarActive: "Notepad",
    title: "Tablet Scratchpad & AI Vision Hinting",
    durationSec: 7.5,
  },
  {
    id: "flashcards",
    sidebarActive: "Flashcards",
    title: "Active Recall Spaced Repetition",
    durationSec: 7,
  },
];

const TOTAL_DURATION_SEC = CHAPTERS.reduce((acc, c) => acc + c.durationSec, 0);

export function HeroVideoMockup() {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);

  const activeChapter = CHAPTERS[chapterIndex];
  const timerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Continuous video timeline loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      return;
    }

    lastTimeRef.current = Date.now();

    const updateFrame = () => {
      const now = Date.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + deltaSec;
        if (next >= TOTAL_DURATION_SEC) {
          return 0; // loop video
        }
        return next;
      });

      timerRef.current = requestAnimationFrame(updateFrame);
    };

    timerRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isPlaying]);

  // Determine active chapter from currentTimeSec
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      accumulated += CHAPTERS[i].durationSec;
      if (currentTimeSec < accumulated) {
        if (chapterIndex !== i) {
          setChapterIndex(i);
          setCardFlipped(false);
          setSelectedQuizIdx(null);
        }
        break;
      }
    }
  }, [currentTimeSec, chapterIndex]);

  // Flip card animation automatically during flashcards chapter
  useEffect(() => {
    if (activeChapter.id === "flashcards") {
      const timer = setTimeout(() => {
        setCardFlipped(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
    setCardFlipped(false);
  }, [activeChapter.id]);

  // Auto-select quiz answer during commands chapter
  useEffect(() => {
    if (activeChapter.id === "commands") {
      const timer = setTimeout(() => {
        setSelectedQuizIdx(1);
      }, 3500);
      return () => clearTimeout(timer);
    }
    setSelectedQuizIdx(null);
  }, [activeChapter.id]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const restartVideo = () => {
    setCurrentTimeSec(0);
    setChapterIndex(0);
    setIsPlaying(true);
  };

  const jumpToChapter = (idx: number) => {
    let startSec = 0;
    for (let i = 0; i < idx; i++) {
      startSec += CHAPTERS[i].durationSec;
    }
    setCurrentTimeSec(startSec + 0.1);
    setChapterIndex(idx);
    setIsPlaying(true);
  };

  const progressPct = Math.min(100, (currentTimeSec / TOTAL_DURATION_SEC) * 100);

  return (
    <div className="relative w-full rounded-2xl border border-border/80 bg-card shadow-2xl shadow-neutral-950/15 overflow-hidden text-foreground select-none group">
      {/* 1. Browser Window Top Chrome (Clean Minimalist Frame without Demo Watermark) */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          <div className="hidden sm:flex items-center gap-1.5 ml-3 px-3 py-0.5 rounded-md bg-background border border-border text-[11px] font-mono text-muted-foreground">
            purelearn.ai/app
          </div>
        </div>

        {/* Minimal Window Status */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Active Session</span>
        </div>
      </div>

      {/* 2. Main App Screen (Sidebar + Replicated Dashboard Workspace) */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px] sm:min-h-[540px] md:min-h-[580px] bg-background">
        {/* Actual PureLearn App Sidebar (Left Column - 3.5 / 12 width) */}
        <aside className="hidden md:flex md:col-span-4 lg:col-span-3 flex-col border-r border-border/70 bg-background p-3.5 justify-between">
          <div>
            {/* App Brand Header */}
            <div className="flex items-center justify-between px-2 py-1 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-foreground text-background flex items-center justify-center font-black text-xs">
                  P
                </div>
                <span className="font-bold text-sm tracking-tight text-foreground">Purelearn.ai</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                v1.7
              </span>
            </div>

            {/* "+ Upload material" Action Button */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-semibold shadow-xs">
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Upload material</span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="space-y-4">
              <div>
                <span className="block px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Workspace
                </span>
                <nav className="space-y-0.5">
                  {[
                    { label: "Dashboard", icon: LayoutGrid },
                    { label: "Library", icon: Library },
                    { label: "Notes", icon: FileText },
                    { label: "Notepad", icon: PenTool },
                    { label: "Flashcards", icon: Layers },
                    { label: "Analytics", icon: BarChart3 },
                    { label: "Settings", icon: Settings },
                  ].map((item) => {
                    const isActive = activeChapter.sidebarActive === item.label;
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-muted text-foreground font-semibold shadow-2xs"
                            : "text-muted-foreground"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" />
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer User Profile */}
          <div className="pt-3 border-t border-border/60 px-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-semibold text-[10px] text-foreground border border-border">
                  JD
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-foreground truncate">Alex Morgan</p>
                  <p className="text-[10px] text-muted-foreground truncate">Pro Workspace</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Stage (Replicated Dashboard Chat UI) */}
        <main className="col-span-1 md:col-span-8 lg:col-span-9 flex flex-col justify-between p-3 sm:p-5 md:p-6 bg-muted/10 relative overflow-hidden">
          {/* Dashboard Header Bar (Active Document + Action Pills) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3 mb-3 bg-background/50 p-2.5 rounded-xl border border-border/40">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-mono font-semibold border border-border">
                PDF
              </span>
              <span className="text-xs font-bold text-foreground truncate">
                Backpropagation_Derivations.pdf
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                • 48 pages
              </span>
            </div>

            {/* Quick Action Pills matching the App */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-0.5 sm:pb-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border">
                <HelpCircle className="h-3 w-3" />
                Material Quiz
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-background text-muted-foreground border border-border/70">
                <Layers className="h-3 w-3" />
                Flashcards
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-background text-muted-foreground border border-border/70">
                <Headphones className="h-3 w-3" />
                Audio
              </span>
            </div>
          </div>

          {/* DYNAMIC DASHBOARD WORKSPACE CONTENT */}
          <div className="my-auto py-2 min-h-[300px] flex flex-col justify-center relative">
            {/* 1. SCENE: DASHBOARD SOCRATIC CHAT & CITATIONS */}
            {activeChapter.id === "chat" && (
              <div className="space-y-4 animate-in fade-in duration-300 w-full max-w-2xl mx-auto">
                {/* Student message (Gray Bubble just like the App) */}
                <div className="flex justify-end gap-2.5 items-end">
                  <div className="max-w-[82%] sm:max-w-[78%] rounded-2xl rounded-br-xs bg-muted text-foreground border border-border/60 px-4 py-2.5 text-xs sm:text-sm shadow-2xs">
                    <p className="font-normal leading-relaxed">
                      How does backpropagation use the chain rule to compute gradients across hidden layers?
                    </p>
                    <span className="block mt-1 text-[10px] text-muted-foreground text-right font-mono">
                      10:42 AM
                    </span>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-[10px] shrink-0 border border-border">
                    AM
                  </div>
                </div>

                {/* Socratic AI message with LaTeX & Verified Citation */}
                <div className="flex justify-start gap-2.5 items-start">
                  <div className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center text-foreground shrink-0 shadow-2xs mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>

                  <div className="max-w-[90%] sm:max-w-[85%] rounded-2xl rounded-tl-xs bg-card border border-border p-3.5 sm:p-4 text-xs sm:text-sm shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="font-bold text-foreground text-xs">PureLearn Socratic Engine</span>
                      <span className="text-[10px] text-muted-foreground font-mono">100% Grounded</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Decompose the network into composed layers. The error gradient propagates backward via Jacobian products:
                    </p>

                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 font-mono text-center text-xs sm:text-sm font-semibold text-foreground">
                      δ<sup>(l)</sup> = ((W<sup>(l+1)</sup>)<sup>T</sup> · δ<sup>(l+1)</sup>) ⊙ σ&apos;(z<sup>(l)</sup>)
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-medium text-foreground">
                        <FileText className="h-3 w-3" />
                        Source: Backpropagation_Derivations.pdf • §2.4, p. 12
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Socratic follow-up: </span>
                      If the activation derivative σ&apos;(z) approaches zero across many layers, what happens to early weight updates?
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SCENE: IN-CHAT @ COMMAND PALETTE & MATERIAL QUIZ */}
            {activeChapter.id === "commands" && (
              <div className="space-y-3 animate-in fade-in duration-300 max-w-xl mx-auto w-full">
                {/* Autocomplete Menu above Input */}
                <div className="rounded-xl border border-border bg-card p-2.5 shadow-md space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1">
                    <span>Summon In-Chat Action</span>
                    <span className="font-mono">Tab to autocomplete</span>
                  </div>

                  <div className="p-2 rounded-lg bg-foreground text-background flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">@quiz</span>
                      <span className="text-[11px] opacity-80">— Instant 3-question mastery check</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-background/20 font-bold">
                      Selected
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-foreground">@flashcards</span>
                    <span className="text-[11px]">— Extract spaced repetition recall deck</span>
                  </div>

                  <div className="p-1.5 rounded-lg text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-foreground">@audio</span>
                    <span className="text-[11px]">— Synthesize 2-speaker podcast breakdown</span>
                  </div>
                </div>

                {/* Populated Quiz Question Card in Feed */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">
                    Mastery Check: Gradient vanishing occurs predominantly with which activation?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {[
                      { label: "A) ReLU", correct: false },
                      { label: "B) Sigmoid (derivative max 0.25)", correct: true },
                      { label: "C) Leaky ReLU", correct: false },
                      { label: "D) Linear", correct: false },
                    ].map((opt, i) => (
                      <div
                        key={opt.label}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          selectedQuizIdx === i
                            ? "bg-foreground text-background border-foreground font-semibold"
                            : "bg-muted/30 border-border text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. SCENE: DUAL-SPEAKER AUDIO */}
            {activeChapter.id === "audio" && (
              <div className="space-y-3.5 animate-in fade-in duration-300 max-w-xl mx-auto w-full">
                <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-foreground">
                      Audio Concept Stream • Linear Algebra
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">02:14 / 04:30</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[10px] font-bold text-foreground block mb-0.5">Lead Explainer</span>
                      <p className="text-muted-foreground leading-relaxed italic">
                        &ldquo;Notice how L2 regularization adds a penalty term directly proportional to the squared weight values.&rdquo;
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/70 border border-border">
                      <span className="text-[10px] font-bold text-foreground block mb-0.5">Analyst Deep Dive</span>
                      <p className="text-foreground leading-relaxed">
                        &ldquo;This shrinks weights toward zero smoothly, eliminating overfitting without forcing sparsity.&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Equalizer Visualizer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center">
                        <Volume2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">Natural Neural Voice</span>
                    </div>

                    <div className="flex items-center gap-1 h-5">
                      {[30, 70, 40, 90, 60, 100, 45, 80, 35, 90, 60, 40, 75, 45].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-foreground animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${(i % 4) * 150}ms`,
                            animationDuration: "700ms",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SCENE: TABLET SCRATCHPAD */}
            {activeChapter.id === "scratchpad" && (
              <div className="space-y-3 animate-in fade-in duration-300 max-w-xl mx-auto w-full">
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-muted text-foreground font-semibold text-[10px]">
                        Pen
                      </span>
                      <span className="text-muted-foreground text-[10px]">Highlighter</span>
                      <span className="text-muted-foreground text-[10px]">Eraser</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">Grid 5mm • Vectorized</span>
                  </div>

                  {/* Dot Paper Surface */}
                  <div
                    className="relative h-40 w-full rounded-lg border border-border bg-muted/20 p-3 flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 0.75px, transparent 0.75px)",
                      backgroundSize: "12px 12px",
                      color: "var(--border)",
                    }}
                  >
                    <svg
                      className="absolute inset-0 h-full w-full pointer-events-none text-foreground/85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M 30 100 C 80 15, 150 15, 210 90 S 320 110, 420 30" />
                      <circle cx="210" cy="90" r="3.5" fill="currentColor" />
                      <line x1="210" y1="90" x2="210" y2="135" strokeDasharray="3 3" strokeWidth="1.5" />
                    </svg>

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-background border border-border text-foreground font-semibold">
                        dy/dx = 3x² - 6x = 0
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                        Stylus Pressure: 0.82
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-foreground bg-background px-2 py-0.5 rounded border border-border">
                        ✓ AI Vision Engine Analyzed
                      </span>
                      <span className="text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                        Inflection Point: x = 1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SCENE: SPACED REPETITION FLASHCARDS */}
            {activeChapter.id === "flashcards" && (
              <div className="space-y-3 animate-in fade-in duration-300 max-w-xl mx-auto w-full">
                <div className="rounded-xl border border-border bg-card p-5 min-h-[200px] flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                      Memory Anchor #04 / 28
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Spaced Repetition SM-2</span>
                  </div>

                  <div className="my-auto py-2 text-center">
                    {!cardFlipped ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Recall Prompt
                        </span>
                        <p className="text-sm font-semibold text-foreground">
                          What is the fundamental difference between L1 and L2 regularization penalties?
                        </p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground block mb-1">
                          Target Solution
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          L1 adds absolute weights |w| inducing sparsity. L2 adds squared weights w² shrinking parameters smoothly toward zero without exact nullification.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50 text-xs">
                    <span className="px-2.5 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground text-[11px]">
                      Again (&lt; 1d)
                    </span>
                    <span className="px-2.5 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground text-[11px]">
                      Hard (2d)
                    </span>
                    <span className="px-2.5 py-1 rounded-md border border-foreground bg-foreground text-background font-semibold text-[11px]">
                      Good (4d)
                    </span>
                    <span className="px-2.5 py-1 rounded-md border border-border bg-muted/40 text-muted-foreground text-[11px]">
                      Easy (8d)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Replicated Dashboard Chat Input Bar at Bottom */}
          <div className="pt-2">
            <div className="rounded-xl border border-border bg-background p-2.5 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="flex-1 text-xs font-mono text-foreground truncate">
                {activeChapter.id === "commands" ? (
                  <span>
                    Verify gradient updates with <span className="font-bold underline">@quiz</span>
                    <span className="inline-block w-1.5 h-3.5 bg-foreground ml-0.5 animate-pulse align-middle" />
                  </span>
                ) : (
                  <span className="text-muted-foreground font-sans">
                    Ask anything about this document, or type &apos;@&apos; for actions...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-xs">
                  <ArrowUp className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Video Player Timeline & Navigation Footer */}
            <div className="pt-3 mt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition cursor-pointer shadow-xs shrink-0"
                  aria-label={isPlaying ? "Pause demo" : "Play demo"}
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={restartVideo}
                  className="h-6 w-6 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer shrink-0"
                  aria-label="Restart video"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>

              {/* Chapter Jumper Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
                {CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer whitespace-nowrap ${
                      chapterIndex === idx
                        ? "bg-foreground text-background font-semibold"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {ch.sidebarActive}
                  </button>
                ))}
              </div>

              {/* Mini Scrubber Track */}
              <div className="w-24 sm:w-32 h-1 bg-muted rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-foreground transition-all duration-100 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
