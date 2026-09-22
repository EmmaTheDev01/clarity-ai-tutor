import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BrainCircuit,
  Library,
  FileText,
  PenTool,
  Layers,
  Gamepad2,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
} from "lucide-react";

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "step_dashboard",
    targetSelector: 'a[href="/app"]',
    title: "AI Tutor & Study Dashboard",
    badge: "Step 1 of 7",
    description:
      "Your core learning command center. Chat with your Socratic AI Tutor, upload learning materials, receive step-by-step guided hints, and master tough concepts without just being spoon-fed answers.",
    icon: BrainCircuit,
  },
  {
    id: "step_library",
    targetSelector: 'a[href="/app/library"]',
    title: "Course Materials & Library",
    badge: "Step 2 of 7",
    description:
      "Upload course syllabi, textbooks, research PDFs, or YouTube lecture links. PureLearn autonomously parses the content to generate interactive quizzes and structured curriculum guides.",
    icon: Library,
  },
  {
    id: "step_notes",
    targetSelector: 'a[href="/app/notes"]',
    title: "Digital Notebook & Summaries",
    badge: "Step 3 of 7",
    description:
      "Organize notes with pristine Markdown and KaTeX mathematical notation. Share notes with study partners, pin critical summaries, and export study guides.",
    icon: FileText,
  },
  {
    id: "step_notepad",
    targetSelector: 'a[href="/app/notepad"]',
    title: "Tablet Notepad & Apple Pencil Scratchpad",
    badge: "Step 4 of 7",
    description:
      "Designed specifically for iPads and tablets. Write naturally with Apple Pencil or stylus using adaptive pressure sensitivity, Bézier curve smoothing, and palm rejection. Socratic AI Vision will inspect your handwriting and turn it into a study guide!",
    icon: PenTool,
  },
  {
    id: "step_flashcards",
    targetSelector: 'a[href="/app/flashcards"]',
    title: "Spaced Retrieval Flashcards",
    badge: "Step 5 of 7",
    description:
      "Train active recall through scientifically backed spaced repetition. Flip cards, rate conceptual difficulty, and reinforce memory before exams.",
    icon: Layers,
  },
  {
    id: "step_teasers",
    targetSelector: 'a[href="/app/teasers"]',
    title: "Brain Teasers & Cognitive Challenges",
    badge: "Step 6 of 7",
    description:
      "Keep your mind sharp every day with curated mathematical puzzles, logic riddles, and daily streak quests. Earn mastery XP and unlock achievement badges.",
    icon: Gamepad2,
  },
  {
    id: "step_search",
    targetSelector: "#global-search-input",
    title: "Global Command Palette (Cmd + K)",
    badge: "Step 7 of 7",
    description:
      "Instant navigation across your entire learning space. Press Cmd+K or Ctrl+K anywhere to jump between notes, flashcard decks, course documents, and settings.",
    icon: Search,
  },
];

export function startAppTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("purelearn:start_tour"));
  }
}

export function InteractiveAppTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Check if tour should auto-start on first ever visit
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem("purelearn_tour_completed");
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Listen for custom trigger event
  useEffect(() => {
    const handleStart = () => {
      setCurrentStepIdx(0);
      setIsOpen(true);
    };
    window.addEventListener("purelearn:start_tour", handleStart);
    return () => window.removeEventListener("purelearn:start_tour", handleStart);
  }, []);

  // Update target element bounding rect & scroll into view smoothly
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIdx];
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIdx]);

  useEffect(() => {
    // Delay slightly to let route or DOM render
    const t = setTimeout(updateTargetPosition, 100);
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("purelearn_tour_completed", "true");
    } catch (e) {
      // ignore
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIdx];
  const IconComponent = currentStep.icon;
  const isLast = currentStepIdx === TOUR_STEPS.length - 1;

  // Compute smart tooltip card placement relative to targetRect
  let cardStyle: React.CSSProperties = {};
  let pointerDirection: "left" | "top" | "center" = "center";

  if (targetRect && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isDesktop = vw >= 768;

    if (isDesktop) {
      // If target is in the left sidebar
      if (targetRect.left < vw * 0.35) {
        pointerDirection = "left";
        const topPos = Math.max(20, Math.min(vh - 360, targetRect.top - 20));
        cardStyle = {
          position: "fixed",
          left: `${targetRect.right + 28}px`,
          top: `${topPos}px`,
        };
      } else {
        // Target is at the top (e.g. search bar)
        pointerDirection = "top";
        const leftPos = Math.max(20, Math.min(vw - 440, targetRect.left));
        cardStyle = {
          position: "fixed",
          left: `${leftPos}px`,
          top: `${targetRect.bottom + 24}px`,
        };
      }
    } else {
      // Mobile: station near bottom
      cardStyle = {
        position: "fixed",
        bottom: "24px",
        left: "16px",
        right: "16px",
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden">
      {/* 
        True Spotlight Cutout:
        If targetRect exists, we use a box-shadow cutout so the element inside is 100% VISIBLE
        and NOT dimmed by the dark backdrop!
      */}
      {targetRect ? (
        <>
          {/* Spotlight cutout container */}
          <div
            onClick={handleClose}
            className="fixed pointer-events-auto transition-all duration-300 rounded-xl"
            style={{
              left: Math.max(0, targetRect.left - 6),
              top: Math.max(0, targetRect.top - 6),
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
            }}
          >
            {/* Glowing active ring around the highlighted element */}
            <div className="w-full h-full rounded-xl ring-4 ring-primary/50 border-2 border-primary animate-pulse" />

            {/* Visible Animated Pointer Beacon on the target */}
            <div className="absolute -top-3 -right-3 flex items-center justify-center z-50">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-primary text-primary-foreground text-[10px] font-black items-center justify-center shadow-lg">
                  {currentStepIdx + 1}
                </span>
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Fallback dark overlay if targetRect is not found */
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Interactive Tour Tooltip Card */}
      <div
        ref={cardRef}
        style={targetRect ? cardStyle : undefined}
        className={`z-50 w-full max-w-md bg-card text-card-foreground border-2 border-border shadow-[0_25px_60px_rgba(0,0,0,0.5)] rounded-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200 ${
          !targetRect ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""
        }`}
      >
        {/* Visible Directional Arrow pointer attached to the card pointing at the target */}
        {targetRect && pointerDirection === "left" && (
          <div className="hidden md:flex absolute -left-3.5 top-8 items-center text-primary filter drop-shadow-md">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[14px] border-r-card" />
          </div>
        )}
        {targetRect && pointerDirection === "top" && (
          <div className="hidden md:flex absolute -top-3.5 left-8 items-center text-primary filter drop-shadow-md">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-card" />
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {currentStep.badge}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
          {currentStep.description}
        </p>

        {/* Step dots & Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIdx
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted hover:bg-muted-foreground/40"
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>{isLast ? "Done" : "Next"}</span>
              {isLast ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
