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
  AlertCircle,
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
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnalogy, setShowAnalogy] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [savingReward, setSavingReward] = useState(false);
  const [newUnderstanding, setNewUnderstanding] = useState<{
    level: string;
    badgeType: string;
    description: string;
    nextThreshold: number;
  } | null>(null);

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
    setEmptyNotice(null);
  }

  // Load real quiz from Supabase or generate and persist authentic quiz
  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    async function loadOrGenerateQuiz() {
      setLoading(true);
      resetState();

      try {
        const isValidUuid =
          materialId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materialId);

        // 1. Check if a real quiz already exists in the database
        if (isValidUuid) {
          // Check materials.quiz_id
          const { data: matData } = await supabase
            .from("materials")
            .select("id, title, content, quiz_id")
            .eq("id", materialId)
            .maybeSingle();

          if (matData?.quiz_id) {
            const { data: existingQuiz } = await supabase
              .from("quizzes")
              .select("*")
              .eq("id", matData.quiz_id)
              .maybeSingle();

            if (
              existingQuiz?.questions &&
              Array.isArray(existingQuiz.questions) &&
              existingQuiz.questions.length > 0
            ) {
              setQuestions(existingQuiz.questions as QuizQuestion[]);
              setActiveQuizId(existingQuiz.id);
              setLoading(false);
              return;
            }
          }

          // Check if quizzes table has material_id linked
          const { data: existingQuizByMat } = await supabase
            .from("quizzes")
            .select("*")
            .eq("material_id", materialId)
            .maybeSingle();

          if (
            existingQuizByMat?.questions &&
            Array.isArray(existingQuizByMat.questions) &&
            existingQuizByMat.questions.length > 0
          ) {
            setQuestions(existingQuizByMat.questions as QuizQuestion[]);
            setActiveQuizId(existingQuizByMat.id);
            // Re-link material if needed
            if (!matData?.quiz_id) {
              await supabase
                .from("materials")
                .update({ quiz_id: existingQuizByMat.id })
                .eq("id", materialId);
            }
            setLoading(false);
            return;
          }
        }

        // 2. If no existing quiz, check if material content is sufficient for authentic generation
        const textSample = (resolvedContent || resolvedTitle).slice(0, 3500).trim();
        if (textSample.length < 30) {
          setEmptyNotice(
            "This study material does not have sufficient content yet to author an authentic conceptual assessment. Upload notes or add lesson content to generate a real quiz."
          );
          setLoading(false);
          return;
        }

        // 3. Generate grounded assessment with Gemini
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
                      "A vivid, empowering, relatable real-world analogy that explains the concept intuitively without making the student feel dumb.",
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
            "You are an empowering, world-class Socratic educator. Author high-quality multiple choice questions based strictly on the provided educational material. For every question, write an empoweringAnalogyHint that uses relatable, vivid everyday analogies (e.g. game mechanics, recipes, construction blueprints). Never invent facts not grounded in the topic.",
          prompt: `Create 3 multiple choice questions that test conceptual understanding of this material:\n\nTitle: ${resolvedTitle}\nContent:\n${textSample}`,
          responseSchema: schema,
          temperature: 0.3,
        });

        const generatedQuestions = result.data?.questions || [];
        if (generatedQuestions.length === 0) {
          setEmptyNotice("Could not author questions from this material. Please try again.");
          setLoading(false);
          return;
        }

        // 4. Save authentic quiz into Supabase public.quizzes table
        const { data: authUser } = await supabase.auth.getUser();
        const currentUserId = authUser?.user?.id;

        if (currentUserId) {
          const { data: newQuiz, error: insertErr } = await supabase
            .from("quizzes")
            .insert({
              title: `Quiz for ${resolvedTitle}`,
              teacher_id: currentUserId,
              material_id: isValidUuid ? materialId : null,
              questions: generatedQuestions,
            })
            .select("*")
            .maybeSingle();

          if (newQuiz) {
            setActiveQuizId(newQuiz.id);
            if (isValidUuid) {
              await supabase
                .from("materials")
                .update({ quiz_id: newQuiz.id })
                .eq("id", materialId);
            }
          }
        }

        setQuestions(generatedQuestions);
      } catch (err) {
        console.warn("Error loading or generating authentic quiz:", err);
        setEmptyNotice("Failed to author a quiz for this material. Please check connection.");
      } finally {
        setLoading(false);
      }
    }

    loadOrGenerateQuiz();
  }, [isOpen, resolvedTitle, resolvedContent, materialId]);

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
      await handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    setCompleted(true);
    setSavingReward(true);

    try {
      triggerCelebration({ particleCount: 90 });
      unlockBadge("quiz_master");

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (userId) {
        const isFullyMastered = failedCount === 0;
        const awardedXp = isFullyMastered ? 150 : 75;
        const awardedTokens = isFullyMastered ? 5 : 2;
        const isValidUuid =
          materialId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materialId);

        const scorePercent = Math.max(
          0,
          Math.round(
            ((questions.length - Math.min(questions.length, failedCount)) / questions.length) * 100
          )
        );

        // 1. Insert authentic attempt into public.quiz_attempts linked with quiz_id
        try {
          await supabase.from("quiz_attempts").insert({
            quiz_id: activeQuizId,
            student_id: userId,
            material_id: isValidUuid ? materialId : null,
            material_title: resolvedTitle,
            score: scorePercent,
            passed: isFullyMastered,
            questions_answered: questions.length,
            questions_failed: failedCount,
            confidence_level: 5,
          });
        } catch (attemptErr) {
          console.warn("Failed recording authentic quiz attempt:", attemptErr);
        }

        // 2. Query real database counts for completed & mastered quizzes
        const [
          { count: realCompletedCount },
          { count: realMasteredCount },
          { data: currentProfile },
        ] = await Promise.all([
          supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("student_id", userId),
          supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("student_id", userId)
            .gte("score", 80),
          supabase
            .from("student_profiles")
            .select("daily_bonus_tokens, xp")
            .eq("student_id", userId)
            .maybeSingle(),
        ]);

        const totalCompleted = realCompletedCount || 1;
        const totalMastered = realMasteredCount || (isFullyMastered ? 1 : 0);
        const categoryInfo = getUnderstandingCategory(totalMastered);
        setNewUnderstanding(categoryInfo);

        const currentBonusTokens = Number(currentProfile?.daily_bonus_tokens || 0);
        const currentXp = Number(currentProfile?.xp || 0);

        // 3. Update student profile with real database stats
        try {
          await supabase
            .from("student_profiles")
            .update({
              quizzes_mastered: totalMastered,
              quizzes_answered: totalCompleted,
              understanding_level: categoryInfo.level,
              daily_bonus_tokens: currentBonusTokens + awardedTokens,
              xp: currentXp + awardedXp,
              updated_at: new Date().toISOString(),
            })
            .eq("student_id", userId);
        } catch (updateErr) {
          console.warn("Failed updating student profile with real quiz stats:", updateErr);
        }

        // 4. Log in user audit logs
        try {
          await supabase.from("user_logs").insert({
            user_id: userId,
            action_type: isFullyMastered ? "quiz_mastered" : "quiz_completed",
            details: `Quiz for "${resolvedTitle}" completed with score ${scorePercent}%. Mastered: ${isFullyMastered}. Real level: ${categoryInfo.level}.`,
          });
        } catch (logErr) {
          console.warn("Failed recording user log:", logErr);
        }

        if (onRewardClaimed) {
          onRewardClaimed(awardedXp, awardedTokens);
        }

        if (isFullyMastered) {
          toast.success(
            `Understanding Mastered! +${awardedXp} XP & +${awardedTokens} Daily Bonus Tokens recorded.`
          );
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
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between">
          <div>
            <DialogTitle className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
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
                  Loading Assessment Questions...
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Fetching authentic conceptual assessment from course materials.
                </p>
              </div>
            </div>
          ) : emptyNotice ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Authentic Quiz Unavailable
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {emptyNotice}
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : completed ? (
            /* Mastery Celebration Screen */
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
                    ? "You answered every question right on your first try! Your understanding rank and bonus tokens have been recorded in the database."
                    : "Great effort applying core principles! Your authentic quiz attempt has been recorded in your study profile."}
                </p>
              </div>

              {/* Reward Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <Card className="p-3 bg-muted/40 border-border text-center rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Zap className="w-4 h-4 mr-1 stroke-[2.5]" />
                    <span className="text-[11px] font-semibold text-muted-foreground">XP Gained</span>
                  </div>
                  <div className="text-lg font-black text-foreground">
                    +{failedCount === 0 ? 150 : 75} XP
                  </div>
                </Card>

                <Card className="p-3 bg-muted/40 border-border text-center rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Award className="w-4 h-4 mr-1 stroke-[2.5]" />
                    <span className="text-[11px] font-semibold text-muted-foreground">Daily Tokens</span>
                  </div>
                  <div className="text-lg font-black text-foreground">
                    +{failedCount === 0 ? 5 : 2} Free
                  </div>
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
                  className="font-bold px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-xs"
                >
                  Return to Learning
                </Button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Screen */
            <div className="space-y-6">
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Question text */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Question {currentIndex + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = currentQ.correctIndex === idx;

                  let borderStyle = "border-border hover:border-border/80 bg-background";
                  let textStyle = "text-foreground";

                  if (submitted) {
                    if (isCorrect) {
                      borderStyle = "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20";
                      textStyle = "text-emerald-700 dark:text-emerald-300 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      borderStyle = "border-rose-500 bg-rose-500/10 dark:bg-rose-950/20";
                      textStyle = "text-rose-700 dark:text-rose-300";
                    }
                  } else if (isSelected) {
                    borderStyle = "border-primary bg-primary/10 shadow-xs";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitted && answeredCorrectly}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${borderStyle}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-muted-foreground border-border"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-xs sm:text-sm leading-relaxed ${textStyle}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Socratic Hint / Analogy */}
              {showAnalogy && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Lightbulb className="w-4 h-4" />
                    <span>Intuitive Mental Model Hint</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed italic">
                    "{currentQ.empoweringAnalogyHint}"
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium pt-1">
                    Try choosing the answer that best captures this relationship.
                  </p>
                </div>
              )}

              {/* Correct Feedback Explanation */}
              {answeredCorrectly && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Core Principle Understood!</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {currentQ.conceptExplanation}
                  </p>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
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
              No questions found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
