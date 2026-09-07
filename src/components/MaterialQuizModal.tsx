import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SvgBadge, getUnderstandingCategory } from "@/components/ui/svg-badges";
import { generateGeminiStructured } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { triggerCelebration, unlockBadge } from "@/lib/celebration";
import {
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  empoweringAnalogyHint: string;
  conceptExplanation: string;
}

interface MaterialQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTitle?: string | null;
  materialContent?: string | null;
  materialId?: string | null;
  onRewardClaimed?: (xp: number, tokens: number) => void;
}

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the primary role of a function or modular procedure in problem solving?",
    options: [
      "To repeat identical code over and over manually",
      "To package a specific reusable activity that executes upon command",
      "To permanently stop the program from accepting user input",
      "To convert all variables into static text files",
    ],
    correctIndex: 1,
    empoweringAnalogyHint:
      "Imagine playing a video game where you have a set of controls: when you press SHIFT + W, your character sprints forward. That button command is just like a function call—it isolates one specific, reusable activity whenever you choose to invoke it!",
    conceptExplanation:
      "Functions encapsulate dedicated tasks into named blocks that you can run whenever needed without repeating instructions.",
  },
  {
    question: "How does breaking a complex problem into smaller concepts empower your understanding?",
    options: [
      "It reduces cognitive load so each building block is mastered with clarity",
      "It confuses the core logic by introducing too many files",
      "It only benefits automated compilers, not human learners",
      "It prevents anyone else from reading your solution",
    ],
    correctIndex: 0,
    empoweringAnalogyHint:
      "Think of building a complex LEGO castle or spaceship. Rather than assembling the entire fortress in a single motion, you construct sub-assemblies (towers, gates, walls) step by step. Each component fits together seamlessly!",
    conceptExplanation:
      "Decomposition simplifies complex systems into clear, intuitive modules that are easy to reason about and test.",
  },
  {
    question: "When applying a new concept, what is the best way to verify true mastery?",
    options: [
      "Memorizing words without understanding their cause-and-effect relationship",
      "Testing the concept with variations and explaining it through relatable analogies",
      "Never questioning underlying assumptions or edge cases",
      "Relying solely on first impressions without hands-on practice",
    ],
    correctIndex: 1,
    empoweringAnalogyHint:
      "Think of learning to drive or play a musical instrument: you do not simply read sheet music; you play different rhythms and tempos to test your instinct in varied conditions!",
    conceptExplanation:
      "True comprehension is achieved when you can apply principles across different contexts and articulate them simply.",
  },
];

export function MaterialQuizModal({
  isOpen,
  onClose,
  materialTitle,
  materialContent,
  materialId,
  onRewardClaimed,
}: MaterialQuizModalProps) {
  const resolvedTitle = materialTitle || "Learning Material";
  const resolvedContent = materialContent || "";
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnalogy, setShowAnalogy] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingReward, setSavingReward] = useState(false);
  const [newUnderstanding, setNewUnderstanding] = useState<{
    level: string;
    badgeType: string;
    description: string;
    nextThreshold: number;
  } | null>(null);
  const [earnedRewards, setEarnedRewards] = useState({ xp: 150, tokens: 5 });

  // Generate or load questions when modal opens
  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    async function loadQuiz() {
      setLoading(true);
      resetState();

      try {
        const textSample = (resolvedContent || resolvedTitle).slice(0, 3500);

        if (textSample.length < 30) {
          setQuestions(FALLBACK_QUESTIONS);
          setLoading(false);
          return;
        }

        const schema = {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 4 options",
                  },
                  correctIndex: {
                    type: "integer",
                    description: "0, 1, 2, or 3 corresponding to the correct answer",
                  },
                  empoweringAnalogyHint: {
                    type: "string",
                    description:
                      "A vivid, empowering, relatable real-world analogy (e.g. video game controls, cooking recipes, vehicle mechanics, sports plays) that explains the concept intuitively without making the student feel dumb.",
                  },
                  conceptExplanation: {
                    type: "string",
                    description: "A clear, empowering 1-2 sentence explanation of the core concept.",
                  },
                },
                required: [
                  "question",
                  "options",
                  "correctIndex",
                  "empoweringAnalogyHint",
                  "conceptExplanation",
                ],
              },
            },
          },
          required: ["questions"],
        };

        const result = await generateGeminiStructured<{ questions: QuizQuestion[] }>({
          systemInstruction:
            "You are an empowering, world-class Socratic educator. Your mission is to build rock-solid conceptual understanding, not penalize mistakes. For every question, write an empoweringAnalogyHint that uses relatable, vivid everyday analogies (e.g. video game controller commands for programming functions: 'Imagine playing a video game and you have a set of commands to perform certain activities, when you hit SHIFT + W you sprint forward, that command call is like a function call, it isolates one particular activity based on the user's choice'; recipes for algorithms; blueprints for classes). Never make the student feel dumb. If they stumble, the analogy must immediately unlock the concept with confidence.",
          prompt: `Create 3 multiple choice questions that test conceptual understanding of this material:\n\nTitle: ${resolvedTitle}\nContent:\n${textSample}`,
          responseSchema: schema,
          temperature: 0.4,
        });

        if (result.data?.questions && result.data.questions.length > 0) {
          setQuestions(result.data.questions);
        } else {
          setQuestions(FALLBACK_QUESTIONS);
        }
      } catch (err) {
        console.warn("Using fallback quiz questions due to generation issue:", err);
        setQuestions(FALLBACK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [isOpen, resolvedTitle, resolvedContent]);  const [submitted, setSubmitted] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  function resetState() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnalogy(false);
    setAnsweredCorrectly(false);
    setSubmitted(false);
    setFailedCount(0);
    setCompleted(false);
    setSavingReward(false);
    setNewUnderstanding(null);
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (answeredCorrectly) return;
    setSelectedOption(idx);
    setSubmitted(false);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQ) return;
    setSubmitted(true);

    if (selectedOption === currentQ.correctIndex) {
      setAnsweredCorrectly(true);
      setShowAnalogy(false);
    } else {
      setAnsweredCorrectly(false);
      setShowAnalogy(true);
      setFailedCount((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowAnalogy(false);
      setAnsweredCorrectly(false);
      setSubmitted(false);
    } else {
      // Quiz complete!
      await handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    setCompleted(true);
    setSavingReward(true);

    try {
      // Trigger rich celebration
      triggerCelebration({ particleCount: 90 });
      unlockBadge("quiz_master");

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      let newCount = 1;
      let newLevel = "Novice Explorer";

      if (userId) {
        // Fetch current profile stats using correct primary key student_id
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("quizzes_mastered, quizzes_answered, quizzes_failed, understanding_level, daily_bonus_tokens, xp")
          .eq("student_id", userId)
          .maybeSingle();

        const currentMastered = (profile?.quizzes_mastered as number) || 0;
        const currentAnswered = (profile?.quizzes_answered as number) || 0;
        const currentFailed = (profile?.quizzes_failed as number) || 0;

        const isFullyMastered = failedCount === 0;
        const newMastered = isFullyMastered ? currentMastered + 1 : currentMastered;
        const newAnswered = currentAnswered + 1;
        const newFailed = currentFailed + (failedCount > 0 ? 1 : 0);

        const categoryInfo = getUnderstandingCategory(newMastered);
        newLevel = categoryInfo.level;
        setNewUnderstanding(categoryInfo);

        const currentBonusTokens = (profile?.daily_bonus_tokens as number) || 0;
        const currentXp = (profile?.xp as number) || 0;
        const awardedXp = isFullyMastered ? 150 : 75;
        const awardedTokens = isFullyMastered ? 5 : 2;

        // 1. Update student profile in database
        try {
          await supabase
            .from("student_profiles")
            .update({
              quizzes_mastered: newMastered,
              quizzes_answered: newAnswered,
              quizzes_failed: newFailed,
              understanding_level: newLevel,
              daily_bonus_tokens: currentBonusTokens + awardedTokens,
              xp: currentXp + awardedXp,
              updated_at: new Date().toISOString(),
            })
            .eq("student_id", userId);
        } catch (updateErr) {
          console.warn("Failed updating student_profiles:", updateErr);
        }

        // 2. Record quiz attempt with passed/failed and answered count in database
        try {
          const isValidUuid = materialId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materialId);
          await supabase.from("quiz_attempts").insert({
            student_id: userId,
            material_id: isValidUuid ? materialId : null,
            material_title: resolvedTitle,
            score: Math.max(0, Math.round(((questions.length - Math.min(questions.length, failedCount)) / questions.length) * 100)),
            passed: isFullyMastered,
            questions_answered: questions.length,
            questions_failed: failedCount,
            confidence_level: 5,
          });
        } catch (attemptErr) {
          console.warn("Failed recording quiz_attempts in db:", attemptErr);
        }

        // 3. Record in user_logs
        try {
          await supabase.from("user_logs").insert({
            user_id: userId,
            action_type: isFullyMastered ? "quiz_mastered" : "quiz_completed",
            details: `Quiz for "${resolvedTitle}" finished. Total: ${questions.length}, Failed attempts: ${failedCount}. Status: ${isFullyMastered ? "Mastered" : "Completed"}. Level: ${newLevel}.`,
          });
        } catch (logErr) {
          console.warn("Failed recording user log:", logErr);
        }

        if (onRewardClaimed) {
          onRewardClaimed(awardedXp, awardedTokens);
        }

        if (isFullyMastered) {
          toast.success(`Understanding Mastered! +${awardedXp} XP & +${awardedTokens} Daily Bonus Tokens recorded.`);
        } else {
          toast.info(`Quiz completed! +${awardedXp} XP recorded.`);
        }
      } else {
        const cat = getUnderstandingCategory(1);
        setNewUnderstanding(cat);
      }
    } catch (err) {
      console.warn("Error finalizing quiz rewards:", err);
    } finally {
      setSavingReward(false);
    }
  };

  const progressPercent = questions.length
    ? Math.round(((currentIndex + (answeredCorrectly ? 1 : 0)) / questions.length) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 overflow-hidden sm:rounded-2xl">
        {/* Minimal Header (No background, just title and subtitle) */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between">
          <div>
            <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
              Understanding Assessment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {resolvedTitle}
            </DialogDescription>
          </div>

          {!completed && !loading && questions.length > 0 && (
            <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              {currentIndex + 1} / {questions.length}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse border border-primary/20">
                <BrainCircuit className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Preparing Assessment Questions...
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Distilling core conceptual principles and real-world analogies from this material.
                </p>
              </div>
            </div>
          ) : completed ? (
            /* Mastery Completed Celebration Screen */
            <div className="py-6 text-center space-y-6">
              <div className="flex justify-center items-center space-x-6">
                <SvgBadge type="quiz_master" size={84} />
                {newUnderstanding && (
                  <SvgBadge type={newUnderstanding.badgeType} size={84} />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {failedCount === 0 ? "Concept Mastery Achieved!" : "Assessment Completed!"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {failedCount === 0
                    ? "You answered every question right on your first try! Your understanding rank and bonus tokens have been recorded."
                    : "Great effort applying core principles! Your practice attempt has been recorded in your study profile."}
                </p>
              </div>

              {/* Reward Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <Card className="p-3 bg-muted/40 border-border text-center rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Zap className="w-4 h-4 mr-1 stroke-[2.5]" />
                    <span className="text-[11px] font-semibold text-muted-foreground">XP Gained</span>
                  </div>
                  <div className="text-lg font-black text-foreground">+{failedCount === 0 ? 150 : 75} XP</div>
                </Card>

                <Card className="p-3 bg-muted/40 border-border text-center rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Award className="w-4 h-4 mr-1 stroke-[2.5]" />
                    <span className="text-[11px] font-semibold text-muted-foreground">Daily Tokens</span>
                  </div>
                  <div className="text-lg font-black text-foreground">+{failedCount === 0 ? 5 : 2} Free</div>
                </Card>

                <Card className="p-3 bg-muted/40 border-border text-center rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <CheckCircle2 className="w-4 h-4 mr-1 stroke-[2.5]" />
                    <span className="text-[11px] font-semibold text-muted-foreground">Rank</span>
                  </div>
                  <div className="text-xs font-bold text-foreground truncate">
                    {newUnderstanding?.level || "Scholar"}
                  </div>
                </Card>
              </div>

              <div className="pt-2">
                <Button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-2.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  Continue Learning
                </Button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Multiple Choice Question State */
            <div className="space-y-5">
              {/* Question Text */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Multiple Choice Options List */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let cardStyle =
                    "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30 cursor-pointer";

                  if (submitted) {
                    if (isSelected && isCorrect) {
                      cardStyle = "border-primary bg-primary/10 text-foreground ring-1 ring-primary/50";
                    } else if (isSelected && !isCorrect) {
                      cardStyle = "border-border bg-muted/40 text-muted-foreground";
                    } else if (answeredCorrectly && isCorrect) {
                      cardStyle = "border-primary bg-primary/10 text-foreground";
                    }
                  } else if (isSelected) {
                    cardStyle = "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40";
                  }

                  return (
                    <Card
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3 text-left ${cardStyle}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          submitted && isSelected && isCorrect
                            ? "bg-primary text-primary-foreground"
                            : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                        {option}
                      </div>
                      {submitted && isSelected && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Empowering Analogy Card (Shown when wrong answer is submitted) */}
              {submitted && !answeredCorrectly && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/80 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-primary">
                    <Lightbulb className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <h5 className="text-xs font-bold tracking-tight">
                      Empowering Angle & Analogy
                    </h5>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed pl-6 italic">
                    "{currentQ.empoweringAnalogyHint}"
                  </p>
                  <p className="text-[11px] text-muted-foreground pl-6 font-semibold">
                    Think about this analogy and select the choice above that best matches it!
                  </p>
                </div>
              )}

              {/* Correct Feedback Banner */}
              {submitted && answeredCorrectly && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-primary">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <h5 className="text-xs font-bold tracking-tight">Spot on! Pure Understanding</h5>
                  </div>
                  <p className="text-xs text-foreground/90 pl-6">
                    {currentQ.conceptExplanation}
                  </p>
                </div>
              )}

              {/* Footer Actions: Cancel and Submit / Next */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold px-4 py-2 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl"
                >
                  Cancel
                </Button>

                <div className="flex items-center space-x-2">
                  {answeredCorrectly ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="font-bold text-xs px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center space-x-1.5"
                    >
                      <span>
                        {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : submitted && !answeredCorrectly ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setSelectedOption(null);
                      }}
                      className="font-bold text-xs px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      Try Again
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={handleSubmitAnswer}
                      className="font-bold text-xs px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50"
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No questions found. Please try again.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
