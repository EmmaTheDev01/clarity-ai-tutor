import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Building,
  Mail,
  User,
  Users,
  Calendar,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/request-demo")({
  head: () => ({ meta: [{ title: "Request a Demo — Purelearn.ai" }] }),
  component: RequestDemoPage,
});

function RequestDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Higher Ed Faculty");
  const [studentCount, setStudentCount] = useState("50-200");
  const [preferredDate, setPreferredDate] = useState("");
  const [useCase, setUseCase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !organization.trim()) {
      toast.error("Please fill in your name, email, and organization.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("demo_requests").insert({
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim(),
        role,
        student_count: studentCount,
        preferred_date: preferredDate || null,
        use_case: useCase.trim() || null,
        status: "pending",
      });

      if (error) {
        console.error("Demo request insert error:", error);
        throw error;
      }

      setIsSubmitted(true);
      toast.success("Demo request submitted successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit demo request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Purelearn.ai Logo" className="h-10 w-auto sm:h-11" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth/sign-in"
              className="rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth/sign-up"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Context & Value Props */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                  Live Demonstration
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Experience PureLearn in action.
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  See how educators, university departments, and dedicated students turn complex course materials into conversational intelligence and automated practice exams.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-6 pt-2">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Adaptive Socratic Tutoring
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Experience conversational scaffolding that guides learners step-by-step toward conceptual mastery instead of generating shallow answers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Automated Curriculum Exam Generation
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Generate targeted quizzes mapped directly to your course syllabus, lecture slides, and assigned papers with instant citation breakdowns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Classroom & Institutional Telemetry
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Manage multiple student cohorts with strict cognitive isolation, diagnostic analytics, and customized volume seat pricing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground border-t border-border/80">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  GDPR & FERPA Aligned
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Strict Data Isolation
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Form Card */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-lg relative overflow-hidden">
                {isSubmitted ? (
                  <div className="py-12 text-center space-y-5">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Demo Request Received!
                      </h2>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Thank you, <strong className="text-foreground">{name}</strong>. Our academic onboarding team has received your request and will reach out to <strong className="text-foreground">{email}</strong> within 1 business day to schedule your walkthrough.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link
                        to="/"
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Return to Homepage
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitted(false);
                          setName("");
                          setEmail("");
                          setOrganization("");
                          setUseCase("");
                          setPreferredDate("");
                        }}
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 border-b border-border/80 pb-4">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Schedule a Personalized Walk-Through
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Fill out the details below and we&apos;ll tailor the demo session specifically to your institution&apos;s curriculum or learning needs.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              placeholder="Your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Work / School Email <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                              type="email"
                              required
                              placeholder="name@institution.edu"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Organization & Role */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            School / Institution Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              placeholder="University, school, or organization"
                              value={organization}
                              onChange={(e) => setOrganization(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Your Role
                          </label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Higher Ed Faculty">Higher Ed Professor / Faculty</option>
                            <option value="K-12 Educator">K-12 School Teacher</option>
                            <option value="Academic Dean / Admin">Academic Dean / Administrator</option>
                            <option value="Department Chair">Department Chair</option>
                            <option value="Researcher / Grad Student">Researcher / Graduate Student</option>
                            <option value="Undergraduate Student">Undergraduate Student</option>
                            <option value="Enterprise / Other">Enterprise Learning & Development</option>
                          </select>
                        </div>
                      </div>

                      {/* Learners Count & Preferred Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Estimated Learners / Seats
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <select
                              value={studentCount}
                              onChange={(e) => setStudentCount(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="1-20">1 - 20 learners (Small Seminar / Lab)</option>
                              <option value="20-50">20 - 50 learners (Standard Class)</option>
                              <option value="50-200">50 - 200 learners (Lecture Course)</option>
                              <option value="200-1000">200 - 1,000 learners (Department)</option>
                              <option value="1000+">1,000+ learners (Campus-Wide)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Preferred Timing
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="e.g. Next week, or specific day/time"
                              value={preferredDate}
                              onChange={(e) => setPreferredDate(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Use Case / Challenges Textarea */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          What learning challenges or courses would you like to focus on?
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <textarea
                            rows={3}
                            placeholder="Briefly describe your courses, curriculum goals, or topics..."
                            value={useCase}
                            onChange={(e) => setUseCase(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting Your Request...
                            </>
                          ) : (
                            <>
                              Request Demo Walkthrough
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-center text-xs text-muted-foreground pt-1">
                        No credit card required. We usually respond within 24 hours.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border/80 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Purelearn.ai. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
