import { supabase } from "./supabase";

export interface StreakMilestoneReward {
  days: number;
  badgeId: string;
  badgeTitle: string;
  bonusTokens: number;
  bonusXp: number;
  description: string;
}

export const STREAK_MILESTONES: Record<number, StreakMilestoneReward> = {
  5: {
    days: 5,
    badgeId: "5_day_streak",
    badgeTitle: "5-Day Consistent Scholar",
    bonusTokens: 10,
    bonusXp: 100,
    description: "5 consecutive days of learning! Unlocked 10 bonus tokens.",
  },
  10: {
    days: 10,
    badgeId: "10_day_streak",
    badgeTitle: "10-Day Deep Focus",
    bonusTokens: 25,
    bonusXp: 250,
    description: "10 consecutive days of mastery! Unlocked 25 bonus tokens.",
  },
  20: {
    days: 20,
    badgeId: "20_day_streak",
    badgeTitle: "20-Day Socratic Devotee",
    bonusTokens: 50,
    bonusXp: 500,
    description: "20 consecutive days! Unlocked 50 bonus tokens.",
  },
  30: {
    days: 30,
    badgeId: "30_day_streak",
    badgeTitle: "30-Day PureLearn Legend",
    bonusTokens: 100,
    bonusXp: 1000,
    description: "30 consecutive days of dedication! Unlocked 100 bonus tokens.",
  },
};

/**
 * Computes calendar day difference using UTC midnight to eliminate all daylight saving and timezone anomalies.
 */
export function getCalendarDayDifference(earlierDateStr: string, laterDateStr: string): number {
  const d1 = new Date(earlierDateStr);
  const d2 = new Date(laterDateStr);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export interface StreakCalculationResult {
  streak: number;
  isNewDay: boolean;
  isConsecutive: boolean;
  todayDateStr: string;
  milestoneReward: StreakMilestoneReward | null;
}

/**
 * Calculates accurate streak progression based on the student's previous active date.
 */
export function calculateDailyStreak(
  lastActiveDateStr: string | null,
  currentStreak: number,
  awardedMilestones: number[] = []
): StreakCalculationResult {
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (!lastActiveDateStr) {
    return {
      streak: Math.max(1, currentStreak || 1),
      isNewDay: true,
      isConsecutive: true,
      todayDateStr,
      milestoneReward: null,
    };
  }

  const diffDays = getCalendarDayDifference(lastActiveDateStr, todayDateStr);

  if (diffDays === 0) {
    // Already checked in today
    return {
      streak: Math.max(1, currentStreak),
      isNewDay: false,
      isConsecutive: true,
      todayDateStr,
      milestoneReward: null,
    };
  }

  let newStreak = 1;
  let isConsecutive = false;

  if (diffDays === 1) {
    // Exactly yesterday - consecutive streak maintained!
    newStreak = (currentStreak || 0) + 1;
    isConsecutive = true;
  } else {
    // Missed at least one calendar day - reset to 1
    newStreak = 1;
    isConsecutive = false;
  }

  // Check if this new streak hits any unawarded milestone
  let milestoneReward: StreakMilestoneReward | null = null;
  if (STREAK_MILESTONES[newStreak] && !awardedMilestones.includes(newStreak)) {
    milestoneReward = STREAK_MILESTONES[newStreak];
  }

  return {
    streak: newStreak,
    isNewDay: true,
    isConsecutive,
    todayDateStr,
    milestoneReward,
  };
}

/**
 * Synchronizes the verified streak and awards milestone tokens to the Supabase database.
 */
export async function syncStreakWithDatabase(
  userId: string,
  result: StreakCalculationResult
) {
  try {
    // 1. Update student_profiles with the new streak & last_active_date
    const payload: Record<string, any> = {
      streak: result.streak,
      last_active_date: result.todayDateStr,
    };

    if (result.milestoneReward) {
      payload.daily_bonus_tokens = result.milestoneReward.bonusTokens;
    }

    const { error } = await supabase
      .from("student_profiles")
      .update(payload)
      .eq("student_id", userId);

    if (error) {
      // Fallback update without newly added columns in case migration is pending
      await supabase
        .from("student_profiles")
        .update({ streak: result.streak })
        .eq("student_id", userId);
    }

    // 2. If a milestone was awarded, log to user_logs for transparency
    if (result.milestoneReward) {
      await supabase.from("user_logs").insert({
        user_id: userId,
        action_type: "streak_milestone_rewarded",
        details: `Reached ${result.milestoneReward.days}-day streak! Rewarded ${result.milestoneReward.bonusTokens} free daily tokens and ${result.milestoneReward.bonusXp} XP (${result.milestoneReward.badgeTitle}).`,
      });
    }
  } catch (err) {
    console.warn("Database streak sync error:", err);
  }
}
