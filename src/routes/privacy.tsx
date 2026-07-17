import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — purelearn.ai" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const sections = [
    {
      title: "1. Privacy Commitment Overview",
      paragraphs: [
        "At purelearn.ai, we are deeply committed to protecting the privacy of our students, educators, and institutional partners. We understand that educational interaction data is highly sensitive, and we construct our infrastructure with strict privacy guards. This Policy details how we collect, store, and utilize your personal information.",
        "By utilizing the Platform, you consent to the data collection and usage practices outlined in this policy. If you do not agree with any aspects of this document, you should immediately suspend account activities and request profile erasure. Our terms are designed to be clear and completely transparent."
      ]
    },
    {
      title: "2. Personal & Account Information We Collect",
      paragraphs: [
        "We collect information necessary to establish secure user profiles and optimize learning customized views. This includes your name, email address, password hashes managed via Supabase auth services, and user roles (student, teacher, or administrator). We do not collect raw credentials or inspect unauthorized fields.",
        "For student accounts, we also record cognitive profile preferences (such as ADHD, Dyslexia, or Sensory adjustments) to adapt our typography and layout parameters. For educators, we collect credential proofs, institution names, and verified status codes to complete manual onboarding audits."
      ]
    },
    {
      title: "3. Learning Data & Document Uploads",
      paragraphs: [
        "Our services process document attachments (such as PDF files, textbooks, lecture slides, and images containing equations) that you explicitly upload to the Platform. This material is stored securely on Supabase Storage buckets, and is indexed solely for the purpose of serving your private Socratic tutoring sessions.",
        "We also log chat history interactions, quiz results, and study streak scores to calculate your XP rewards and badging levels. These logs are isolated at the database layer and are never accessible to other students unless you explicitly share your study notes."
      ]
    },
    {
      title: "4. Use of Personal and Academic Data",
      paragraphs: [
        "Your data is used exclusively to compile customized, responsive Socratic tutoring sessions and render mathematical calculations. For example, student cognitive preferences dictate whether we format reading displays with bionic reading anchors or high-contrast dyslexic margins.",
        "We use system telemetry to analyze classroom active usage and coordinate quiz response trends for verified educators. We do not engage in profiling for non-educational activities, nor do we run automated processes to grade students outside of educators' direct parameters."
      ]
    },
    {
      title: "5. Information Sharing & Third-Party Integrations",
      paragraphs: [
        "purelearn.ai maintains a strict policy against selling, renting, or trading your personal data to marketing brokers. We share information only with trusted processors essential to system operation, such as Supabase for database hosting, Stripe for payment processing, and Google Gemini API for Socratic text inferences.",
        "All data processed by external AI inference engines is stripped of direct user identities where feasible. We bind all partner processors to standard data security terms, ensuring they maintain the same high level of protection as our primary servers."
      ]
    },
    {
      title: "6. Security, Encryption & Database Audits",
      paragraphs: [
        "We secure your data using industry-standard cryptographic practices. All transmission of user data, including notes, files, and chat messages, is protected in transit with SSL/TLS encryption. Databases utilize Row Level Security (RLS) policies to ensure users can only read their authorized tables.",
        "We regularly perform system security audits to check for XSS vulnerabilities, data leaks, and RLS rule bypasses. In the event of a detected data compromise, we maintain protocols to isolate the affected systems and notify impacted users without undue delay."
      ]
    },
    {
      title: "7. Cookies, Storage & Telemetry Technologies",
      paragraphs: [
        "The Platform uses local storage and essential cookies to maintain your login session active and remember styling options (such as dark mode preferences and active document filters). These technologies do not monitor your behavior outside of the purelearn.ai workspace.",
        "We do not integrate tracking pixels or advertising cookies. Any performance telemetry collected is limited to measuring response latency and ensuring the system is operating within correct parameters."
      ]
    },
    {
      title: "8. User Rights & Profile Control",
      paragraphs: [
        "You possess complete ownership and control over your learning data. You have the right to inspect, edit, or update your profile details and accommodation settings directly from the Settings menu. You may also delete your notes, shared files, or invite lists at any time.",
        "We facilitate the Right to be Forgotten. If you choose to delete your account inside the dashboard, all your databases records (including profiles, student profiles, notes, and logs) will undergo complete cascade deletions. This action is permanent and cannot be reversed."
      ]
    },
    {
      title: "9. Children's Privacy Compliance (COPPA)",
      paragraphs: [
        "purelearn.ai is committed to protecting the privacy of young learners. If the Platform is used in primary or secondary school contexts, we require the school or verified educator to obtain parent or guardian consent before student accounts are initialized.",
        "We do not knowingly collect personal information from children under the age of 13 without appropriate verification. If we learn that such information was collected without consent, we will take immediate steps to remove it from our active databases."
      ]
    },
    {
      title: "10. Policy Changes & Updates",
      paragraphs: [
        "We may revise this Privacy Policy periodically to reflect updates in privacy regulations or changes in our AI tutoring processes. The 'Last Updated' date at the top of this document indicates when changes were last integrated into the live workspace.",
        "For material modifications that affect your data privacy rights, we will notify you through in-app alerts or emails prior to the changes taking effect. We encourage you to review this policy periodically to remain informed about our data protection standards."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2 font-serif">
            <img src="/logo.png" alt="purelearn.ai Logo" className="h-11 w-auto sm:h-12" />
          </Link>
          <Link to="/auth/sign-in" className="text-sm font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Discover how we secure your academic data and personal preferences.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((sec, idx) => (
            <Card key={idx} className="p-8 bg-elevated/10 border border-border/50 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-foreground">{sec.title}</h3>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm text-muted-foreground leading-relaxed">
                  {p}
                </p>
              ))}
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-3xl px-6 py-8 flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
          <img src="/logo.png" alt="purelearn.ai Logo" className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity" />
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
