import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — purelearn.ai" }] }),
  component: TermsPage,
});

function TermsPage() {
  const sections = [
    {
      title: "1. Agreement to Terms & Conditions",
      paragraphs: [
        "Welcome to purelearn.ai (referred to as the 'Platform', 'we', 'us', or 'our'). By accessing our website, applications, or services, you agree to comply with and be bound by these comprehensive Terms of Service. These terms form a binding legal agreement between you and purelearn.ai. If you do not agree with any part of these terms, you are prohibited from using the Platform.",
        "We reserve the right to review, update, or modify these Terms at any time without prior individual notice. Your continued utilization of our resources following the posting of modifications indicates your active acknowledgment and acceptance of the revised Terms. We encourage all users to check this page periodically for updates."
      ]
    },
    {
      title: "2. Description of Socratic STEM Services",
      paragraphs: [
        "purelearn.ai provides specialized, Socratic-styled artificial intelligence tutoring software designed for mathematics and STEM learning. Our AI tutor acts as a cognitive guide, utilizing prompting techniques that identify conceptual blindspots and offer incremental hints. The service is tailored to facilitate learning masteries rather than automating homework answers.",
        "Under no circumstances is the Platform intended to serve as a tool for academic dishonesty or direct plagiarism. The AI is structurally constrained from outputting complete, copy-pasteable solutions. By using our tools, you agree to engage with the hints in good faith to solve your problems independently."
      ]
    },
    {
      title: "3. Account Registration & Credential Security",
      paragraphs: [
        "To utilize the full features of purelearn.ai, you must create a secure user account. You agree to provide accurate, current, and complete registration information and to maintain the absolute security of your login credentials. You are entirely responsible for all activities that occur under your user account.",
        "If you suspect any unauthorized access, breach, or compromise of your credentials, you must notify purelearn.ai support immediately. We will not be held liable for any loss, breach, or damage arising from your failure to comply with these security obligations."
      ]
    },
    {
      title: "4. Educator Verification & Class Compliance",
      paragraphs: [
        "Educator profiles on purelearn.ai are subject to a rigorous moderation and approval process. Newly registered teacher accounts are placed in a 'pending' state and must be manually verified by our system administrators before unlocking active features. This step ensures that classroom creators are valid representatives of their declared academic institutions.",
        "If an educator account is rejected during this verification check, access to classroom tools, syllabus uploading, and student progress metrics will be strictly blocked. The Platform reserves the right to suspend or revoke verified educator privileges at any time if institutional credentials cannot be verified or are found to be fraudulent."
      ]
    },
    {
      title: "5. Intellectual Property & Document Uploads",
      paragraphs: [
        "Users may upload learning materials, syllabi, and reference files to build localized Socratic contexts. By uploading any document, you represent and warrant that you possess all necessary copyright permissions and rights. You retain ownership of all intellectual property rights in your uploaded materials.",
        "By uploading files, you grant purelearn.ai a limited, non-exclusive, royalty-free license to parse, index, and process your documents solely for the purpose of serving your Socratic tutoring sessions. We do not sell, distribute, or share your documents with third parties without your explicit consent."
      ]
    },
    {
      title: "6. Billing, Payments & Dynamic Seats",
      paragraphs: [
        "Subscriptions to purelearn.ai are billed in advance on a recurring monthly or annual cycle. Educator plans utilize an interactive seat slider model where the billing rate is calculated based on the total active classroom seats selected. All transactions are securely processed through Stripe, and we do not store raw credit card details.",
        "You may upgrade, downgrade, or cancel your seat volume at any time. Downgrading seat counts will apply changes at the end of the current billing cycle, and no partial refunds will be provided for mid-month adjustments. It is the responsibility of the account administrator to manage seat allocations."
      ]
    },
    {
      title: "7. Acceptable Use & Academic Integrity",
      paragraphs: [
        "You agree to use purelearn.ai strictly for lawful, educational purposes. You are prohibited from using the Platform to reverse-engineer prompting rules, bypass AI safety filters, or scrape contents in bulk. Any attempts to inject malicious instructions or disrupt service performance will result in immediate account termination.",
        "We maintain a zero-tolerance policy for academic dishonesty. The Platform is designed as an interactive study companion; using our tools to bypass learning milestones or cheat on live evaluations violates our core educational values and terms of use."
      ]
    },
    {
      title: "8. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, purelearn.ai, its developers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages. This includes, without limitation, loss of grades, academic standing, data, goodwill, or other intangible losses resulting from your access to or use of the services.",
        "We make no warranties or representations regarding the accuracy, completeness, or reliability of the AI-generated responses. Socratic interactions are experimental, and you assume full responsibility for verifying mathematical calculations or source materials prior to academic submission."
      ]
    },
    {
      title: "9. Indemnification",
      paragraphs: [
        "You agree to defend, indemnify, and hold harmless purelearn.ai and its licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your use of the services. This includes any terms violations, copyright infringements in your uploaded files, or academic policy violations.",
        "Your indemnification obligation will survive the termination of your purelearn.ai account or your cessation of use of the service. We reserve the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by you."
      ]
    },
    {
      title: "10. Governing Law & Dispute Resolution",
      paragraphs: [
        "These Terms of Service shall be governed by and construed in accordance with the laws of your local jurisdiction, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or related to these terms must be brought exclusively in courts located within our corporate headquarters region.",
        "Any claim or dispute must be resolved through binding arbitration rather than in court, except where prohibited by consumer protection laws. By agreeing to these Terms, you waive your right to participate in class-action lawsuits or class-wide arbitrations."
      ]
    }
  ];

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
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Please read these terms carefully before utilizing our Socratic learning environment.
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
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
