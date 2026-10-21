import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Headphones,
  PenTool,
  Zap,
  Layers,
  CheckCircle2,
  FileText,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Mail,
  Check,
  X,
  Award,
  Eye,
  Flame,
  BookOpen,
  Calculator,
  GraduationCap,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CoverflowCarousel } from "@/components/CoverflowCarousel";
import { PURELEARN_COVERFLOW_FEATURES } from "@/data/coverflow-features";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Purelearn.ai Features — Socratic AI Tutoring, Audio Notes, Scratchpad & Accessibility" },
      {
        name: "description",
        content:
          "Explore Purelearn.ai's complete feature suite: Socratic audio dialogue, tablet freehand Scratchpad with AI vision, ADHD/Dyslexia accommodation modes, in-chat @ commands, KaTeX STEM formatting, and gamified daily streaks.",
      },
      { property: "og:title", content: "Purelearn.ai Features — Socratic AI Tutoring & Neuro-Inclusive Learning" },
      {
        property: "og:description",
        content:
          "Conversational Socratic audio dialogues, stylus-native mathematical scratchpad, in-chat @ commands, and neuro-inclusive learning modes.",
      },
      { property: "og:url", content: "https://purelearn.vigilance.rw/features" },
      { property: "og:image", content: "https://purelearn.vigilance.rw/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Purelearn.ai Features — Complete Platform Overview" },
      {
        name: "twitter:description",
        content:
          "Discover Socratic audio notes, tablet math scratchpad, cognitive accommodation modes, and precision flashcards on Purelearn.ai.",
      },
    ],
    links: [{ rel: "canonical", href: "https://purelearn.vigilance.rw/features" }],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const [activeModalTab, setActiveModalTab] = useState<"audio" | "scratchpad" | "commands" | "cognitive">("audio");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeScratchTool, setActiveScratchTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [activeCognitiveMode, setActiveCognitiveMode] = useState<"standard" | "adhd" | "dyslexia" | "sensory">("adhd");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="Purelearn.ai Logo" className="h-10 w-auto sm:h-11" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/features" className="text-foreground font-semibold transition">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition">
              Pricing
            </Link>
            <Link to="/request-demo" className="hover:text-foreground transition">
              Request Demo
            </Link>
            <Link to="/changelog" className="hover:text-foreground transition">
              Changelog
            </Link>
            <Link to="/community" className="hover:text-foreground transition">
              Community
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/auth/sign-in"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-border hover:bg-muted text-foreground transition"
            >
              Sign In
            </Link>
            <Link
              to="/auth/sign-up"
              className="text-xs font-bold px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground shadow-xs transition flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 bg-radial from-primary/5 via-background to-background">
          <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
            <ScrollReveal animation="fade-up">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Comprehensive Platform Architecture
              </span>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.12]">
                Every Tool Engineered for{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Deep Socratic Mastery.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Zero passive answer-dumping. Purelearn combines dual-voice spoken dialogues, tablet-native mathematical
                scratchpads, neuro-inclusive reading accommodations, and instant in-chat commands into a seamless learning engine.
              </p>
            </ScrollReveal>

            {/* Quick Feature Pills */}
            <ScrollReveal animation="fade-up" delay={150}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs font-semibold text-muted-foreground">
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-primary" /> Socratic Audio Dialogue
                </span>
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-primary" /> Stylus iPad Scratchpad
                </span>
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" /> In-Chat @ Commands
                </span>
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-primary" /> ADHD & Dyslexia Modes
                </span>
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-500" /> Daily XP Streaks
                </span>
                <span className="px-3 py-1.5 rounded-lg border border-border/80 bg-elevated/40 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-primary" /> Native KaTeX Formulas
                </span>
              </div>
            </ScrollReveal>

            {/* CTA Buttons */}
            <ScrollReveal animation="fade-up" delay={250}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/auth/sign-up"
                  className="px-6 py-3.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/request-demo"
                  className="px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm text-foreground transition"
                >
                  Request Educator Demo
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 3D Coverflow Perspective Carousel */}
        <section className="py-12 md:py-20 bg-elevated/5 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <ScrollReveal animation="fade-up">
              <CoverflowCarousel
                items={PURELEARN_COVERFLOW_FEATURES}
                tagline="Interactive 3D Carousel"
                title="Explore Capabilities in 3D"
                subtitle="Click any card or use the navigation arrows to inspect our foundational modalities."
                defaultIndex={1}
              />
            </ScrollReveal>
          </div>
        </section>

        {/* Live Interactive Modalities Showcase */}
        <section className="py-20 bg-elevated/15">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Interactive Preview</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Test-Drive the Core Capabilities
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Switch between modalities below to experience how each tool reshapes your focus and accelerates understanding.
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-card border border-border max-w-2xl mx-auto mb-10 shadow-xs">
                {(
                  [
                    { id: "audio", label: "Socratic Audio", icon: Headphones },
                    { id: "scratchpad", label: "Tablet Scratchpad", icon: PenTool },
                    { id: "commands", label: "In-Chat @ Commands", icon: Zap },
                    { id: "cognitive", label: "Cognitive Modes", icon: SlidersHorizontal },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeModalTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Interactive Tab Containers */}
            <div className="max-w-4xl mx-auto">
              {/* Tab 1: Socratic Audio */}
              {activeModalTab === "audio" && (
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Audio Dialogue System</span>
                      <h3 className="text-xl font-bold text-foreground mt-0.5">Dual-Speaker Socratic Dialogue</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI-generated collaborative dialogue between Lead Explainer and Analytical Deep-Diver.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Neural Voice Engine
                      </span>
                    </div>
                  </div>

                  <div className="my-6 space-y-3">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                      <span className="text-[10px] font-bold uppercase text-foreground block mb-1">
                        Mentor (Lead Explainer)
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        &ldquo;Consider how eigenvalues represent the scale factors by which an eigenvector stretches along its principal axis without rotating.&rdquo;
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-[10px] font-bold uppercase text-primary block mb-1">
                        Analyst (Deep Dive)
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">
                        &ldquo;Right, meaning that in principal component analysis, the eigenvectors with the largest eigenvalues capture the direction of maximum variance in the data cloud.&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition cursor-pointer shadow-xs shrink-0"
                        aria-label={isPlayingAudio ? "Pause Audio" : "Play Audio"}
                      >
                        {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </button>
                      <div>
                        <p className="text-xs font-bold text-foreground">Linear Algebra: Eigenvalue Decomposition</p>
                        <p className="text-[10px] text-muted-foreground font-mono">01:42 / 03:50 • Collaborative Dialogue</p>
                      </div>
                    </div>

                    {/* Animated Waveform Visualizer */}
                    <div className="flex items-center gap-1 h-6">
                      {[40, 75, 25, 90, 60, 100, 45, 80, 30, 95, 70, 40, 85, 55, 30].map((h, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full transition-all duration-300 ${
                            isPlayingAudio ? "bg-primary animate-pulse" : "bg-border"
                          }`}
                          style={{ height: isPlayingAudio ? `${h}%` : "30%" }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Volume2 className="h-3.5 w-3.5 text-foreground" />
                      <span>Natural Speech API</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Tablet Scratchpad */}
              {activeModalTab === "scratchpad" && (
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Tablet & Stylus Native</span>
                      <h3 className="text-xl font-bold text-foreground mt-0.5">Freehand Mathematical Canvas</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Draw math proofs, matrix transformations, and physics free-body diagrams with Apple Pencil support.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(["pen", "highlighter", "eraser"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActiveScratchTool(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                            activeScratchTool === t
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Stylus Canvas */}
                  <div
                    className="my-6 relative h-48 w-full rounded-xl border border-border bg-muted/20 p-4 flex flex-col justify-between overflow-hidden"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 0.75px, transparent 0.75px)",
                      backgroundSize: "14px 14px",
                      color: "var(--border)",
                    }}
                  >
                    <svg
                      className="absolute inset-0 h-full w-full pointer-events-none text-foreground/80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M 40 130 C 90 30, 160 30, 220 120 S 320 140, 420 50" />
                      <circle cx="220" cy="120" r="4" fill="currentColor" />
                      <line x1="220" y1="120" x2="220" y2="170" strokeDasharray="4 4" strokeWidth="2" />
                    </svg>

                    <div className="flex items-center justify-between z-10">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-background/90 border border-border/80 text-foreground font-semibold">
                        f(x) = x³ - 3x² + 2
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border/60">
                        Pencil Pressure: 0.82
                      </span>
                    </div>

                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                          ✓ Socratic AI Vision Ready
                        </span>
                      </div>
                      <span className="text-[11px] text-primary font-bold bg-background/90 px-2.5 py-1 rounded border border-border">
                        Hint: Look at the inflection point at x = 1
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Apple Pencil & Wacom stylus palm rejection
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Socratic AI Drawer hints without answer spoiling
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: In-Chat @ Commands */}
              {activeModalTab === "commands" && (
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Zero Context-Switching</span>
                      <h3 className="text-xl font-bold text-foreground mt-0.5">Keyboard-First In-Chat Commands</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Summon study generators instantly inside any chat by typing &apos;@&apos;. Press Tab to autocomplete.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                      Shortcuts: @quiz • @flashcards • @audio • @all
                    </span>
                  </div>

                  <div className="my-6 space-y-3">
                    {/* Simulated Command Autocomplete Popover */}
                    <div className="rounded-xl border border-border bg-background p-2 shadow-md max-w-sm space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 pb-1.5">
                        <span>Available Command Actions</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-sans border border-border text-primary font-bold">
                          Tab ⇥
                        </kbd>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/10 text-foreground text-xs font-semibold ring-1 ring-primary/30">
                        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-mono font-bold text-primary">@quiz</p>
                          <p className="text-[11px] text-muted-foreground">Generate precision quiz loop from this section</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 text-xs">
                        <Layers className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-mono font-bold text-foreground">@flashcards</p>
                          <p className="text-[11px] text-muted-foreground">Extract spaced repetition active recall cards</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 text-xs">
                        <Headphones className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-mono font-bold text-foreground">@audio</p>
                          <p className="text-[11px] text-muted-foreground">Synthesize conversational audio podcast</p>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Input Bar */}
                    <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between text-xs font-mono">
                      <span className="text-foreground">
                        Can you explain Backpropagation through time? <span className="text-primary font-bold">@quiz</span>
                        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded border border-border font-sans font-medium">
                        Enter ↵
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Turn any conversation snippet, lecture note, or uploaded syllabus into practice materials in under 2 seconds.
                  </p>
                </div>
              )}

              {/* Tab 4: Cognitive Modes */}
              {activeModalTab === "cognitive" && (
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Neuro-Inclusive Design</span>
                      <h3 className="text-xl font-bold text-foreground mt-0.5">Cognitive Accommodation Modes</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tailored formatting engines that adapt typography, fixation anchors, and color contrast.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: "adhd", label: "ADHD Bionic" },
                          { id: "dyslexia", label: "Dyslexia Kerning" },
                          { id: "sensory", label: "Sensory Calm" },
                          { id: "standard", label: "Standard" },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveCognitiveMode(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            activeCognitiveMode === m.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sample Reading Preview */}
                  <div className="my-6 p-6 rounded-xl border border-border bg-background transition-all">
                    {activeCognitiveMode === "adhd" && (
                      <div className="space-y-3 leading-relaxed text-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Active: Bionic Reading (Anchor Fixation)
                        </span>
                        <p className="text-foreground">
                          <b>Neur</b>otransmitters <b>li</b>ke <b>dopa</b>mine <b>regul</b>ate <b>synap</b>tic <b>plas</b>ticity,{" "}
                          <b>reinfor</b>cing <b>pathw</b>ays <b>dur</b>ing <b>focu</b>sed <b>lear</b>ning <b>epis</b>odes. <b>Wh</b>en{" "}
                          <b>inf</b>ormation <b>i</b>s <b>struc</b>tured <b>wi</b>th <b>cle</b>ar <b>vis</b>ual <b>anch</b>ors,{" "}
                          <b>atten</b>tion <b>drift</b> <b>decre</b>ases <b>signifi</b>cantly.
                        </p>
                      </div>
                    )}

                    {activeCognitiveMode === "dyslexia" && (
                      <div className="space-y-3 leading-loose tracking-widest text-sm font-sans">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Active: OpenDyslexic Spacing & High-Legibility Kerning
                        </span>
                        <p className="text-foreground text-base">
                          Neurotransmitters like dopamine regulate synaptic plasticity, reinforcing pathways during focused learning episodes.
                          Weighted letter baselines prevent optical character inversion.
                        </p>
                      </div>
                    )}

                    {activeCognitiveMode === "sensory" && (
                      <div className="space-y-3 leading-relaxed text-sm bg-amber-50/40 dark:bg-stone-900/60 p-4 rounded-lg border border-amber-200/50 dark:border-stone-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-500/10 text-stone-600 dark:text-stone-300 border border-stone-500/20">
                          Active: Sensory Calm Low-Stimulus Mode
                        </span>
                        <p className="text-stone-700 dark:text-stone-300">
                          Warm, desaturated amber illumination reduces retina fatigue. High-contrast flashes and animated elements are
                          silenced to maintain nervous system tranquility.
                        </p>
                      </div>
                    )}

                    {activeCognitiveMode === "standard" && (
                      <div className="space-y-3 leading-relaxed text-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          Active: Default Minimalist
                        </span>
                        <p className="text-muted-foreground">
                          Clean serif and sans-serif typography with standard line heights, balanced contrast, and responsive layout scaling.
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Preferences persist directly in cloud profile records and automatically synchronize across your phone, tablet, and laptop.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 8 Core Feature Pillars */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <ScrollReveal animation="fade-up">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                Full System Architecture
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mt-3">
                Built from First Principles for STEM & Higher Ed
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Explore every layer of the Purelearn engine — from real-time speech generation to strict row-level student privacy.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <ScrollReveal animation="crazy-reveal" delay={0} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Socratic Spoken Audio</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Convert textbooks, notes, and study guides into spoken audio dialogues. Two collaborative educators walk through difficult derivations on your commute.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Mini-player & scrubber
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 2 */}
            <ScrollReveal animation="crazy-reveal" delay={100} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">iPad & Stylus Scratchpad</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Brainstorm proofs with Apple Pencil. Socratic AI Drawer analyzes handwritten steps and guides you through calculus equations without revealing solutions.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Palm rejection & export
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 3 */}
            <ScrollReveal animation="crazy-reveal" delay={200} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">In-Chat &apos;@&apos; Commands</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Trigger actions without lifting your hands from the keyboard. Type @quiz, @flashcards, @audio, or @all with Tab autocomplete for instant study asset creation.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Keyboard autocomplete
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 4 */}
            <ScrollReveal animation="crazy-reveal" delay={300} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Cognitive Accommodation</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Designed specifically for ADHD, dyslexia, and sensory sensitivity. Bionic fixation guides focus, weighted fonts prevent character flips, and warm tones eliminate eye strain.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Cloud theme sync
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 5 */}
            <ScrollReveal animation="crazy-reveal" delay={400} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-5">
                    <Flame className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Streaks & Hick&apos;s Law</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Build bulletproof study habits. Daily timezone-aware streaks provide +2x XP multipliers, milestone celebrations, and rewarding SVG achievement badges.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Daily streak persistence
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 6 */}
            <ScrollReveal animation="crazy-reveal" delay={500} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">KaTeX & Code Blocks</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Native double-dollar LaTeX mathematical formatting. Multi-variable integrals, differential equations, and code algorithms render with crystal clarity.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Block & inline LaTeX
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 7 */}
            <ScrollReveal animation="crazy-reveal" delay={600} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Spaced Repetition Decks</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Auto-synthesize precision flashcards from course materials. 3D card flips with difficulty scoring track retention curves and optimize review intervals.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Active recall pacing
                </div>
              </Card>
            </ScrollReveal>

            {/* Pillar 8 */}
            <ScrollReveal animation="crazy-reveal" delay={700} className="h-full">
              <Card className="p-7 flex flex-col justify-between h-full bg-elevated/15 border border-border/70 rounded-2xl hover:border-primary/40 hover:-translate-y-1 transition duration-300">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Educator Sandboxes & Mail</h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    Teacher verification workflows, syllabus ingestion, and institutional compliance. Send targeted announcements via the integrated Resend Email Broadcast Studio.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Resend API & RLS
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* Comparison Matrix Table */}
        <section className="py-20 bg-elevated/10">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Architectural Advantage</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Why Socratic Tutoring Outperforms Generic AI
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  See how Purelearn.ai compares to standard chatbots and traditional flashcard software.
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="py-4 px-6 font-bold text-foreground text-sm">Capability</th>
                      <th className="py-4 px-6 font-bold text-primary text-sm bg-primary/5">Purelearn.ai</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-sm">Generic AI (ChatGPT / Claude)</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-sm">Traditional Flashcards (Anki / Quizlet)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Socratic Guided Inquiry (No Spoiled Answers)</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> Native Core
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Dumps final answers
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Passive static cards
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Conversational Spoken Audio Breakdown</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> Dual-speaker synthesis
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Monotone reading
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Not available
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Tablet Stylus & Math Vision Scratchpad</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> Apple Pencil & hints
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Keyboard only
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Not supported
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Neuro-Inclusive Cognitive Accommodations</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> ADHD & Dyslexia modes
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Generic UI
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Basic themes only
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">In-Chat Keyboard &apos;@&apos; Command Shortcuts</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> @quiz, @audio, @cards
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Manual prompting
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <X className="h-4 w-4 inline mr-1 text-red-400" /> Not applicable
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Strict Row-Level Student Data Isolation</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> Verified Row-Level Security
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">Used for model training</td>
                      <td className="py-4 px-6 text-muted-foreground">Public decks by default</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-semibold text-foreground">Educator Sandboxes & Broadcast Studio</td>
                      <td className="py-4 px-6 bg-primary/5 text-primary font-bold">
                        <Check className="h-4 w-4 inline mr-1 text-emerald-500" /> Integrated suite
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">Enterprise add-on</td>
                      <td className="py-4 px-6 text-muted-foreground">Limited teacher tools</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <ScrollReveal animation="fade-up">
            <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-background p-10 md:p-16 text-center overflow-hidden shadow-lg">
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25">
                  Begin Your Journey
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                  Ready to Experience Real Conceptual Clarity?
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Join thousands of STEM students, researchers, and educators learning with an adaptive AI tutor that speaks, sketches,
                  and adapts to your brain.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    to="/auth/sign-up"
                    className="px-6 py-3.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm shadow-md transition flex items-center gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/request-demo"
                    className="px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm text-foreground transition"
                  >
                    Schedule an Institutional Walkthrough
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Connected Brand Footer */}
      <Footer />
    </div>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-white via-neutral-50 to-neutral-100/50 dark:from-background dark:via-elevated/20 dark:to-elevated/40 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 relative z-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 items-start">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="Purelearn.ai Logo" className="h-12 w-auto" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              An adaptive Socratic learning engine designed for cognitive diversity, visual preference mapping, and conceptual STEM
              mastery.
            </p>
          </div>
          <FooterCol title="Product" links={["Features", "Pricing", "Request Demo", "Changelog"]} />
          <FooterCol title="Company" links={["Community", "Blog", "Contact us"]} />
          <FooterCol title="Legal" links={["Terms & conditions", "Privacy policy", "GDPR"]} />
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/80 pt-8 sm:flex-row">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">© {currentYear} Purelearn.ai. All rights reserved.</p>
            <p className="text-sm text-muted-foreground/60">
              Adapting education loops, note syntheses, and quizzes dynamically.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground">
            <a
              href="https://x.com/CybeReazon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
              aria-label="Twitter / X profile"
            >
              Twitter
            </a>
            <span className="text-border">•</span>
            <a
              href="https://github.com/EmmaTheDev01"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
              aria-label="GitHub profile"
            >
              GitHub
            </a>
            <span className="text-border">•</span>
            <a
              href="https://discord.com/users/939201208235741184"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
              aria-label="Discord profile"
            >
              Discord
            </a>
          </div>
        </div>
      </div>

      {/* Overflowing bottom background typography */}
      <div className="pointer-events-none select-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden z-0">
        <span className="text-[11.5vw] font-black tracking-tighter leading-none whitespace-nowrap bg-gradient-to-b from-neutral-900/[0.14] via-neutral-900/[0.08] to-neutral-900/[0.02] dark:from-white/[0.14] dark:via-white/[0.08] dark:to-white/[0.02] bg-clip-text text-transparent translate-y-[32%] select-none">
          Purelearn.ai
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  const routeMap: Record<string, string> = {
    features: "/features",
    pricing: "/pricing",
    "request demo": "/request-demo",
    changelog: "/changelog",
    community: "/community",
    blog: "/blog",
    "contact us": "/contact",
    "terms & conditions": "/terms",
    "privacy policy": "/privacy",
    gdpr: "/gdpr",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider text-foreground">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link}>
            <Link
              to={routeMap[link.toLowerCase()] || "/"}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
