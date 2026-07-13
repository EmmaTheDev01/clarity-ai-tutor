import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Send } from "lucide-react";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — purelearn.ai" }] }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! Our support team will get in touch shortly.");
      setName("");
      setEmail("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-1.5 font-serif">

            purelearn.ai
          </Link>
          <Link to="/auth/sign-in" className="text-sm font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center md:text-left mb-10">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have questions about educator verification or billing? Let us know.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Contact info */}
          <div className="space-y-6">
            <Card className="p-6 bg-elevated/15 border border-border/50 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-foreground">Support & Inquiries</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For student queries, institutional onboarding help, and developer relations:
              </p>
              <div className="text-sm space-y-2 text-foreground font-semibold">
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">Support:</span> support@purelearn.ai
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">Partnerships:</span> edu@purelearn.ai
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-elevated/15 border border-border/50 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-foreground">Verification Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Educators applying for classroom verification can expedite approvals by submitting official academic credentials or linking institutional domain records.
              </p>
            </Card>
          </div>

          {/* Right Column: Contact form */}
          <Card className="p-8 bg-elevated/10 border border-border/50 rounded-2xl shadow-xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Dr. Sarah Adeyemi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="sarah@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Message Content
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Describe your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !email || !message}
                className="w-full py-2.5 rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? "Sending..." : "Submit Inquiry"}
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
