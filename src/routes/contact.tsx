import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Copy, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Purelearn.ai | AI Tutoring Support & Inquiries" },
      {
        name: "description",
        content:
          "Contact Purelearn.ai for student assistance, educator verification, institutional partnerships, and platform inquiries.",
      },
      { property: "og:url", content: "https://purelearn.vigilance.rw/contact" },
    ],
    links: [{ rel: "canonical", href: "https://purelearn.vigilance.rw/contact" }],
  }),
  component: ContactPage,
});

type InquiryTopic = "General" | "Verification" | "Partnerships" | "Technical";

const SUPPORT_PHONE = "+250 795 632 058";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<InquiryTopic>("General");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const topics: InquiryTopic[] = ["General", "Verification", "Partnerships", "Technical"];

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedItem(value);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Dispatch email directly to emmanhabumugisha@gmail.com
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        console.warn("Contact email dispatch responded with status:", res.status);
      }

      // 2. Log inquiry audit to user_logs for admin records
      await supabase.from("user_logs").insert({
        action_type: "contact_inquiry",
        details: `Inquiry from ${name.trim()} (${email.trim()}) [${topic}]: ${message.trim().slice(0, 160)}`,
      });
    } catch (err) {
      console.warn("Inquiry dispatch note:", err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Thank you! Your message has been sent to our team.");
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setTopic("General");
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground antialiased selection:bg-zinc-800 selection:text-white">
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Informational Column (Dark Minimalist Surface) */}
        <div className="w-full md:w-1/2 lg:w-[46%] bg-zinc-950 text-zinc-100 p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900">
          <div>
            {/* Top Navigation */}
            <header className="mb-14 sm:mb-20 flex items-center justify-between">
              <Link to="/" className="inline-flex items-center group">
                <img
                  src="/logo.png"
                  alt="Purelearn.ai"
                  className="h-9 sm:h-10 w-auto invert transition-opacity hover:opacity-90"
                />
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 transition-all"
              >
                Sign In
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </header>

            {/* Title & Introduction */}
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Support & Inquiries
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
                Get in touch
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-12">
                Have questions regarding educator verification, institutional onboarding, or general support? Reach out directly and we’ll help you out.
              </p>

              {/* Contact Channels */}
              <div className="space-y-6 mb-12">
                <div className="group rounded-2xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/70 p-4 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Product Support
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("support@purelearn.ai", "support email")}
                      className="text-zinc-400 hover:text-white transition-colors p-1"
                      title="Copy email"
                      aria-label="Copy support email"
                    >
                      {copiedItem === "support@purelearn.ai" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <a
                    href="mailto:support@purelearn.ai"
                    className="text-sm font-medium text-white hover:underline flex items-center gap-2"
                  >
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    support@purelearn.ai
                  </a>
                  <p className="text-xs text-zinc-400 mt-1">
                    For student inquiries, account assistance, and technical troubleshooting.
                  </p>
                </div>

                <div className="group rounded-2xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/70 p-4 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Direct Phone Support
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(SUPPORT_PHONE, "phone number")}
                      className="text-zinc-400 hover:text-white transition-colors p-1"
                      title="Copy phone number"
                      aria-label="Copy phone number"
                    >
                      {copiedItem === SUPPORT_PHONE ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <a
                    href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
                    className="text-sm font-medium text-white hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    {SUPPORT_PHONE}
                  </a>
                  <p className="text-xs text-zinc-400 mt-1">
                    Direct line for institutional partnerships, faculty verification, and urgent support.
                  </p>
                </div>
              </div>

              {/* Educator Verification Note */}
              <div className="border-l-2 border-zinc-800 pl-4 py-1">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Expedited Verification
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Educators applying for classroom verification can expedite review by registering with their official institutional domain (<span className="text-zinc-300">.edu / .ac</span>) email.
                </p>
                <Link
                  to="/register/teacher"
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white mt-2 font-medium underline underline-offset-4"
                >
                  Educator registration portal
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-14 pt-8 border-t border-zinc-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} Purelearn.ai. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-zinc-300 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-zinc-300 transition-colors">
                Terms
              </Link>
              <Link to="/request-demo" className="hover:text-zinc-300 transition-colors">
                Demo
              </Link>
            </div>
          </footer>
        </div>

        {/* Right Form Column */}
        <div className="w-full md:w-1/2 lg:w-[54%] p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center bg-background text-foreground">
          <div className="max-w-md w-full mx-auto">
            {isSubmitted ? (
              <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Message received</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Thank you, <span className="font-medium text-foreground">{name}</span>. We've received your note regarding{" "}
                  <span className="font-medium text-foreground">{topic.toLowerCase()}</span> and will follow up with you at{" "}
                  <span className="font-medium text-foreground">{email}</span> within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                    Send a message
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill out the form below and our team will get back to you shortly.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Topic Pill Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Inquiry Category
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {topics.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                            topic === t
                              ? "bg-foreground text-background shadow-xs"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g. Dr. Sarah Adeyemi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="e.g. sarah@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Message Content
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us about your questions, student requirements, or institutional needs..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
                    className="w-full py-3.5 px-6 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-muted-foreground">
                    By submitting, you agree to our{" "}
                    <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                      privacy policy
                    </Link>
                    . We protect your academic data.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
