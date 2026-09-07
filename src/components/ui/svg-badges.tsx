import React from "react";
import {
  Flame,
  Zap,
  Star,
  Crown,
  BookOpen,
  Compass,
  Award,
  ShieldCheck,
  Lock,
  BookmarkPlus,
  CheckCircle2,
} from "lucide-react";

export interface SvgBadgeProps {
  type: string;
  size?: number;
  className?: string;
  showTitle?: boolean;
  disabled?: boolean;
}

export interface PlatformBadgeMeta {
  id: string;
  title: string;
  description: string;
  badgeType: string;
  category: "streak" | "understanding" | "mastery";
  unlockCriteria: string;
}

export const ALL_PLATFORM_BADGES: PlatformBadgeMeta[] = [
  // ── Streak Milestones ──
  {
    id: "5_day_streak",
    title: "5-Day Streak",
    description: "Maintained a 5-day continuous micro-learning streak.",
    badgeType: "5_day_streak",
    category: "streak",
    unlockCriteria: "Study consistently for 5 consecutive calendar days (+10 Daily Bonus Tokens).",
  },
  {
    id: "10_day_streak",
    title: "10-Day Streak",
    description: "Double-digit daily study momentum and focus.",
    badgeType: "10_day_streak",
    category: "streak",
    unlockCriteria: "Reach 10 consecutive calendar days (+25 Daily Bonus Tokens).",
  },
  {
    id: "20_day_streak",
    title: "20-Day Streak",
    description: "Exceptional Socratic dedication and learning habit.",
    badgeType: "20_day_streak",
    category: "streak",
    unlockCriteria: "Reach 20 consecutive calendar days (+50 Daily Bonus Tokens).",
  },
  {
    id: "30_day_streak",
    title: "30-Day Legend",
    description: "Full monthly continuous learning mastery.",
    badgeType: "30_day_streak",
    category: "streak",
    unlockCriteria: "Reach 30 consecutive calendar days (+100 Daily Bonus Tokens).",
  },

  // ── Understanding Categories ──
  {
    id: "novice_explorer",
    title: "Novice Explorer",
    description: "Embarking on the conceptual discovery journey.",
    badgeType: "novice_explorer",
    category: "understanding",
    unlockCriteria: "Answer your first material understanding quiz.",
  },
  {
    id: "active_scholar",
    title: "Active Scholar",
    description: "Regularly tests understanding and achieves high quiz accuracy.",
    badgeType: "active_scholar",
    category: "understanding",
    unlockCriteria: "Master at least 3 material understanding quizzes.",
  },
  {
    id: "conceptual_master",
    title: "Conceptual Master",
    description: "Demonstrates deep mastery and retention of core principles.",
    badgeType: "conceptual_master",
    category: "understanding",
    unlockCriteria: "Master at least 6 material understanding quizzes.",
  },
  {
    id: "socratic_polymath",
    title: "Socratic Polymath",
    description: "Highest level of conceptual synthesis across subjects.",
    badgeType: "socratic_polymath",
    category: "understanding",
    unlockCriteria: "Master at least 10 material understanding quizzes.",
  },

  // ── Mastery & Investment ──
  {
    id: "quiz_master",
    title: "Concept Master",
    description: "Conquered an understanding assessment with 100% precision.",
    badgeType: "quiz_master",
    category: "mastery",
    unlockCriteria: "Complete any material quiz with all questions answered right.",
  },
  {
    id: "first_flashcard_mastery",
    title: "Flashcard Ace",
    description: "Completed a full deck mastery review sprint.",
    badgeType: "first_flashcard_mastery",
    category: "mastery",
    unlockCriteria: "Complete a full flashcard mastery review session.",
  },
  {
    id: "knowledge_investor",
    title: "Knowledge Vault",
    description: "Invested learning by saving key takeaways to study notes.",
    badgeType: "knowledge_investor",
    category: "mastery",
    unlockCriteria: "Save an AI tutor takeaway or riddle concept into study notes.",
  },
  {
    id: "quick_mind",
    title: "Quick Learner",
    description: "Completed a 1-tap micro-learning sprint.",
    badgeType: "quick_mind",
    category: "mastery",
    unlockCriteria: "Solve a daily brain teaser or complete a 1-tap quick launch sprint.",
  },
];

/**
 * High-fidelity vector SVG badges styled like traditional collegiate seals and academic crests
 * (inspired by authentic university heraldry: classical pillars, open books, graduation caps,
 * laurel wreaths, heraldic shields, and ribbons) in Black, White, and Orange.
 */
export function SvgBadge({
  type,
  size = 48,
  className = "",
  showTitle = false,
  disabled = false,
}: SvgBadgeProps) {
  const s = size;

  const renderBadgeIcon = () => {
    switch (type) {
      // ── 5-Day Streak: Collegiate Shield with Flame Torch & Ribbon ──
      case "5_day_streak":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Heraldic Shield */}
            <path d="M14 10 H58 V38 C58 52 36 63 36 63 C36 63 14 52 14 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M18 14 H54 V37 C54 48 36 57 36 57 C36 57 18 48 18 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Shield Header Bar */}
            <path d="M18 14 H54 V21 H18 Z" fill="#f97316" />
            <text x="36" y="19" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900" fontFamily="serif" letterSpacing="0.8">5 DAYS</text>
            {/* Laurel Leaves left & right */}
            <path d="M22 28 C20 32 20 38 23 42" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="21" cy="30" r="1.5" fill="#f97316" />
            <circle cx="21" cy="35" r="1.5" fill="#09090b" />
            <circle cx="22" cy="40" r="1.5" fill="#f97316" />
            <path d="M50 28 C52 32 52 38 49 42" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="51" cy="30" r="1.5" fill="#f97316" />
            <circle cx="51" cy="35" r="1.5" fill="#09090b" />
            <circle cx="50" cy="40" r="1.5" fill="#f97316" />
            {/* Central Flame Icon */}
            <g transform="translate(27, 24)">
              <Flame size={18} className="text-orange-500 fill-orange-500/50 stroke-[2.2]" />
            </g>
            {/* Bottom Ribbon Banner */}
            <path d="M8 52 L14 48 L14 56 Z" fill="#ea580c" />
            <path d="M64 52 L58 48 L58 56 Z" fill="#ea580c" />
            <rect x="12" y="47" width="48" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="54" textAnchor="middle" fill="#f97316" fontSize="5" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">STREAK</text>
          </svg>
        );

      // ── 10-Day Streak: Circular University Seal with Laurel Wreath & Lightning ──
      case "10_day_streak":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Serrated Outer Edge */}
            <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="36" cy="36" r="26" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Inner Ring */}
            <circle cx="36" cy="36" r="20" fill="#ffffff" stroke="#09090b" strokeWidth="1" />
            {/* Collegiate Stars */}
            <circle cx="21" cy="36" r="1.5" fill="#f97316" />
            <circle cx="51" cy="36" r="1.5" fill="#f97316" />
            <circle cx="36" cy="21" r="1.5" fill="#f97316" />
            {/* Center Lightning */}
            <g transform="translate(27, 26)">
              <Zap size={18} className="text-orange-500 fill-orange-500/50 stroke-[2.2]" />
            </g>
            {/* Curved Banner */}
            <path d="M16 48 L22 45 L22 53 Z" fill="#c2410c" />
            <path d="M56 48 L50 45 L50 53 Z" fill="#c2410c" />
            <rect x="18" y="44" width="36" height="9" rx="1.5" fill="#09090b" stroke="#ffffff" strokeWidth="1" />
            <text x="36" y="50.5" textAnchor="middle" fill="#ffffff" fontSize="4.8" fontWeight="900" fontFamily="serif" letterSpacing="0.8">10 DAYS</text>
          </svg>
        );

      // ── 20-Day Streak: University Star & Columns Emblem ──
      case "20_day_streak":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Classical Pediment & Shield */}
            <path d="M36 4 L60 16 V38 C60 52 36 64 36 64 C36 64 12 52 12 38 V16 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M36 8 L55 18 V37 C55 48 36 58 36 58 C36 58 17 48 17 37 V18 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Two Classical Columns */}
            <rect x="23" y="24" width="5" height="18" fill="#09090b" rx="1" />
            <rect x="44" y="24" width="5" height="18" fill="#09090b" rx="1" />
            {/* Architrave */}
            <rect x="20" y="21" width="32" height="3" fill="#f97316" rx="0.5" />
            {/* Base Plinth */}
            <rect x="20" y="42" width="32" height="3" fill="#f97316" rx="0.5" />
            {/* Star in Center */}
            <g transform="translate(28, 26)">
              <Star size={16} className="text-orange-500 fill-orange-500 stroke-[2]" />
            </g>
            {/* Banner */}
            <rect x="14" y="48" width="44" height="9" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="54.5" textAnchor="middle" fill="#f97316" fontSize="4.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">20 DAYS</text>
          </svg>
        );

      // ── 30-Day Streak: Royal University Crown & Double Wreath Crest ──
      case "30_day_streak":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Crown Atop Crest */}
            <path d="M26 12 L30 6 L36 10 L42 6 L46 12 H26 Z" fill="#f97316" stroke="#09090b" strokeWidth="1" />
            <circle cx="30" cy="5" r="1.5" fill="#09090b" />
            <circle cx="36" cy="9" r="1.5" fill="#09090b" />
            <circle cx="42" cy="5" r="1.5" fill="#09090b" />
            {/* Shield Body */}
            <path d="M16 14 H56 V38 C56 52 36 63 36 63 C36 63 16 52 16 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M20 18 H52 V37 C52 48 36 57 36 57 C36 57 20 48 20 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Center Monogram U */}
            <circle cx="36" cy="33" r="11" fill="#ffffff" stroke="#09090b" strokeWidth="1" />
            <text x="36" y="38" textAnchor="middle" fill="#ea580c" fontSize="14" fontWeight="900" fontFamily="serif">U</text>
            {/* Banner */}
            <rect x="10" y="47" width="52" height="10" rx="2" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
            <text x="36" y="54" textAnchor="middle" fill="#ffffff" fontSize="4.8" fontWeight="900" fontFamily="serif" letterSpacing="1">LEGEND 30</text>
          </svg>
        );

      // ── Novice Explorer: Classical University Column & Pediment Crest ──
      case "Novice Explorer":
      case "novice_explorer":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Heraldic Shield */}
            <path d="M14 8 H58 V38 C58 52 36 63 36 63 C36 63 14 52 14 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M18 12 H54 V37 C54 48 36 57 36 57 C36 57 18 48 18 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Classical Pediment (Triangle Roof) */}
            <path d="M24 22 L36 15 L48 22 Z" fill="#f97316" stroke="#09090b" strokeWidth="1" />
            <rect x="23" y="22" width="26" height="2" fill="#09090b" />
            {/* 3 Classical Columns */}
            <rect x="26" y="24" width="3.5" height="14" fill="#09090b" />
            <rect x="34.25" y="24" width="3.5" height="14" fill="#09090b" />
            <rect x="42.5" y="24" width="3.5" height="14" fill="#09090b" />
            {/* Column Base Plinth */}
            <rect x="23" y="38" width="26" height="3" fill="#f97316" rx="0.5" />
            {/* Banner Across Bottom */}
            <rect x="12" y="47" width="48" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="54" textAnchor="middle" fill="#f97316" fontSize="4.6" fontWeight="900" fontFamily="serif" letterSpacing="0.8">EXPLORER</text>
          </svg>
        );

      // ── Active Scholar: Circular University Seal with Open Book & Laurel Wreath ──
      case "Active Scholar":
      case "active_scholar":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Circular Seal */}
            <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="36" cy="36" r="26" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Laurel Wreath hugging the sides */}
            <path d="M19 28 C16 34 16 42 21 47" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M53 28 C56 34 56 42 51 47" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="31" r="1.5" fill="#f97316" />
            <circle cx="17" cy="37" r="1.5" fill="#09090b" />
            <circle cx="19" cy="43" r="1.5" fill="#f97316" />
            <circle cx="54" cy="31" r="1.5" fill="#f97316" />
            <circle cx="55" cy="37" r="1.5" fill="#09090b" />
            <circle cx="53" cy="43" r="1.5" fill="#f97316" />
            {/* Open Book Vector */}
            <g transform="translate(23, 23)">
              <BookOpen size={26} className="text-zinc-900 fill-orange-500/10 stroke-[2]" />
            </g>
            {/* Banner Across Bottom */}
            <path d="M8 54 L14 50 L14 58 Z" fill="#c2410c" />
            <path d="M64 54 L58 50 L58 58 Z" fill="#c2410c" />
            <rect x="12" y="49" width="48" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="56" textAnchor="middle" fill="#f97316" fontSize="5" fontWeight="900" fontFamily="serif" letterSpacing="0.8">SCHOLAR</text>
          </svg>
        );

      // ── Conceptual Master: Collegiate Mortarboard Cap & Open Book Crest ──
      case "Conceptual Master":
      case "conceptual_master":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Shield with Notched Top */}
            <path d="M12 12 L36 6 L60 12 V38 C60 52 36 64 36 64 C36 64 12 52 12 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M16 15 L36 10 L56 15 V37 C56 48 36 58 36 58 C36 58 16 48 16 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Mortarboard Cap (Graduation Hat) */}
            <path d="M36 18 L50 23 L36 28 L22 23 Z" fill="#09090b" stroke="#09090b" strokeWidth="1.5" />
            <path d="M29 26 V31 C29 33 43 33 43 31 V26" fill="#09090b" stroke="#f97316" strokeWidth="1.2" />
            {/* Tassel */}
            <path d="M47 24 C49 28 50 31 50 34" stroke="#f97316" strokeWidth="1.2" />
            <circle cx="50" cy="35" r="1" fill="#ea580c" />
            {/* Open Ledger Lines */}
            <path d="M26 36 H34" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M26 39 H34" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M38 36 H46" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M38 39 H46" stroke="#09090b" strokeWidth="1.2" strokeLinecap="round" />
            {/* Banner */}
            <rect x="12" y="47" width="48" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="54" textAnchor="middle" fill="#f97316" fontSize="4.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">MASTER</text>
          </svg>
        );

      // ── Socratic Polymath: Supreme University Crest with Globe & Crown ──
      case "Socratic Polymath":
      case "socratic_polymath":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Crown Top */}
            <path d="M28 8 L31 4 L36 7 L41 4 L44 8 H28 Z" fill="#f97316" stroke="#09090b" strokeWidth="1" />
            {/* Grand Crest Body */}
            <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="36" cy="36" r="25" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Academic Globe Grid */}
            <circle cx="36" cy="33" r="12" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            <ellipse cx="36" cy="33" rx="6" ry="12" stroke="#09090b" strokeWidth="1" fill="none" />
            <line x1="24" y1="33" x2="48" y2="33" stroke="#09090b" strokeWidth="1" />
            {/* Ribbon */}
            <path d="M6 55 L13 50 L13 60 Z" fill="#ea580c" />
            <path d="M66 55 L59 50 L59 60 Z" fill="#ea580c" />
            <rect x="11" y="50" width="50" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
            <text x="36" y="57" textAnchor="middle" fill="#f97316" fontSize="4.6" fontWeight="900" fontFamily="serif" letterSpacing="0.8">POLYMATH</text>
          </svg>
        );

      // ── Concept Master (100% Quiz): Graduation Honors Crest ──
      case "quiz_master":
      case "Concept Master":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 8 H58 V38 C58 52 36 63 36 63 C36 63 14 52 14 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M18 12 H54 V37 C54 48 36 57 36 57 C36 57 18 48 18 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            {/* Checkmark Ribbon Crest */}
            <circle cx="36" cy="28" r="11" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
            <path d="M31 28 L34.5 31.5 L41.5 24.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Honors Ribbon */}
            <rect x="12" y="47" width="48" height="10" rx="2" fill="#ea580c" stroke="#09090b" strokeWidth="1.2" />
            <text x="36" y="54" textAnchor="middle" fill="#ffffff" fontSize="4.8" fontWeight="900" fontFamily="serif" letterSpacing="0.8">HONORS 100%</text>
          </svg>
        );

      // ── Flashcard Ace: Open Ledger with Quill ──
      case "first_flashcard_mastery":
      case "Flashcard Ace":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="36" cy="36" r="26" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="36" cy="36" r="19" fill="#09090b" stroke="#ffffff" strokeWidth="1" />
            <g transform="translate(26, 26)">
              <Award size={20} className="text-orange-400 stroke-[2.2]" />
            </g>
            <rect x="14" y="48" width="44" height="9" rx="1.5" fill="#09090b" stroke="#ffffff" strokeWidth="1" />
            <text x="36" y="54.5" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900" fontFamily="serif" letterSpacing="0.8">FLASHCARDS</text>
          </svg>
        );

      // ── Knowledge Vault: Classical Library Facade ──
      case "knowledge_investor":
      case "Knowledge Vault":
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10 H60 V38 C60 52 36 63 36 63 C36 63 12 52 12 38 Z" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M16 14 H56 V37 C56 48 36 57 36 57 C36 57 16 48 16 37 Z" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            <g transform="translate(26, 23)">
              <ShieldCheck size={20} className="text-orange-500 stroke-[2.2]" />
            </g>
            <rect x="12" y="47" width="48" height="10" rx="2" fill="#09090b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="36" y="54" textAnchor="middle" fill="#f97316" fontSize="4.8" fontWeight="900" fontFamily="serif" letterSpacing="0.8">NOTE VAULT</text>
          </svg>
        );

      // ── Quick Learner / Default: University Sprint Emblem ──
      case "quick_mind":
      case "Quick Learner":
      default:
        return (
          <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="32" fill="#ffffff" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="36" cy="36" r="25" fill="#ffffff" stroke="#f97316" strokeWidth="1.5" />
            <circle cx="36" cy="36" r="18" fill="#09090b" stroke="#f97316" strokeWidth="1.5" />
            <g transform="translate(27, 26)">
              <Zap size={18} className="text-orange-400 fill-orange-500/40 stroke-[2.2]" />
            </g>
            <rect x="16" y="48" width="40" height="9" rx="1.5" fill="#ea580c" stroke="#09090b" strokeWidth="1" />
            <text x="36" y="54.5" textAnchor="middle" fill="#ffffff" fontSize="4.6" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">SPRINT</text>
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center transition-all ${
        disabled ? "opacity-35 grayscale" : ""
      } ${className}`}
    >
      {renderBadgeIcon()}

      {/* Lock overlay when badge is disabled/unearned */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-black/85 border border-white/40 flex items-center justify-center shadow-lg">
            <Lock size={12} className="text-white stroke-[2.5]" />
          </div>
        </div>
      )}

      {showTitle && (
        <span className="mt-1.5 text-[10px] font-bold text-foreground text-center tracking-tight capitalize max-w-[80px] truncate">
          {type.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
}

/**
 * Computes student understanding category based on quiz mastery count.
 */
export function getUnderstandingCategory(quizzesMasteredCount: number): {
  level: string;
  badgeType: string;
  description: string;
  nextThreshold: number;
} {
  if (quizzesMasteredCount >= 10) {
    return {
      level: "Socratic Polymath",
      badgeType: "socratic_polymath",
      description: "Highest level of conceptual synthesis across subjects.",
      nextThreshold: 10,
    };
  }
  if (quizzesMasteredCount >= 6) {
    return {
      level: "Conceptual Master",
      badgeType: "conceptual_master",
      description: "Demonstrates deep mastery and retention of core principles.",
      nextThreshold: 10,
    };
  }
  if (quizzesMasteredCount >= 3) {
    return {
      level: "Active Scholar",
      badgeType: "active_scholar",
      description: "Regularly tests understanding and achieves high quiz accuracy.",
      nextThreshold: 6,
    };
  }
  return {
    level: "Novice Explorer",
    badgeType: "novice_explorer",
    description: "Beginning the conceptual discovery journey.",
    nextThreshold: 3,
  };
}

export function getBadgeTypeFromName(name: string): string {
  if (!name) return "novice_explorer";
  const clean = name.toLowerCase().trim().replace(/-/g, "_").replace(/\s+/g, "_");
  const found = ALL_PLATFORM_BADGES.find(
    (b) => b.title.toLowerCase() === name.toLowerCase() || b.id === clean || b.badgeType === clean
  );
  if (found) return found.badgeType;
  if (clean.includes("streak")) {
    if (clean.includes("5")) return "5_day_streak";
    if (clean.includes("10")) return "10_day_streak";
    if (clean.includes("20")) return "20_day_streak";
    if (clean.includes("30")) return "30_day_streak";
    return "5_day_streak";
  }
  if (clean.includes("novice") || clean.includes("explorer")) return "novice_explorer";
  if (clean.includes("active") || clean.includes("scholar")) return "active_scholar";
  if (clean.includes("conceptual") || clean.includes("specialist")) return "conceptual_master";
  if (clean.includes("polymath") || clean.includes("socratic")) return "socratic_polymath";
  if (clean.includes("quiz") || clean.includes("concept")) return "quiz_master";
  if (clean.includes("flashcard") || clean.includes("ace")) return "first_flashcard_mastery";
  if (clean.includes("vault") || clean.includes("investor") || clean.includes("knowledge")) return "knowledge_investor";
  if (clean.includes("quick") || clean.includes("mind") || clean.includes("learner")) return "quick_mind";
  return "novice_explorer";
}

export function computeUnlockedBadges(params: {
  streak: number;
  quizzesCompleted?: number;
  quizzesMastered?: number;
  storedBadgeIds?: string[];
}): PlatformBadgeMeta[] {
  const ids = new Set<string>(params.storedBadgeIds || []);

  // 1. Guaranteed minimum default starter badge
  ids.add("novice_explorer");

  // 2. Streaks
  const s = Number(params.streak || 0);
  if (s >= 5) ids.add("5_day_streak");
  if (s >= 10) ids.add("10_day_streak");
  if (s >= 20) ids.add("20_day_streak");
  if (s >= 30) ids.add("30_day_streak");

  // 3. Quiz mastery
  const m = Number(params.quizzesMastered || 0);
  if (m >= 1) ids.add("quiz_master");
  if (m >= 3) ids.add("active_scholar");
  if (m >= 6) ids.add("conceptual_master");
  if (m >= 10) ids.add("socratic_polymath");

  // Return strictly matching platform badges from ALL_PLATFORM_BADGES (out of 12)
  return ALL_PLATFORM_BADGES.filter((b) => ids.has(b.id));
}
