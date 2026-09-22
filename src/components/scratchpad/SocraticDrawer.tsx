import React, { useState } from "react";
import {
  X,
  BrainCircuit,
  Award,
  BookOpen,
  HelpCircle,
  AlertCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { SocraticStudyGuide } from "@/types/scratchpad";
import { MarkdownRenderer } from "@/components/markdown";
import { convertStudyGuideToNote } from "@/lib/scratchpad-ai";
import { useNavigate } from "@tanstack/react-router";

interface SocraticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studyGuide: SocraticStudyGuide | null;
  thumbnailUrl?: string;
  scratchpadId?: string;
  existingNoteId?: string;
}

export function SocraticDrawer({
  isOpen,
  onClose,
  studyGuide,
  thumbnailUrl,
  scratchpadId,
  existingNoteId,
}: SocraticDrawerProps) {
  const navigate = useNavigate();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [copiedFormulaIdx, setCopiedFormulaIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(existingNoteId || null);

  if (!isOpen || !studyGuide) return null;

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyFormula = (latex: string, idx: number) => {
    navigator.clipboard.writeText(latex);
    setCopiedFormulaIdx(idx);
    setTimeout(() => setCopiedFormulaIdx(null), 2000);
  };

  const handleSaveToNotes = async () => {
    setIsSaving(true);
    try {
      const res = await convertStudyGuideToNote({
        studyGuide,
        subject: studyGuide.detectedSubject,
        thumbnailUrl,
        scratchpadId,
        existingNoteId: savedNoteId || existingNoteId,
      });
      setSavedNoteId(res.noteId);
    } catch (err) {
      console.error("[SocraticDrawer] Error saving note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-card text-card-foreground shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-xs">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              Socratic Study Guide
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                AI Vision Synthesis
              </span>
              {studyGuide.detectedSubject && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-foreground border border-border">
                  {studyGuide.detectedSubject}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Rewarding Praise Banner */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Mastery Growth
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                +{studyGuide.xpEarned} XP
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
              {studyGuide.rewardMessage}
            </p>
          </div>
        </div>

        {/* Title & Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {studyGuide.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {studyGuide.summary}
          </p>
        </div>

        {/* Identified Mathematical Formulas (KaTeX OCR) */}
        {studyGuide.identifiedFormulas && studyGuide.identifiedFormulas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Recognized Formulas & Expressions</span>
            </div>
            <div className="space-y-2.5">
              {studyGuide.identifiedFormulas.map((f, idx) => (
                <div
                  key={idx}
                  className="group relative p-3.5 rounded-xl bg-elevated border border-border transition-all"
                >
                  <button
                    type="button"
                    onClick={() => copyFormula(f.latex, idx)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy LaTeX formula"
                  >
                    {copiedFormulaIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="pr-6">
                    <MarkdownRenderer content={`$$\n${f.latex}\n$$`} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Concepts & Analogies */}
        {studyGuide.keyConcepts && studyGuide.keyConcepts.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Core Principles & Intuition
            </div>
            <div className="space-y-3">
              {studyGuide.keyConcepts.map((kc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-elevated border border-border space-y-1.5 shadow-xs"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    {kc.concept}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {kc.explanation}
                  </p>
                  <div className="mt-2 p-2.5 rounded-lg bg-muted text-foreground border border-border/80 text-xs">
                    <span className="font-bold">💡 Intuition: </span>
                    <span>{kc.realWorldAnalogy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constructive Observations / Error Reflection */}
        {studyGuide.errorCheckOrRefinements && studyGuide.errorCheckOrRefinements.length > 0 && (
          <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span>Socratic Observations & Checks</span>
            </div>
            <ul className="space-y-1.5">
              {studyGuide.errorCheckOrRefinements.map((obs, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guided Socratic Discovery Questions */}
        {studyGuide.socraticQuestions && studyGuide.socraticQuestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Guided Socratic Discovery</span>
            </div>
            <div className="space-y-2.5">
              {studyGuide.socraticQuestions.map((sq, idx) => {
                const isExpanded = !!expandedQuestions[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-elevated overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestion(idx)}
                      className="w-full text-left p-3 sm:p-3.5 flex items-start justify-between gap-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-bold text-primary mt-0.5">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {sq.question}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-border bg-muted/30 text-xs">
                        <div className="p-2.5 rounded-lg bg-card text-foreground border border-border">
                          <span className="font-bold text-primary">Hint: </span>
                          <span>{sq.hint}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-card text-foreground border border-border">
                          <span className="font-bold text-primary">Deep Dive: </span>
                          <span>{sq.deeperThinking}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-card/90 backdrop-blur-md flex items-center justify-between gap-3">
        {savedNoteId ? (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveToNotes}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Note...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Linked Digital Note</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/app/notes" })}
              className="p-2.5 rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
              title="View in Notes"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToNotes}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Notes...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Save to PureLearn Digital Notes</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
