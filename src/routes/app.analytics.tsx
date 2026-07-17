import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui-kit";
import {
  FileText,
  MessageSquare,
  FileCheck2,
  Calendar,
  Brain,
  History,
  BookOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { LearningMaterial, mapMaterialRow } from "@/lib/learning-materials";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStoredItem = (key: string, fallback = "") => {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const SUBJECT_COLOURS = [
  "hsl(215,70%,60%)",
  "hsl(280,60%,65%)",
  "hsl(145,55%,55%)",
  "hsl(35,80%,60%)",
  "hsl(5,70%,60%)",
  "hsl(195,65%,55%)",
  "hsl(320,55%,60%)",
];

interface AnalyticsStat {
  label: string;
  value: string;
  trend: string;
  icon: typeof FileText;
}

interface WeekDay {
  day: string;
  date: string;
  queries: number;
  hours: number;
}

interface SubjectSlice {
  name: string;
  value: number;
  color: string;
}

interface Milestone {
  title: string;
  subtitle: string;
  time: string;
  icon: typeof FileText;
}

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — tutor.vigilance.rw" }] }),
  component: AnalyticsPage,
});

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
function StudyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-elevated/95 backdrop-blur px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground">{payload[0].payload.day} · {payload[0].payload.date}</p>
      <p className="text-muted-foreground mt-0.5">{payload[0].value.toFixed(1)} hrs studied</p>
      <p className="text-muted-foreground">{payload[0].payload.queries} interactions logged</p>
    </div>
  );
}

function SubjectTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="rounded-xl border border-border bg-elevated/95 backdrop-blur px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground">{name}</p>
      <p className="text-muted-foreground mt-0.5">
        {value} item{value !== 1 ? "s" : ""} · {(percent * 100).toFixed(0)}%
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AnalyticsPage() {
  const navigate = useNavigate();
  const sessionStartRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) navigate({ to: "/auth/sign-in" as any });
    };
    check();
  }, []);

  // Log study session start / end
  useEffect(() => {
    const log = async (actionType: string, extra?: object) => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          await supabase.from("user_logs").insert({
            user_id: u.user.id,
            action_type: actionType,
            details: JSON.stringify({ page: "analytics", ...extra }),
          });
        }
      } catch { /* non-critical */ }
    };
    log("study_session_start");
    sessionStartRef.current = new Date().toISOString();
    return () => {
      const ms = Date.now() - new Date(sessionStartRef.current).getTime();
      log("study_session_end", { duration_ms: ms });
    };
  }, []);

  const [stats, setStats] = useState<AnalyticsStat[]>([
    { label: "Materials", value: "0", trend: "No materials uploaded yet", icon: FileText },
    { label: "Chat sessions", value: "0", trend: "No chat activity yet", icon: MessageSquare },
    { label: "Quizzes taken", value: "0", trend: "No quiz attempts yet", icon: FileCheck2 },
    { label: "Accumulated Score", value: "0 XP", trend: "No score data available", icon: Calendar },
  ]);

  const [weeklyData, setWeeklyData] = useState<WeekDay[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectSlice[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [materialsList, setMaterialsList] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const userId = userData.user.id;

        // ── Core stats
        const [
          { count: materialsCount },
          { count: sessionsCount },
          { count: quizzesCount },
        ] = await Promise.all([
          supabase.from("materials").select("*", { count: "exact", head: true }).eq("uploaded_by", userId),
          supabase.from("chat_sessions").select("*", { count: "exact", head: true }).eq("student_id", userId),
          supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("student_id", userId),
        ]);

        const loadedXp = Number(getStoredItem("student_xp", "0"));
        const xpValue = Number.isFinite(loadedXp) ? loadedXp : 0;
        const streakDays = xpValue > 0 ? Math.max(1, Math.floor(xpValue / 120)) : 0;

        setStats([
          {
            label: "Materials",
            value: String(materialsCount || 0),
            trend: materialsCount ? `${materialsCount} materials uploaded` : "No materials uploaded yet",
            icon: FileText,
          },
          {
            label: "Chat sessions",
            value: String(sessionsCount || 0),
            trend: sessionsCount ? `${sessionsCount} sessions recorded` : "No chat activity yet",
            icon: MessageSquare,
          },
          {
            label: "Quizzes taken",
            value: String(quizzesCount || 0),
            trend: quizzesCount ? `${quizzesCount} quiz attempts recorded` : "No quiz attempts yet",
            icon: FileCheck2,
          },
          {
            label: "Accumulated Score",
            value: `${xpValue} XP`,
            trend: xpValue ? `Active streak: ${streakDays} days` : "No score data available",
            icon: Calendar,
          },
        ]);

        // ── Weekly Study Time from user_logs (last 7 days)
        const since = daysAgo(6);
        const { data: logsRaw } = await supabase
          .from("user_logs")
          .select("action_type, created_at")
          .eq("user_id", userId)
          .gte("created_at", since)
          .order("created_at", { ascending: true });

        const buckets: Record<string, number> = {};
        const dayMeta: Record<string, { label: string; date: string }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().substring(0, 10);
          buckets[key] = 0;
          dayMeta[key] = {
            label: DAY_LABELS[d.getDay()],
            date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          };
        }

        const COUNTED_ACTIONS = new Set([
          "chat_query_submitted",
          "study_session_start",
          "note_created",
          "note_starred",
        ]);

        for (const log of logsRaw || []) {
          const day = (log.created_at as string).substring(0, 10);
          if (day in buckets && COUNTED_ACTIONS.has(log.action_type)) {
            buckets[day]++;
          }
        }

        const weekRows: WeekDay[] = Object.entries(buckets).map(([date, count]) => ({
          day: dayMeta[date].label,
          date: dayMeta[date].date,
          queries: count,
          hours: Math.round(count * 0.25 * 10) / 10,
        }));

        const total = weekRows.reduce((s, r) => s + r.hours, 0);
        setTotalHours(Math.round(total * 10) / 10);

        setWeeklyData(weekRows);

        // ── Subject Focus from materials
        const { data: mats } = await supabase
          .from("materials")
          .select("type, subject")
          .eq("uploaded_by", userId);

        const typeMap: Record<string, number> = {};
        for (const m of mats || []) {
          const key = m.subject || m.type || "Other";
          typeMap[key] = (typeMap[key] || 0) + 1;
        }

        const sorted = Object.entries(typeMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7);

        setSubjectData(
          sorted.map(([name, value], i) => ({
            name,
            value,
            color: SUBJECT_COLOURS[i % SUBJECT_COLOURS.length],
          }))
        );

        // ── Recent Milestones from user_logs
        const { data: recentLogs } = await supabase
          .from("user_logs")
          .select("action_type, details, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(12);

        const milestoneMap: Record<string, { icon: typeof FileText; title: string }> = {
          chat_query_submitted: { icon: MessageSquare, title: "Chat query sent" },
          note_created: { icon: BookOpen, title: "Note created" },
          note_starred: { icon: Sparkles, title: "Note starred" },
          user_login: { icon: TrendingUp, title: "Signed in" },
          study_session_start: { icon: Brain, title: "Study session started" },
          study_session_end: { icon: History, title: "Study session ended" },
        };

        const mapped: Milestone[] = (recentLogs || []).map((log) => {
          const meta = milestoneMap[log.action_type] ?? {
            icon: FileText,
            title: (log.action_type as string).replace(/_/g, " "),
          };
          let rawDetails = "";
          try {
            const p = JSON.parse(log.details as string);
            rawDetails = p?.page ? `Page: ${p.page}` : JSON.stringify(p).substring(0, 60);
          } catch {
            rawDetails = ((log.details as string) || "").substring(0, 60);
          }
          const ts = new Date(log.created_at as string);
          return {
            title: meta.title,
            subtitle: rawDetails,
            time: ts.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
            icon: meta.icon,
          };
        });

        // ── Materials list
        const { data: dbMatsList } = await supabase
          .from("materials")
          .select("*")
          .eq("uploaded_by", userId)
          .order("created_at", { ascending: false });
        if (dbMatsList) {
          setMaterialsList(dbMatsList.map(mapMaterialRow));
        }

        setMilestones(mapped);
      } catch (err) {
        console.warn("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.1);

  return (
    <AppShell title="Learning Analytics">
      <div className="space-y-6">

        {/* ── Core Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 flex flex-col justify-between border border-border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">
                    {loading ? <span className="animate-pulse text-muted-foreground/40">—</span> : s.value}
                  </h3>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-elevated/70 text-foreground">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">{s.trend}</p>
            </Card>
          ))}
        </div>

        {/* ── Charts Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Weekly Study Time — Bar Chart */}
          <Card className="lg:col-span-8 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Weekly Study Time</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Hours logged studying across all documents</p>
              </div>
              {!loading && totalHours > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-xl font-bold text-foreground">{totalHours}h</p>
                  <p className="text-[10px] text-muted-foreground">this week</p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : weeklyData.every((d) => d.hours === 0) ? (
              <div className="h-52 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background text-center gap-2 px-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Weekly study activity will appear once you begin tracking sessions.</p>
                <p className="text-[11px] text-muted-foreground/60">Chat sessions and material interactions are automatically tracked.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="32%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}h`}
                    />
                    <Tooltip
                      content={<StudyTooltip />}
                      cursor={false}
                      contentStyle={{ backgroundColor: "transparent", border: "none", padding: 0 }}
                      wrapperStyle={{ outline: "none" }}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {weeklyData.map((entry, i) => (
                        <Cell
                          key={i}
                          className="transition-all duration-200 hover:opacity-75 cursor-pointer"
                          fill={
                            entry.hours >= maxHours * 0.85
                              ? "hsl(var(--foreground))"
                              : entry.hours > 0
                              ? "hsl(var(--foreground) / 0.4)"
                              : "hsl(var(--border))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-between px-1 -mt-1">
                  {weeklyData.map((d) => (
                    <div key={d.date} className="flex-1 text-center">
                      <p className="text-[9px] text-muted-foreground/50">{d.date}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Subject Focus — Donut Pie Chart */}
          <Card className="lg:col-span-4 p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Subject Focus</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribution of reading and active chat queries</p>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center h-48">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : subjectData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-border bg-background text-center gap-2 px-4">
                <Brain className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Subject distribution will appear as you upload materials.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={700}
                    >
                      {subjectData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke="transparent"
                          className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<SubjectTooltip />}
                      contentStyle={{ backgroundColor: "transparent", border: "none", padding: 0 }}
                      wrapperStyle={{ outline: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {subjectData.map((s) => {
                    const total = subjectData.reduce((acc, x) => acc + x.value, 0);
                    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                    return (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate text-[11px] font-medium text-foreground flex-1">{s.name}</span>
                        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Performance & Confidence Correlation ───────────────────────── */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 border-b border-border/50 pb-3">
            <Brain className="h-4 w-4 text-foreground" />
            Performance &amp; Confidence Correlation Analysis
          </h3>
          <p className="text-xs text-muted-foreground mt-2 mb-5">
            Correlating quiz scores with your self-rated confidence (Scale 1–5) to identify
            emotional barriers and cognitive blind spots.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Insights", detail: "Your analytics appear here as the system collects learning activity from your materials, quizzes, and chat sessions." },
              { title: "Study Time", detail: totalHours > 0 ? `${totalHours} hours logged this week via chat sessions and document interactions.` : "No study time logged this week. Start a chat session to begin tracking." },
              { title: "Subjects", detail: subjectData.length > 0 ? `Top subject: "${subjectData[0].name}" with ${subjectData[0].value} material${subjectData[0].value !== 1 ? "s" : ""}.` : "Upload materials to see subject distribution." },
              { title: "Activity", detail: milestones.length > 0 ? `Last activity: "${milestones[0]?.title}" at ${milestones[0]?.time}.` : "No recent activity logged yet." },
            ].map((card) => (
              <div key={card.title} className="rounded-lg border border-border bg-background p-4">
                <span className="rounded bg-border/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
                <p className="mt-3 text-sm font-semibold text-foreground">{card.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Recent Learning Milestones ──────────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Learning Milestones</h3>
              <p className="text-xs text-muted-foreground">Historical records of your study activity</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-border/50" />
                  <div className="flex-1 space-y-1.5 py-1">
                    <div className="h-3 w-1/3 rounded bg-border/50" />
                    <div className="h-2.5 w-2/3 rounded bg-border/30" />
                  </div>
                </div>
              ))
            ) : milestones.length > 0 ? (
              milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated/40 group-hover:bg-elevated transition">
                    <m.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className={`min-w-0 flex-1 pb-3 ${i < milestones.length - 1 ? "border-b border-border/30" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-foreground truncate capitalize">{m.title}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.time}</span>
                    </div>
                    {m.subtitle && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{m.subtitle}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground text-center">
                Recent milestones will show up here once you complete quizzes and study sessions.
              </div>
            )}
          </div>
        </Card>
        {/* ── Your Study Materials ─────────────────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Your Study Materials</h3>
              <p className="text-xs text-muted-foreground">List of reading materials, links, and documents uploaded to Clarity</p>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : materialsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2.5 font-semibold">Title</th>
                      <th className="py-2.5 font-semibold">Type</th>
                      <th className="py-2.5 font-semibold">Size / Source</th>
                      <th className="py-2.5 font-semibold text-right">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {materialsList.map((m) => {
                      const Icon = m.icon || FileText;
                      return (
                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 font-medium text-foreground flex items-center gap-2 max-w-[240px] truncate">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate" title={m.title}>{m.title}</span>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{m.type}</td>
                          <td className="py-2.5 text-muted-foreground max-w-[150px] truncate">{m.size}</td>
                          <td className="py-2.5 text-muted-foreground text-right">{m.updated}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground text-center">
                No materials uploaded yet. Upload materials in the library or chat workspace to see them here.
              </div>
            )}
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
