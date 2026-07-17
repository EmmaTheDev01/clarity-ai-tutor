import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
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
    <div className="min-h-screen flex flex-col font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Side (Black) */}
        <div className="w-full md:w-1/2 bg-black text-white p-8 md:p-16 lg:p-24 flex flex-col justify-between">
          <div>
            <header className="mb-16 flex items-center justify-between">
              <Link to="/" className="flex items-center">
                <div className="bg-white rounded-xl py-2 px-3 flex items-center justify-center shadow-lg">
                  <img 
                    src="/logo.png" 
                    alt="purelearn.ai Logo" 
                    className="h-9 w-auto sm:h-10" 
                  />
                </div>
              </Link>
              <Link 
                to="/auth/sign-in" 
                className="text-sm font-semibold px-5 py-2.5 rounded-full border border-zinc-800 hover:bg-zinc-900 transition"
              >
                Sign In
              </Link>
            </header>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Get in Touch
            </h1>
            <p className="text-zinc-400 text-lg mb-16 max-w-md leading-relaxed">
              Have questions about educator verification, partnerships, or billing? Let us know and our team will assist you.
            </p>

            <div className="space-y-12 max-w-md">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Support & Inquiries</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  For student queries, institutional onboarding help, and developer relations.
                </p>
                <div className="text-sm space-y-3 font-semibold pt-2">
                  <p className="flex items-center gap-3">
                    <span className="text-zinc-600 font-normal w-24">Support:</span> support@purelearn.ai
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="text-zinc-600 font-normal w-24">Partnerships:</span> edu@purelearn.ai
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Verification Support</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Educators applying for classroom verification can expedite approvals by submitting official academic credentials or linking institutional domain records.
                </p>
              </div>
            </div>
          </div>

          <footer className="mt-20 text-xs text-zinc-600">
            © {new Date().getFullYear()} purelearn.ai. All rights reserved.
          </footer>
        </div>

        {/* Right Side (White) */}
        <div className="w-full md:w-1/2 bg-white text-black p-8 md:p-16 lg:p-24 flex flex-col justify-center relative">
          
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold mb-10 text-zinc-900">Send a Message</h2>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Dr. Sarah Adeyemi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border-b-2 border-zinc-200 bg-transparent px-0 py-3 text-black placeholder:text-zinc-300 focus:border-black focus:outline-none transition-colors rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="sarah@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-b-2 border-zinc-200 bg-transparent px-0 py-3 text-black placeholder:text-zinc-300 focus:border-black focus:outline-none transition-colors rounded-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="message" className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Message Content
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Describe your inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full border-b-2 border-zinc-200 bg-transparent px-0 py-3 text-black placeholder:text-zinc-300 focus:border-black focus:outline-none transition-colors resize-none rounded-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !email || !message}
                className="w-full py-4 mt-4 bg-black text-white font-bold tracking-wide uppercase text-sm hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : "Submit Inquiry"}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
        
      </div>
    </div>
  );
}
