import React from "react";
import {
  Headphones,
  PenTool,
  Zap,
  Brain,
  Calculator,
  Flame,
  Layers,
} from "lucide-react";
import { CoverflowItem } from "@/components/CoverflowCarousel";

export const PURELEARN_COVERFLOW_FEATURES: CoverflowItem[] = [
  {
    id: "socratic-audio",
    badge: "Audio Modality",
    category: "Spoken Dialogue",
    title: "Socratic Spoken Audio",
    description:
      "Transform written notes and dense proofs into conversational audio dialogues between two expert co-explainers with natural neural speech.",
    accentColor: "#3b82f6",
    gradientBg: "bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100 dark:from-blue-950/40 dark:via-sky-900/20 dark:to-indigo-950/40",
    iconBg: "bg-blue-500",
    sealIcon: <Headphones className="h-4 w-4 text-primary" />,
    linkTo: "/features",
    linkText: "Explore Audio Dialogue",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
          <Headphones className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 h-6">
          {[40, 75, 30, 95, 60, 100, 50, 85, 35, 90, 65, 40].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-blue-500/70 rounded-full animate-pulse"
              style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
          Dual-Speaker Neural Synthesis
        </span>
      </div>
    ),
  },
  {
    id: "tablet-scratchpad",
    badge: "Apple Pencil & Stylus",
    category: "Freehand Canvas",
    title: "Tablet Math Scratchpad",
    description:
      "Sketch math derivations and circuit proofs naturally. Socratic AI Drawer analyzes handwritten steps and guides you without spoiling solutions.",
    accentColor: "#10b981",
    gradientBg: "bg-gradient-to-br from-emerald-100 via-teal-50 to-green-100 dark:from-emerald-950/40 dark:via-teal-900/20 dark:to-green-950/40",
    iconBg: "bg-emerald-500",
    sealIcon: <PenTool className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    linkTo: "/features",
    linkText: "Discover Scratchpad",
    renderIllustration: () => (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-full max-w-[210px] h-28 rounded-xl border border-emerald-500/30 bg-background/80 dark:bg-card/80 p-2.5 shadow-sm overflow-hidden flex flex-col justify-between">
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none text-emerald-600/80 dark:text-emerald-400/80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M 15 65 Q 55 10 100 45 T 195 25" />
            <circle cx="100" cy="45" r="3.5" fill="currentColor" />
          </svg>
          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-700 dark:text-emerald-300 z-10">
            <span>f(x) = x³ - 3x</span>
            <PenTool className="h-3 w-3 text-emerald-500" />
          </div>
          <div className="text-[8px] font-bold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded w-fit z-10 border border-emerald-500/20">
            Vectorized Stroke
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "inchat-commands",
    badge: "Keyboard Flow",
    category: "Zero Context Switch",
    title: "In-Chat '@' Commands",
    description:
      "Never dig through nested menus. Type @quiz, @flashcards, or @audio with Tab autocomplete directly inside any chat to generate assets instantly.",
    accentColor: "#f59e0b",
    gradientBg: "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-950/40 dark:via-orange-900/20 dark:to-yellow-950/40",
    iconBg: "bg-amber-500",
    sealIcon: <Zap className="h-4 w-4 text-amber-500" />,
    linkTo: "/features",
    linkText: "View Command Shortcuts",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[220px]">
        <div className="w-full rounded-xl border border-amber-500/30 bg-background/90 dark:bg-card/90 p-2 shadow-sm space-y-1 text-left">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[10px] font-bold font-mono">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>@quiz</span>
            <span className="text-[8px] text-muted-foreground ml-auto font-sans">Press Tab ⇥</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-muted-foreground text-[9px] font-mono">
            <span>@flashcards</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-muted-foreground text-[9px] font-mono">
            <span>@audio</span>
          </div>
        </div>
        <span className="text-[9px] font-mono font-semibold text-amber-600 dark:text-amber-400">
          Instant In-Chat Tool Dispatch
        </span>
      </div>
    ),
  },
  {
    id: "cognitive-modes",
    badge: "Neuro-Inclusive",
    category: "Cognitive Diversity",
    title: "Cognitive Diversity Modes",
    description:
      "Tailor your reading engine: ADHD Bionic anchor fixation, OpenDyslexic character spacing, and low-stimulus sensory warm contrast.",
    accentColor: "#8b5cf6",
    gradientBg: "bg-gradient-to-br from-purple-100 via-fuchsia-50 to-indigo-100 dark:from-purple-950/40 dark:via-fuchsia-900/20 dark:to-indigo-950/40",
    iconBg: "bg-purple-500",
    sealIcon: <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    linkTo: "/features",
    linkText: "Explore Accessibility",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-2.5 text-center px-2">
        <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
          <Brain className="h-8 w-8" />
        </div>
        <div className="p-2 rounded-lg bg-background/80 dark:bg-card/80 border border-purple-500/20 text-[10px] text-foreground leading-snug">
          <b>Neu</b>ro-<b>inc</b>lusive <b>vis</b>ual <b>anch</b>ors
        </div>
        <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          <span>ADHD</span> • <span>Dyslexia</span> • <span>Low-Light</span>
        </div>
      </div>
    ),
  },
  {
    id: "katex-stem",
    badge: "STEM Precision",
    category: "LaTeX Rendering",
    title: "KaTeX STEM Formatting",
    description:
      "Crystal-clear display for double-dollar LaTeX blocks ($$), multi-line differential equations, matrices, and syntax-highlighted code blocks.",
    accentColor: "#ec4899",
    gradientBg: "bg-gradient-to-br from-pink-100 via-rose-50 to-red-100 dark:from-pink-950/40 dark:via-rose-900/20 dark:to-red-950/40",
    iconBg: "bg-pink-500",
    sealIcon: <Calculator className="h-4 w-4 text-pink-500" />,
    linkTo: "/features",
    linkText: "View Formula Engine",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[200px]">
        <div className="w-full rounded-xl border border-pink-500/30 bg-background/90 dark:bg-card/90 p-3 shadow-sm text-center">
          <p className="font-serif text-sm font-bold text-foreground">
            {"\\oint_C \\mathbf{B} \\cdot d\\boldsymbol{\\ell} = \\mu_0 I_{\\text{enc}}"}
          </p>
          <div className="mt-2 text-[8px] font-mono text-pink-600 dark:text-pink-400 bg-pink-500/10 py-0.5 rounded">
            MathJax / KaTeX Core
          </div>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">Unbreakable Copy-Paste</span>
      </div>
    ),
  },
  {
    id: "habit-streaks",
    badge: "Habit Loops",
    category: "Gamification & Hick's Law",
    title: "Daily Streaks & Hick's Law",
    description:
      "Maintain active study momentum. Timezone-aware streaks grant +2x XP multipliers, milestone celebrations, and bespoke SVG achievement badges.",
    accentColor: "#f97316",
    gradientBg: "bg-gradient-to-br from-orange-100 via-amber-50 to-red-100 dark:from-orange-950/40 dark:via-amber-900/20 dark:to-red-950/40",
    iconBg: "bg-orange-500",
    sealIcon: <Flame className="h-4 w-4 text-orange-500" />,
    linkTo: "/features",
    linkText: "Learn About Streaks",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
          <Flame className="h-9 w-9 animate-bounce" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold">
          <span>7-Day Streak</span>
          <span>•</span>
          <span className="text-orange-500">+2x XP</span>
        </div>
        <span className="text-[9px] text-muted-foreground">Cognitive Fatigue Reduction</span>
      </div>
    ),
  },
  {
    id: "spaced-flashcards",
    badge: "Active Recall",
    category: "Memory Retention",
    title: "Spaced Repetition Decks",
    description:
      "Auto-synthesize precision flashcards from course materials. 3D card flips with difficulty scoring track retention curves and optimize intervals.",
    accentColor: "#06b6d4",
    gradientBg: "bg-gradient-to-br from-cyan-100 via-sky-50 to-blue-100 dark:from-cyan-950/40 dark:via-sky-900/20 dark:to-blue-950/40",
    iconBg: "bg-cyan-500",
    sealIcon: <Layers className="h-4 w-4 text-cyan-500" />,
    linkTo: "/features",
    linkText: "Explore Flashcards",
    renderIllustration: () => (
      <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[200px]">
        <div className="relative w-full h-24 rounded-xl border border-cyan-500/30 bg-background/90 dark:bg-card/90 p-2.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
            <span>Card 14 / 45</span>
            <Layers className="h-3.5 w-3.5 text-cyan-500" />
          </div>
          <p className="text-xs font-medium text-foreground text-center">
            Define Hebbian Learning rule
          </p>
          <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-muted">Hard</span>
            <span className="px-1.5 py-0.5 rounded bg-muted">Good</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-bold">Easy</span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400">
          3D Interactive Flip Engine
        </span>
      </div>
    ),
  },
];
