import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui-kit";
import {
  FileText,
  MessageSquare,
  FileCheck2,
  Calendar,
  TrendingUp,
  Brain,
  History,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const getStoredItem = (key: string, fallback = "") => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

interface AnalyticsStat {
  label: string;
  value: string;
  trend: string;
  icon: typeof FileText;
}

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — tutor.vigilance.rw" }] }),
  component: AnalyticsPage,
});

const weeklyActivity = [] as { day: string; hours: number; height: string }[];

const subjectFocus = [] as { subject: string; percentage: number }[];

const recentMilestones = [] as Array<{
  title: string;
  subtitle: string;
  time: string;
  icon: typeof FileText;
}>;

const insightCards = [
  {
    title: "Insights",
    detail:
      "Your analytics appear here as the system collects learning activity from your materials, quizzes, and chat sessions.",
  },
];

function AnalyticsPage() {
  const navigate = useNavigate();

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth/sign-in" as any });
      }
    };
    checkAuth();
  }, []);

  const [stats, setStats] = useState<AnalyticsStat[]>([
    {
      label: "Materials",
      value: "0",
      trend: "No materials uploaded yet",
      icon: FileText,
    },
    {
      label: "Chat sessions",
      value: "0",
      trend: "No chat activity yet",
      icon: MessageSquare,
    },
    {
      label: "Quizzes taken",
      value: "0",
      trend: "No quiz attempts yet",
      icon: FileCheck2,
    },
    {
      label: "Accumulated Score",
      value: "0 XP",
      trend: "No score data available",
      icon: Calendar,
    },
  ]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { count: materialsCount } = await supabase
            .from("materials")
            .select("*", { count: "exact", head: true });

          const { count: sessionsCount } = await supabase
            .from("chat_sessions")
            .select("*", { count: "exact", head: true })
            .eq("student_id", userData.user.id);

          const { count: quizzesCount } = await supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("student_id", userData.user.id);

          const loadedXp = Number(getStoredItem("student_xp", "0"));
          const xpValue = Number.isFinite(loadedXp) ? loadedXp : 0;
          const streakDays = xpValue > 0 ? Math.max(1, Math.floor(xpValue / 120)) : 0;

          setStats([
            {
              label: "Materials",
              value: String(materialsCount || 0),
              trend: materialsCount
                ? `${materialsCount} materials uploaded`
                : "No materials uploaded yet",
              icon: FileText,
            },
            {
              label: "Chat sessions",
              value: String(sessionsCount || 0),
              trend: sessionsCount
                ? `${sessionsCount} sessions recorded`
                : "No chat activity yet",
              icon: MessageSquare,
            },
            {
              label: "Quizzes taken",
              value: String(quizzesCount || 0),
              trend: quizzesCount
                ? `${quizzesCount} quiz attempts recorded`
                : "No quiz attempts yet",
              icon: FileCheck2,
            },
            {
              label: "Accumulated Score",
              value: `${xpValue} XP`,
              trend: xpValue
                ? `Streak status: active (${streakDays} days)`
                : "No score data available",
              icon: Calendar,
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not retrieve live db analytics metrics:", err);
      }
    };
    fetchAnalytics();
  }, []);
  return (
    <AppShell title="Learning Analytics">
      <div className="space-y-6">
        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 flex flex-col justify-between border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">
                    {s.value}
                  </h3>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-elevated/70 text-foreground">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                {s.trend}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Weekly Study Time CSS Graph */}
          <Card className="lg:col-span-8 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Weekly Study Time</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hours logged studying across all documents</p>
            </div>
            
            {weeklyActivity.length > 0 ? (
              <div className="mt-8 flex items-end justify-between gap-2 h-48 border-b border-border/60 pb-2">
                {weeklyActivity.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center group">
                    <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-medium">
                      {d.hours}h
                    </div>
                    <div className={`w-full max-w-[2.5rem] rounded-t-md bg-foreground/20 group-hover:bg-foreground transition-all duration-350 ${d.height}`} />
                    <span className="text-xs text-muted-foreground mt-2 font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex h-48 items-center justify-center rounded-xl border border-border bg-background text-sm text-muted-foreground">
                Weekly study activity will appear once you begin tracking sessions.
              </div>
            )}
          </Card>

          {/* Subject Focus Distribution */}
          <Card className="lg:col-span-4 p-6">
            <h3 className="text-sm font-semibold text-foreground">Subject Focus</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution of reading and active chat queries</p>
            
            <div className="mt-6 space-y-4">
              {subjectFocus.map((sub) => (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium text-foreground">{sub.subject}</span>
                    <span className="font-semibold text-muted-foreground">{sub.percentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${sub.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance vs Confidence Matrix Correlation */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-3">
            <Brain className="h-4 w-4 text-foreground" />
            Performance & Confidence Correlation Analysis
          </h3>
          <p className="text-xs text-muted-foreground mt-2 mb-5">
            Correlating quiz scores with your self-rated confidence (Scale 1–5) to identify emotional barriers and cognitive blind spots.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {insightCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-border bg-background p-4">
                <span className="rounded bg-border/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">{card.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Milestones Timeline */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Learning Milestones</h3>
              <p className="text-xs text-muted-foreground">Historical records of your study success</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {recentMilestones.length > 0 ? (
              recentMilestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated/40">
                    <m.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-foreground truncate">{m.title}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{m.subtitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
                Recent milestones will show up here once you complete quizzes and study sessions.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
