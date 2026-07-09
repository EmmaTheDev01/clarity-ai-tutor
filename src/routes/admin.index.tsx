import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, Pill } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import {
  Users,
  ShieldAlert,
  CreditCard,
  Brain,
  FileCheck2,
  Lock,
  Unlock,
  Settings,
  LogOut,
  TrendingUp,
  Cpu,
  BookmarkCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Portal — tutor.vigilance.rw" }] }),
  component: AdminPortal,
});

// Mock telemetry stats for subscriptions & platform usage
const mockSubscriptionLogs = [
  { id: "sub1", name: "David M.", email: "david.m@univ.edu", plan: "Pro", status: "Active", price: "$15/mo", renewal: "2026-08-01" },
  { id: "sub2", name: "Clara Umutoni", email: "clara@mit.edu", plan: "Enterprise", status: "Active", price: "$49/mo", renewal: "2026-09-12" },
  { id: "sub3", name: "Marc K.", email: "m.marc@school.rw", plan: "Pro", status: "Trialing", price: "$0 (Trial)", renewal: "2026-07-20" },
  { id: "sub4", name: "Jean de Dieu", email: "jdd@ur.ac.rw", plan: "Free", status: "Active", price: "$0", renewal: "N/A" },
];

const mockClassroomAudits = [
  { id: "c1", name: "Linear Algebra 101", teacher: "Dr. Sarah Adeyemi", materials: 4, quizLoop: "Pass", students: 4 },
  { id: "c2", name: "Introduction to Calculus", teacher: "Prof. Jean Pierre", materials: 2, quizLoop: "Fail", students: 18 },
  { id: "c3", name: "Advanced Deep Learning", teacher: "Dr. Sarah Adeyemi", materials: 8, quizLoop: "Pass", students: 25 },
  { id: "c4", name: "Cell Biology Practice", teacher: "Dr. Janet Mukamana", materials: 3, quizLoop: "Pass", students: 12 },
];

const cognitiveBreakdown = [
  { tag: "Standard Mode", count: 1840, percentage: 65, color: "bg-blue-500" },
  { tag: "ADHD Focus Mode", count: 425, percentage: 15, color: "bg-amber-500" },
  { tag: "Dyslexia Friendly Mode", count: 340, percentage: 12, color: "bg-purple-500" },
  { tag: "Sensory Low-Stimulus Mode", count: 226, percentage: 8, color: "bg-slate-400" },
];

function AdminPortal() {
  const navigate = useNavigate();

  // Selected sub tab
  const [activeTab, setActiveTab] = useState<"subscriptions" | "classrooms">("subscriptions");

  // Dynamic DB state metrics
  const [totalUsers, setTotalUsers] = useState(2831);
  const [activeClassrooms, setActiveClassrooms] = useState(14);
  const [materialsCount, setMaterialsCount] = useState(174);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>(mockSubscriptionLogs);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        if (usersCount) setTotalUsers(usersCount);

        const { count: classCount } = await supabase
          .from("classrooms")
          .select("*", { count: "exact", head: true });
        if (classCount) setActiveClassrooms(classCount);

        const { count: matCount } = await supabase
          .from("materials")
          .select("*", { count: "exact", head: true });
        if (matCount) setMaterialsCount(matCount);

        // Fetch subscriptions from database
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("*")
          .limit(10);
        if (subs && subs.length > 0) {
          setSubscriptionsList(subs.map((s, index) => ({
            id: s.id || `sub_${index}`,
            name: s.subscriber_name || "Platform Student",
            email: s.subscriber_email || "student@tutor.vigilance.rw",
            plan: s.plan_name || "Pro",
            status: s.status || "Active",
            price: s.status === "Trialing" ? "$0 (Trial)" : "$15/mo",
            renewal: s.renewal_date || "2026-08-01"
          })));
        }
      } catch (err) {
        console.warn("Could not retrieve live database statistics for administrator portal:", err);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-wider text-foreground flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" />
              tutor.vigilance.rw
              <span className="rounded bg-red-500/10 text-red-500 px-1.5 py-0.5 text-[10px] font-semibold">System Administrator</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-foreground">Global Admin Controller</p>
              <p className="text-[10px] text-muted-foreground">Console Root</p>
            </div>
            <button
              onClick={() => navigate({ to: "/auth/sign-in" as any })}
              className="rounded-md border border-border p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Core Stats Overview Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Active Users</p>
                <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">{totalUsers.toLocaleString()}</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 bg-blue-500/10">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40 pt-2.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              +142 registering students this week
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Classrooms</p>
                <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">{activeClassrooms}</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 bg-emerald-500/10">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40 pt-2.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              14.3% trial conversion rate
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Course Materials</p>
                <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">{materialsCount}</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-purple-500 bg-purple-500/10">
                <BookmarkCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40 pt-2.5">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              98.2% quiz compliance ratio
            </p>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Queries & Tokens</p>
                <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">48.9k</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-orange-500 bg-orange-500/10">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40 pt-2.5">
              <TrendingUp className="h-3 w-3 text-orange-500" />
              +8.5% token usage growth vs yesterday
            </p>
          </Card>
        </div>

        {/* Secondary Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Column: Cognitive Profile Distributions (5/12 columns) */}
          <Card className="lg:col-span-5 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" />
                Adaptive Cognitive Profiles
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribution of active student configurations
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {cognitiveBreakdown.map((item) => (
                <div key={item.tag} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{item.tag}</span>
                    <span className="text-muted-foreground font-semibold">
                      {item.count} users ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Right Column: Dynamic Subscriptions Audit Tab Panel (7/12 columns) */}
          <Card className="lg:col-span-7 p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 transition border-b-2 ${
                    activeTab === "subscriptions"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Subscriptions Log
                </button>
                <button
                  onClick={() => setActiveTab("classrooms")}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 transition border-b-2 ${
                    activeTab === "classrooms"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Classrooms Compliance
                </button>
              </div>

              <span className="text-[10px] text-muted-foreground">System Audits</span>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[300px]">
              {activeTab === "subscriptions" ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-[10px] uppercase font-bold text-muted-foreground">
                      <th className="py-2.5 font-semibold">Subscriber</th>
                      <th className="py-2.5 font-semibold">Plan</th>
                      <th className="py-2.5 font-semibold">Status</th>
                      <th className="py-2.5 font-semibold">Billing Rate</th>
                      <th className="py-2.5 font-semibold text-right">Renewal Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {subscriptionsList.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-foreground">{log.name}</p>
                          <p className="text-[10px] text-muted-foreground">{log.email}</p>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                            log.plan === "Enterprise"
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-500"
                              : log.plan === "Pro"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                              : "bg-slate-500/10 border-slate-500/20 text-muted-foreground"
                          }`}>
                            {log.plan}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-medium ${
                            log.status === "Active" ? "text-emerald-500" : "text-amber-500"
                          }`}>
                            ● {log.status}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-foreground">{log.price}</td>
                        <td className="py-3 text-right text-muted-foreground font-mono text-[10px]">{log.renewal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-[10px] uppercase font-bold text-muted-foreground">
                      <th className="py-2.5 font-semibold">Classroom Name</th>
                      <th className="py-2.5 font-semibold">Teacher / Instructor</th>
                      <th className="py-2.5 font-semibold text-center">Enrollment</th>
                      <th className="py-2.5 font-semibold text-center">Materials</th>
                      <th className="py-2.5 font-semibold text-right">Quiz-to-Doc Loop</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {mockClassroomAudits.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="py-3 pr-2 font-semibold text-foreground">{item.name}</td>
                        <td className="py-3">
                          <p className="text-foreground">{item.teacher}</p>
                        </td>
                        <td className="py-3 text-center font-medium text-foreground">{item.students}</td>
                        <td className="py-3 text-center text-muted-foreground">{item.materials} files</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            item.quizLoop === "Pass" ? "text-emerald-500" : "text-red-500"
                          }`}>
                            {item.quizLoop === "Pass" ? (
                              <>
                                <CheckCircle className="h-3 w-3" /> Passes Check
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" /> Loop Failure
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

        </div>

      </main>
    </div>
  );
}
