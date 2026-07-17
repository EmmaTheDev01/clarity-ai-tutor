import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Brain, Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing & Plans — purelearn.ai" }] }),
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const [studentCount, setStudentCount] = useState(100);
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        // Load active subscription tier
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan_tier")
          .eq("user_id", data.session.user.id)
          .maybeSingle();
        if (sub) {
          setCurrentTier(sub.plan_tier || "free");
        }
      }
    };
    checkUser();
  }, []);

  const handlePlanSelect = async (plan: string) => {
    if (!user) {
      navigate({ to: "/auth/sign-up" as any });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan_tier: plan,
        status: "active",
      });

      if (error) throw error;

      toast.success(`Successfully activated your ${plan} subscription!`);
      setCurrentTier(plan);
      setTimeout(() => {
        navigate({ to: "/app" as any });
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  // Seat pricing formula: baseline $9/mo + $0.10 per student seat, with discount bands
  const calculateCustomPrice = (seats: number) => {
    let perSeatRate = 0.12;
    if (seats > 500) perSeatRate = 0.08;
    else if (seats > 200) perSeatRate = 0.10;

    const total = 9 + seats * perSeatRate;
    return Math.round(total);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
          {user ? (
            <Link to="/app" className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5">
              Go to Workspace
            </Link>
          ) : (
            <Link to="/auth/sign-in" className="text-xs font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Flexible Plans for Modern Learning
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Get premium Socratic tutoring with customizable focus modes and individual class analytics.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch mb-16">
          {/* Free Tier */}
          <Card className="p-8 flex flex-col relative overflow-hidden bg-elevated/10 border border-border/50 rounded-2xl">
            <h3 className="text-lg font-bold text-foreground">Free Tier</h3>
            <p className="mt-2 text-xs text-muted-foreground">Perfect for test-driving Socratic tutoring.</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-foreground">$0</span>
              <span className="text-muted-foreground text-xs font-medium ml-1">/ lifetime</span>
            </div>
            <ul className="space-y-3.5 text-xs text-muted-foreground flex-1 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                3 Active Documents
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                ADHD & Dyslexia tools
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Basic Quiz generator
              </li>
            </ul>
            {user ? (
              <button
                disabled={loading || currentTier === "free"}
                onClick={() => handlePlanSelect("free")}
                className="w-full py-2.5 rounded-lg border border-border bg-background hover:bg-muted text-center text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {currentTier === "free" ? "Current Plan" : "Downgrade to Free"}
              </button>
            ) : (
              <Link to="/auth/sign-up" className="w-full py-2.5 rounded-lg border border-border hover:bg-muted text-center text-xs font-bold transition">
                Get Started
              </Link>
            )}
          </Card>

          {/* Pro Tier */}
          <Card className="p-8 flex flex-col relative overflow-hidden bg-elevated/20 border-2 border-primary/40 rounded-2xl shadow-xl shadow-primary/5">
            <div className="absolute top-4 right-4 bg-primary/10 text-primary border border-primary/20 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
              Recommended
            </div>
            <h3 className="text-lg font-bold text-foreground">Pro Learner</h3>
            <p className="mt-2 text-xs text-muted-foreground">Unrestricted tutoring for ambitious students.</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-foreground">$15</span>
              <span className="text-muted-foreground text-xs font-medium ml-1">/ month</span>
            </div>
            <ul className="space-y-3.5 text-xs text-muted-foreground flex-1 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Unlimited Documents & Notes
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                LaTeX Formula rendering
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                AI Image OCR extraction
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                Double Streak multipliers
              </li>
            </ul>
            {user ? (
              <button
                disabled={loading || currentTier === "premium" || currentTier === "pro"}
                onClick={() => handlePlanSelect("premium")}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-center text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {currentTier === "premium" || currentTier === "pro" ? "Active Subscription" : "Upgrade Now"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link to="/auth/sign-up" className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-center text-xs font-bold transition flex items-center justify-center gap-1.5">
                Upgrade Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </Card>

          {/* Custom Plan (Interactive Slider) */}
          <Card className="p-8 flex flex-col relative overflow-hidden bg-elevated/20 border border-border/50 rounded-2xl">
            <h3 className="text-lg font-bold text-foreground">Educator / Custom</h3>
            <p className="mt-2 text-xs text-muted-foreground">Adjust seats for classrooms & verification.</p>

            {/* Interactive Slider Area */}
            <div className="my-6 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-muted-foreground">Student Seats</span>
                <span className="text-primary font-mono text-sm bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                  {studentCount} seats
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-border appearance-none cursor-pointer accent-primary mb-4"
              />
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-extrabold text-foreground">${calculateCustomPrice(studentCount)}</span>
                <span className="text-muted-foreground text-xs font-medium">/ month</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mb-6">
                Calculated at $9 base + volume student pricing.
              </p>
            </div>

            <ul className="space-y-3.5 text-xs text-muted-foreground mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Isolated Classroom Hub
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Socratic Sandbox Prompt tuning
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Verify educator status
              </li>
            </ul>
            {user ? (
              <button
                disabled={loading || currentTier === "educator"}
                onClick={() => handlePlanSelect("educator")}
                className="w-full py-2.5 rounded-lg border border-border bg-background hover:bg-muted text-center text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {currentTier === "educator" ? "Current Plan" : `Build Classroom ($${calculateCustomPrice(studentCount)}/mo)`}
              </button>
            ) : (
              <Link to="/auth/sign-up" className="w-full py-2.5 rounded-lg border border-border hover:bg-muted text-center text-xs font-bold transition">
                Build Classroom
              </Link>
            )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
