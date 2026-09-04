import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface UserCountResult {
  /** Formatted tier label e.g. "500+", "1K+", "10K+" */
  label: string;
  /** Raw count from the database (0 while loading) */
  count: number;
  loading: boolean;
}

export function formatUserCount(n: number): string {
  if (n >= 1_000_000) {
    const millions = Math.floor(n / 1_000_000);
    return `${millions}M+`;
  }
  if (n >= 100_000) {
    const hundredThousands = Math.floor(n / 10_000) * 10;
    return `${hundredThousands}K+`;
  }
  if (n >= 10_000) {
    const tenThousands = Math.floor(n / 1_000);
    return `${tenThousands}K+`;
  }
  if (n >= 1_000) {
    const thousands = Math.floor(n / 1_000) * 1_000;
    return `${thousands.toLocaleString()}+`;
  }
  if (n >= 500) {
    return "500+";
  }
  if (n > 0) {
    return n.toLocaleString();
  }
  return "500+"; // Safe floor default
}

/**
 * Fetches the live user count from `public.app_stats` (publicly readable).
 * Falls back to "500+" if the query fails so the landing page always shows
 * something meaningful.
 */
export function useUserCount(): UserCountResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      try {
        const { data, error } = await supabase
          .from("app_stats")
          .select("value")
          .eq("id", "user_count")
          .single();

        if (!cancelled) {
          if (!error && data) {
            setCount(data.value as number);
          }
          // On error we leave count = 0, formatUserCount returns "500+"
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { label: formatUserCount(count), count, loading };
}
