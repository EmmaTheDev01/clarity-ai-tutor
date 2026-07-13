import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/gdpr")({
  head: () => ({ meta: [{ title: "GDPR Compliance — purelearn.ai" }] }),
  component: GDPRPage,
});

function GDPRPage() {
  const sections = [
    {
      title: "1. GDPR Alignment & Core Objectives",
      paragraphs: [
        "purelearn.ai is fully committed to aligning its data practices with the European Union's General Data Protection Regulation (GDPR). We recognize that data sovereignty is a fundamental right for all users, particularly in digital learning environments. This page explains how we implement GDPR mandates.",
        "Our operations are structured around the principles of data minimization, purpose limitation, and storage limitation. We process your data transparently, ensuring you have clear visibility into how Socratic tutoring models utilize your inputs."
      ]
    },
    {
      title: "2. Lawful Basis for Processing Data",
      paragraphs: [
        "Under GDPR Article 6, we process your personal data based on your explicit consent, which is requested at the time of account creation. We also process data as necessary for the performance of our contract with you to deliver personalized tutoring services.",
        "For specific educational operations, processing is based on the legitimate interests of verified academic institutions to audit classroom compliance and track study milestones. We ensure that our processing activities do not override your privacy rights."
      ]
    },
    {
      title: "3. Right of Access (Article 15)",
      paragraphs: [
        "As a user under GDPR protection, you possess the right to obtain confirmation as to whether your personal data is being processed. You have the right to access the specific categories of data we store, including notes, quiz results, and focus mode preferences.",
        "We allow users to inspect their stored information directly through their dashboards. If you require a formal comprehensive summary of your processed data, you may contact our compliance team to receive a response within thirty days."
      ]
    },
    {
      title: "4. Right to Rectification (Article 16)",
      paragraphs: [
        "If you discover that any personal details or settings associated with your profile are inaccurate or incomplete, you have the right to request immediate correction. You can manage and edit your profile details, institution name, and email details inside the Settings page.",
        "If certain institutional records or teacher verification fields cannot be modified directly through the user interface, you can submit a rectification request to verification@purelearn.ai. We will update the corresponding database records without undue delay."
      ]
    },
    {
      title: "5. Right to Erasure / Right to be Forgotten (Article 17)",
      paragraphs: [
        "GDPR Article 17 grants you the right to have your personal data erased from our active servers under specific conditions. You may initiate complete profile erasure from the Settings panel, which executes database-level cascade triggers to erase all your records.",
        "Following an account deletion request, your profile, document lists, note shares, and Socratic chat histories are permanently purged from our active databases. Backups are cleared in accordance with our system rotation policies, typically within ninety days."
      ]
    },
    {
      title: "6. Right to Restrict Processing (Article 18)",
      paragraphs: [
        "You have the right to request that we restrict the processing of your data in scenarios where you contest its accuracy, or object to Legitimate Interest bases. Under restriction, we store your records but do not process them for Socratic tutoring or analytics.",
        "To exercise this restriction right, please submit a written request outlining your specific concerns. We will evaluate the request and apply temporary processing blocks while resolving any contested details."
      ]
    },
    {
      title: "7. Right to Data Portability (Article 20)",
      paragraphs: [
        "You possess the right to receive your personal data in a structured, commonly used, and machine-readable format. This allows you to transfer your notes, documents, and learning logs to other platforms without hindrance.",
        "purelearn.ai facilitates data portability by providing a direct export utility for notes and files. You can request a full JSON data dump of your study history by contacting our compliance portal."
      ]
    },
    {
      title: "8. Right to Object (Article 21)",
      paragraphs: [
        "You have the right to object at any time to the processing of your personal data based on our legitimate interest arguments. If you object, we will cease processing unless we demonstrate compelling legitimate grounds that override your interests.",
        "We do not engage in direct marketing or profiling activities. If you object to specific performance tracking, you can adjust your tracking preferences or deactivate optional study streak logs in your profile settings."
      ]
    },
    {
      title: "9. Data Protection Officer (Article 37)",
      paragraphs: [
        "To ensure compliance with GDPR mandates, purelearn.ai has appointed a dedicated Data Protection Officer (DPO). The DPO monitors our data protection strategies and acts as the primary contact for EU supervisory authorities and users.",
        "You can contact our Data Protection Officer directly at gdpr@purelearn.ai for any inquiries regarding this document, data processing audits, or to exercise your rights. All inquiries are treated with high priority."
      ]
    },
    {
      title: "10. Cross-Border Data Transfers & SCCs",
      paragraphs: [
        "For EU users, personal data collected by purelearn.ai may be transferred to servers located outside the European Economic Area (EEA), primarily in the United States, to perform necessary cloud database and AI processing.",
        "To ensure your information remains protected during cross-border transfers, we implement Standard Contractual Clauses (SCCs) approved by the European Commission with our data processors, including Supabase and Google Cloud. This guarantees equivalent privacy protection."
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
          <Link to="/auth/sign-in" className="text-xs font-semibold px-4 py-2 rounded-lg border border-border hover:bg-muted transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            GDPR Compliance
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Understand your rights and data protections under the General Data Protection Regulation.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((sec, idx) => (
            <Card key={idx} className="p-8 bg-elevated/10 border border-border/50 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-foreground">{sec.title}</h3>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-xs text-muted-foreground leading-relaxed">
                  {p}
                </p>
              ))}
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background/50">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} purelearn.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
