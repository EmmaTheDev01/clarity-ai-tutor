import { supabase } from "./supabase";

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionTierConfig {
  id: "free" | "pro" | "educator";
  name: string;
  tagline: string;
  badge?: string;
  priceDisplay: string;
  basePrice: number;
  period: string;
  features: PlanFeature[];
  teacherFeatures?: PlanFeature[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTierConfig> = {
  free: {
    id: "free",
    name: "Free Tier",
    tagline: "Ideal for test-driving Socratic tutoring & essential tools.",
    priceDisplay: "$0",
    basePrice: 0,
    period: "lifetime",
    features: [
      { name: "5 AI Socratic Prompts / month (Future limit)", included: true },
      { name: "3 Active Library Documents", included: true },
      { name: "ADHD Focus & Dyslexia tools", included: true },
      { name: "Core Evaluation Quizzes", included: true },
      { name: "LaTeX Formula Rendering", included: false },
      { name: "AI Image OCR Extraction", included: false },
      { name: "Double Streak Multipliers", included: false },
    ],
    teacherFeatures: [
      { name: "Personal workspace only", included: true },
      { name: "Classroom Hub creation", included: false },
      { name: "Socratic Sandbox tuning", included: false },
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Learner",
    tagline: "Unrestricted AI tutoring for ambitious students and power learners.",
    badge: "Recommended",
    priceDisplay: "$15",
    basePrice: 15,
    period: "/ month",
    features: [
      { name: "Unlimited AI Socratic Prompts", included: true, highlight: true },
      { name: "Unlimited Documents & Note sets", included: true },
      { name: "LaTeX Mathematical Formula rendering", included: true },
      { name: "AI Image OCR & Diagram Extraction", included: true },
      { name: "Double Streak & XP Multipliers", included: true },
      { name: "Priority AI Response Latency", included: true },
    ],
    teacherFeatures: [
      { name: "Personal workspace unlimited prompts", included: true },
      { name: "1 Interactive Demo Classroom", included: true },
      { name: "Classroom struggle telemetry", included: false },
    ],
  },
  educator: {
    id: "educator",
    name: "Educator / Custom",
    tagline: "Dedicated classroom hubs, custom seats & verified educator tools.",
    badge: "For Teachers & Schools",
    priceDisplay: "$9 base + seats",
    basePrice: 9,
    period: "/ month",
    features: [
      { name: "Everything in Pro Learner", included: true },
      { name: "Classroom Socratic Sandbox prompt tuning", included: true, highlight: true },
      { name: "Real-time student struggle heatmaps", included: true },
      { name: "Classroom Quiz & Flashcard broadcasting", included: true },
      { name: "Verified Educator platform crest", included: true },
      { name: "Bulk Student Seat Licensing", included: true },
    ],
    teacherFeatures: [
      { name: "Unlimited Classrooms & Prompt Sandboxes", included: true, highlight: true },
      { name: "Student prompt quota monitoring", included: true },
      { name: "Verified Educator Profile Badge", included: true },
    ],
  },
};

/**
 * Calculates dynamic educator pricing: $9 base + volume seats rate
 * <= 200 seats: $0.12 / seat
 * 201-500 seats: $0.10 / seat
 * > 500 seats: $0.08 / seat
 */
export function calculateEducatorCustomPrice(seats: number): number {
  let rate = 0.12;
  if (seats > 500) {
    rate = 0.08;
  } else if (seats > 200) {
    rate = 0.1;
  }
  return Math.round(9 + seats * rate);
}

/**
 * Calculate exactly 1 calendar month ahead from today (or from given date)
 */
export function calculateOneMonthRenewal(from = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/**
 * Calculate human-friendly time remaining until renewal
 */
export function formatPeriodEnd(isoString?: string | null): {
  formattedDate: string;
  daysRemaining: number;
  isExpired: boolean;
} {
  if (!isoString) {
    return {
      formattedDate: "Ongoing / Lifetime",
      daysRemaining: 999,
      isExpired: false,
    };
  }

  const end = new Date(isoString);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  const formattedDate = end.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return { formattedDate, daysRemaining, isExpired };
}

export interface UserSubscriptionRecord {
  id?: string;
  user_id: string;
  plan_tier: "free" | "pro" | "educator" | string;
  status: "active" | "canceled" | "trialing" | string;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save / Update a user subscription to Supabase `public.subscriptions`
 * and log to `public.user_logs`
 */
export async function saveUserSubscription(params: {
  userId: string;
  planTier: "free" | "pro" | "educator" | string;
  status?: "active" | "canceled" | "trialing" | string;
  customSeats?: number;
  extendMonths?: number;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { userId, planTier, status = "active", customSeats, extendMonths = 1 } = params;

    // 1 calendar month for active subscription, or null for free
    let periodEnd: string | null = null;
    if (planTier !== "free" && status === "active") {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + extendMonths);
      periodEnd = targetDate.toISOString();
    }

    const payload: Partial<UserSubscriptionRecord> = {
      user_id: userId,
      plan_tier: planTier,
      status: status,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    };

    // Check if subscription record already exists for this user
    const { data: existingRows } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    const existingId = existingRows && existingRows.length > 0 ? existingRows[0].id : null;
    let savedRecord: any = null;

    if (existingId) {
      // Record exists: update directly by ID to avoid any conflict resolution issues
      const { data, error: updateErr } = await supabase
        .from("subscriptions")
        .update({
          plan_tier: planTier,
          status: status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingId)
        .select()
        .maybeSingle();

      if (updateErr) throw updateErr;
      savedRecord = data;
    } else {
      // No existing record: insert new subscription row
      const { data, error: insertErr } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_tier: planTier,
          status: status,
          current_period_end: periodEnd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (insertErr) {
        // Fallback in case of concurrent insert: update by user_id
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from("subscriptions")
          .update({
            plan_tier: planTier,
            status: status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .maybeSingle();

        if (fallbackErr) throw fallbackErr;
        savedRecord = fallbackData;
      } else {
        savedRecord = data;
      }
    }

    // Record audit entry in `public.user_logs`
    const logDetails = JSON.stringify({
      event: "subscription_updated",
      plan_tier: planTier,
      status: status,
      current_period_end: periodEnd,
      custom_seats: customSeats || null,
      price_estimate:
        planTier === "pro"
          ? 15
          : planTier === "educator"
          ? calculateEducatorCustomPrice(customSeats || 100)
          : 0,
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from("user_logs").insert({
        user_id: userId,
        action_type: "subscription_change",
        details: logDetails,
      });
    } catch (logErr) {
      console.warn("Audit log for subscription could not be written:", logErr);
    }

    return { success: true, data: savedRecord };
  } catch (err: any) {
    console.error("Failed to save subscription:", err);
    return { success: false, error: err.message || "Failed to update subscription" };
  }
}

/**
 * Fetch active subscription for a user
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionRecord | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as UserSubscriptionRecord;
  } catch {
    return null;
  }
}
