// =========================================================================
// PureLearn AI - Admin Email Broadcast & Resend Management Portal
// =========================================================================
import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  GraduationCap,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Code,
  ShieldCheck,
  Settings as SettingsIcon,
  Clock,
  History,
  Info,
  Check,
  X,
  ExternalLink,
  Search,
  Filter,
  Download,
  Key,
  Layers,
  HelpCircle,
  FileText,
  User,
  Copy,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Card } from "@/components/ui-kit";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  fetchResendSettings,
  saveResendSettings,
  fetchEmailBroadcastHistory,
  sendEmailBroadcast,
  EMAIL_TEMPLATES,
  formatPureLearnEmailTemplate,
  type EmailBroadcastRecord,
  type ResendSettings,
  type EmailTemplatePreset,
} from "@/lib/resend-email";

export interface AdminEmailUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  approval_status?: string;
}

interface AdminEmailBroadcastsProps {
  usersList: AdminEmailUser[];
  studentCount: number;
  teacherCount: number;
  onRefresh?: () => void;
}

export function AdminEmailBroadcasts({
  usersList,
  studentCount,
  teacherCount,
  onRefresh,
}: AdminEmailBroadcastsProps) {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<"compose" | "history" | "config">("compose");

  // Resend Settings State
  const [settings, setSettings] = useState<ResendSettings>({
    apiKey: "",
    fromEmail: "PureLearn AI <onboarding@resend.dev>",
    replyTo: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Broadcast History State
  const [broadcastHistory, setBroadcastHistory] = useState<EmailBroadcastRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedBroadcastModal, setSelectedBroadcastModal] = useState<EmailBroadcastRecord | null>(
    null,
  );

  // Composer State
  const [audience, setAudience] = useState<"all" | "students" | "teachers" | "specific" | "test">(
    "all",
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState("Open PureLearn AI");
  const [ctaUrl, setCtaUrl] = useState("https://purelearn.ai/app");

  // Live Preview Toggle & Device Mode
  const [previewMode, setPreviewMode] = useState<"editor" | "preview">("editor");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>("announcement");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Send Progress States
  const [isSending, setIsSending] = useState(false);
  const [confirmSendModalOpen, setConfirmSendModalOpen] = useState(false);

  // 1. Initial Load of Resend Settings, Broadcast History, and Current Admin Auth
  const loadInitialData = async () => {
    setIsLoadingSettings(true);
    try {
      const config = await fetchResendSettings();
      setSettings(config);
    } catch (e) {
      console.warn("Failed to load resend config:", e);
    } finally {
      setIsLoadingSettings(false);
    }

    setIsLoadingHistory(true);
    try {
      const history = await fetchEmailBroadcastHistory();
      setBroadcastHistory(history);
    } catch (e) {
      console.warn("Failed to load email history:", e);
    } finally {
      setIsLoadingHistory(false);
    }

    // Auto-detect currently logged in admin email for 1-click test delivery
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setTestEmailAddress((prev) => prev || user.email || "");
      }
    } catch (_authErr) {
      console.warn("Could not retrieve current user email:", _authErr);
    }
  };

  useEffect(() => {
    loadInitialData();
    // Default to Feature Announcement template on first load if empty
    applyTemplate(EMAIL_TEMPLATES[0]);
  }, []);

  // 2. Template Selection Helper
  const applyTemplate = (tpl: EmailTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setSubject(tpl.subject);
    setPreviewText(tpl.previewText);
    setBodyHtml(tpl.content.trim());
    if (tpl.buttonText) {
      setIncludeCta(true);
      setCtaText(tpl.buttonText);
      setCtaUrl(tpl.buttonUrl || "https://purelearn.ai/app");
    } else {
      setIncludeCta(false);
    }
    toast.info(`Loaded "${tpl.name}" template.`);
  };

  // 3. Quick reuse past broadcast in composer
  const handleReuseInComposer = (item: EmailBroadcastRecord) => {
    setSubject(item.subject);
    setPreviewText(item.preview_text || "");
    setBodyHtml(item.body_html || "");
    setAudience(item.target_audience);
    setSelectedTemplateId(null);
    setSelectedBroadcastModal(null);
    setActiveSubTab("compose");
    toast.success("Broadcast loaded into composer! You can edit and send.");
  };

  // 4. Calculate target recipients count
  const getTargetRecipientCount = () => {
    if (audience === "all") return usersList.filter((u) => u.email).length;
    if (audience === "students")
      return usersList.filter((u) => u.role === "student" && u.email).length;
    if (audience === "teachers")
      return usersList.filter((u) => u.role === "teacher" && u.email).length;
    if (audience === "specific") return selectedUserIds.length;
    if (audience === "test") return testEmailAddress ? 1 : 0;
    return 0;
  };

  // 4. Save Resend Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await saveResendSettings(settings);
      if (res.success) {
        if (res.error) {
          toast.success("Resend configuration saved and active!");
          toast.info(res.error, { duration: 6000 });
        } else {
          toast.success("Resend configuration updated successfully in database!");
        }
      } else {
        toast.error(res.error || "Failed to save configuration.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update configuration.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 5. Send Test Email
  const handleSendTestEmail = async () => {
    const targetEmail =
      testEmailAddress.trim() ||
      currentUserEmail ||
      prompt("Enter email address to send test email to:");
    if (!targetEmail || !targetEmail.includes("@")) {
      toast.error("Please provide a valid email address for test delivery.");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject line before testing.");
      return;
    }

    setIsSending(true);
    const toastId = toast.loading(`Sending test email to ${targetEmail}...`);

    try {
      const result = await sendEmailBroadcast({
        subject: `[TEST] ${subject}`,
        preview_text: previewText,
        html: bodyHtml,
        audience: "test",
        to: [targetEmail],
        from: settings.fromEmail,
        reply_to: settings.replyTo,
        apiKey: settings.apiKey,
        buttonText: includeCta && ctaText ? ctaText : undefined,
        buttonUrl: includeCta && ctaUrl ? ctaUrl : undefined,
      });

      if (result.success) {
        toast.success(`Test email sent successfully to ${targetEmail}! Check your inbox.`, {
          id: toastId,
        });
        // Refresh history
        const updated = await fetchEmailBroadcastHistory();
        setBroadcastHistory(updated);
      } else {
        toast.error(`Test send failed: ${result.error}`, { id: toastId, duration: 6000 });
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Error: ${error.message || "Could not dispatch test email."}`, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // 6. Execute Mass Broadcast
  const handleExecuteBroadcast = async () => {
    setConfirmSendModalOpen(false);
    const recipientCount = getTargetRecipientCount();

    if (recipientCount === 0) {
      toast.error("No valid recipients found for this audience.");
      return;
    }

    setIsSending(true);
    const toastId = toast.loading(`Broadcasting email to ${recipientCount} recipients...`);

    try {
      const result = await sendEmailBroadcast({
        subject: subject.trim(),
        preview_text: previewText.trim(),
        html: bodyHtml,
        audience: audience,
        userIds: audience === "specific" ? selectedUserIds : undefined,
        to: audience === "test" && testEmailAddress ? [testEmailAddress] : undefined,
        from: settings.fromEmail,
        reply_to: settings.replyTo,
        apiKey: settings.apiKey,
        buttonText: includeCta && ctaText ? ctaText : undefined,
        buttonUrl: includeCta && ctaUrl ? ctaUrl : undefined,
      });

      if (result.success) {
        toast.success(
          result.message || `Successfully dispatched broadcast to ${result.sentCount} recipients!`,
          { id: toastId, duration: 5000 },
        );
        // Refresh history and switch to history tab
        const updated = await fetchEmailBroadcastHistory();
        setBroadcastHistory(updated);
        setActiveSubTab("history");
        if (onRefresh) onRefresh();
      } else {
        toast.error(`Broadcast error: ${result.error}`, { id: toastId, duration: 7000 });
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Failed: ${error.message || "Failed to complete email broadcast."}`, {
        id: toastId,
      });
    } finally {
      setIsSending(false);
    }
  };

  // 7. Filtered History List
  const filteredHistory = broadcastHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      item.subject?.toLowerCase().includes(q) ||
      item.target_audience?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  // Filtered Users for Specific User Picker
  const selectableUsers = usersList.filter((u) => {
    if (!userSearchText.trim()) return true;
    const q = userSearchText.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Export History to CSV
  const exportHistoryCsv = () => {
    if (broadcastHistory.length === 0) {
      toast.info("No email broadcast records available to export.");
      return;
    }
    const headers = ["ID", "Subject", "Audience", "Recipients Count", "Status", "Date", "Error"];
    const rows = broadcastHistory.map((b) => [
      b.id,
      b.subject,
      b.target_audience,
      b.recipient_count,
      b.status,
      new Date(b.created_at).toLocaleString(),
      b.error_message || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => `"${String(field || "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purelearn_email_broadcasts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exported email broadcasts log to CSV!");
  };

  // Computed Full Preview HTML (Strict Black and White Buttons & Typography)
  const compiledPreviewHtml = formatPureLearnEmailTemplate({
    title: subject || "Announcement Subject Line",
    previewText: previewText || "Email preview preheader snippet",
    content: bodyHtml || "<p>Your email content will appear here...</p>",
    buttonText: includeCta && ctaText ? ctaText : undefined,
    buttonUrl: includeCta && ctaUrl ? ctaUrl : undefined,
  });

  // Word count & reading time calculation
  const plainTextContent = bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainTextContent ? plainTextContent.split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  const isResendConfigured = Boolean(settings.apiKey && settings.apiKey.trim().startsWith("re_"));

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Reachable Email Audience */}
        <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Email Audience
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">
              {usersList.filter((u) => u.email).length}
            </span>
            <span className="text-xs text-muted-foreground ml-2">verified contacts</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-indigo-400 font-semibold">{studentCount} Students</span>
            <span>&bull;</span>
            <span className="text-violet-400 font-semibold">{teacherCount} Teachers</span>
          </div>
        </Card>

        {/* Metric 2: Total Broadcasts Dispatched */}
        <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Broadcasts Sent
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground">{broadcastHistory.length}</span>
            <span className="text-xs text-muted-foreground ml-2">campaigns logged</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {broadcastHistory.reduce((acc, curr) => acc + (curr.recipient_count || 0), 0)} total
            emails delivered
          </p>
        </Card>

        {/* Metric 3: Resend Engine Status */}
        <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Resend Delivery
            </span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isResendConfigured
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {isResendConfigured ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isResendConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-sm font-bold text-foreground">
              {isResendConfigured ? "Connected & Ready" : "API Key Required"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {isResendConfigured ? settings.fromEmail : "Configure key in Settings tab"}
          </p>
        </Card>

        {/* Metric 4: Edge Function Architecture */}
        <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Infrastructure
            </span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-foreground">Supabase Edge Engine</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Non-blocking batch queue &bull; Resend REST v1
          </p>
        </Card>
      </div>

      {/* ── SUB-NAVIGATION TABS ── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("compose")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "compose"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Compose Broadcast
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Broadcast History ({broadcastHistory.length})
          </button>

          <button
            onClick={() => setActiveSubTab("config")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "config"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Resend & Sender Config
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "history" && (
            <button
              onClick={exportHistoryCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}

          <button
            onClick={loadInitialData}
            disabled={isLoadingSettings || isLoadingHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold transition-colors"
            title="Refresh emails and settings"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoadingSettings || isLoadingHistory ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── 1. COMPOSE BROADCAST TAB ─────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeSubTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Controls, Audience, Templates & Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Missing Resend Key Warning Banner */}
            {!isResendConfigured && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">Resend API Key Not Configured</div>
                    <p className="text-muted-foreground mt-0.5">
                      To send emails to your users, you need to add your Resend API Key.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("config")}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:opacity-90 shrink-0 transition-opacity"
                >
                  Configure Key &rarr;
                </button>
              </div>
            )}

            {/* Dev Mode Sandbox Notice */}
            {settings.fromEmail.includes("onboarding@resend.dev") && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs shadow-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-500 flex items-center gap-2">
                    Resend Development Mode Active (onboarding@resend.dev)
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Resend free development mode restricts sending exclusively to the{" "}
                    <strong className="text-foreground">
                      email address registered with your Resend account
                    </strong>
                    . To send test emails right away, select{" "}
                    <strong className="text-foreground">Test / Custom Email</strong> below and enter
                    your Resend account email.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Select Target Audience */}
            <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="flex h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-black items-center justify-center">
                      1
                    </span>
                    Target Audience
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose which segment of users will receive this email broadcast.
                  </p>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {getTargetRecipientCount()} Recipients Selected
                </span>
              </div>

              {/* Audience Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Option: All Users */}
                <button
                  type="button"
                  onClick={() => setAudience("all")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "all"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Users className="h-4 w-4 text-indigo-400" />
                    {audience === "all" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">All Registered</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {usersList.filter((u) => u.email).length} users
                  </div>
                </button>

                {/* Option: Students Only */}
                <button
                  type="button"
                  onClick={() => setAudience("students")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "students"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <GraduationCap className="h-4 w-4 text-emerald-400" />
                    {audience === "students" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">Students Only</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {studentCount} learners
                  </div>
                </button>

                {/* Option: Teachers Only */}
                <button
                  type="button"
                  onClick={() => setAudience("teachers")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "teachers"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Presentation className="h-4 w-4 text-violet-400" />
                    {audience === "teachers" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">Teachers Only</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {teacherCount} educators
                  </div>
                </button>

                {/* Option: Specific Selected Users */}
                <button
                  type="button"
                  onClick={() => setAudience("specific")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    audience === "specific"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Filter className="h-4 w-4 text-amber-400" />
                    {audience === "specific" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">Specific Pick</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedUserIds.length} picked
                  </div>
                </button>

                {/* Option: Single Test Email */}
                <button
                  type="button"
                  onClick={() => setAudience("test")}
                  className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-2 ${
                    audience === "test"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/60 bg-background/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    {audience === "test" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">Test / Custom Email</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Send to a single test address
                  </div>
                </button>
              </div>

              {/* Sub-section: Specific User Selector Picker */}
              {audience === "specific" && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Select specific recipients ({selectedUserIds.length} chosen)
                    </span>
                    {selectedUserIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        className="text-[11px] text-destructive hover:underline font-semibold"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      placeholder="Search users by name, email, or role..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {selectableUsers.slice(0, 50).map((u) => {
                      const isChecked = selectedUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/60 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds((prev) => [...prev, u.id]);
                                } else {
                                  setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <div className="truncate">
                              <span className="font-semibold text-foreground">
                                {u.name || "User"}
                              </span>
                              <span className="text-muted-foreground text-[11px] ml-1.5">
                                ({u.email})
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {u.role}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-section: Test Email Input */}
              {audience === "test" && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Direct Test Email Address
                    </label>
                    {currentUserEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          setTestEmailAddress(currentUserEmail);
                          toast.info(`Set test email to ${currentUserEmail}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <User className="h-3 w-3" />
                        Use My Logged-in Email ({currentUserEmail})
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="e.g. admin@yourdomain.com or your-resend-account@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    💡 If using Resend free sandbox (<code>onboarding@resend.dev</code>), send only
                    to the email address tied to your Resend account.
                  </p>
                </div>
              )}
            </Card>

            {/* Step 2: Choose Template Preset */}
            <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="flex h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-black items-center justify-center">
                      2
                    </span>
                    Template Presets
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click a preset to quickly fill in professionally written announcement content.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMAIL_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`p-2.5 rounded-xl border text-left transition-all group relative ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                          : "border-border/60 bg-background/50 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div
                          className={`text-xs font-bold truncate transition-colors ${
                            isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                          }`}
                        >
                          {tpl.name}
                        </div>
                        {isSelected && <Check className="h-3 w-3 text-primary shrink-0 ml-1" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {tpl.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Step 3: Email Subject & Content Inputs */}
            <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="flex h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-black items-center justify-center">
                  3
                </span>
                Email Composition
              </h3>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Subject Line <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {subject.length} characters
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 🚀 Exciting PureLearn Platform Update..."
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              {/* Preheader / Preview Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Preheader Text (Inbox Snippet)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Shows beside subject in Gmail/Apple Mail
                  </span>
                </div>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="e.g. Discover the latest tools built to enhance your learning..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Body Content Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Email Body HTML Content <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span>&bull;</span>
                    <span>~{estimatedReadTime} min read</span>
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>Write your email announcement message here...</p>"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Supports HTML tags (&lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc.)</span>
                  <span className="font-semibold text-foreground">
                    White body &bull; Black text &bull; Black buttons
                  </span>
                </div>
              </div>

              {/* Call to Action Button Toggle */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cta-toggle"
                      checked={includeCta}
                      onChange={(e) => setIncludeCta(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="cta-toggle"
                      className="text-xs font-bold text-foreground cursor-pointer select-none"
                    >
                      Include Call-to-Action Button in Email
                    </label>
                  </div>
                  <span className="text-[11px] text-primary font-semibold">Recommended</span>
                </div>

                {includeCta && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. Open PureLearn AI"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Destination Link URL
                      </label>
                      <input
                        type="url"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://purelearn.ai/app"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSending || !subject.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Send Test Email First
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmSendModalOpen(true)}
                  disabled={isSending || !subject.trim() || getTargetRecipientCount() === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground hover:opacity-95 text-xs font-black tracking-wide uppercase transition-all shadow-md disabled:opacity-50"
                >
                  <Send className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`} />
                  {isSending
                    ? "Dispatching..."
                    : `Broadcast to ${getTargetRecipientCount()} Recipients`}
                </button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Live Responsive Email Preview Mockup (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <Card className="p-4 border-border/60 bg-card/60 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Live Email Preview
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/60 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold transition-all ${
                        previewDevice === "desktop"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Desktop view (600px)"
                    >
                      <Monitor className="h-3 w-3" />
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold transition-all ${
                        previewDevice === "mobile"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Mobile view (375px)"
                    >
                      <Smartphone className="h-3 w-3" />
                      Mobile
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(compiledPreviewHtml);
                      toast.success("Email HTML code copied to clipboard!");
                    }}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy Email HTML"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Email Envelope Header */}
              <div className="bg-background/90 border border-border/80 rounded-xl p-3 text-xs space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold w-12 shrink-0">From:</span>
                  <span className="text-foreground font-mono truncate">{settings.fromEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold w-12 shrink-0">To:</span>
                  <span className="text-foreground font-medium truncate">
                    {audience === "all" && "All PureLearn AI Members"}
                    {audience === "students" && "Enrolled Students"}
                    {audience === "teachers" && "Verified Educators"}
                    {audience === "specific" && `${selectedUserIds.length} Selected Users`}
                    {audience === "test" && (testEmailAddress || "Test Recipient")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold w-12 shrink-0">
                    Subject:
                  </span>
                  <span className="text-foreground font-bold truncate">
                    {subject || "(No subject provided yet)"}
                  </span>
                </div>
              </div>

              {/* Responsive Email Sandbox Rendering */}
              <div
                className={`rounded-xl border border-border/80 overflow-hidden bg-[#f4f4f5] shadow-md transition-all duration-300 mx-auto ${
                  previewDevice === "mobile" ? "max-w-[375px]" : "w-full"
                }`}
              >
                <iframe
                  title="Email Preview"
                  srcDoc={compiledPreviewHtml}
                  className="w-full h-[520px] border-none bg-transparent"
                  sandbox="allow-same-origin"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-black border border-white" />
                  White body &bull; Black text &bull; Black buttons
                </span>
                <span>Gmail &bull; Apple Mail &bull; Outlook</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── 2. BROADCAST HISTORY TAB ─────────────────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeSubTab === "history" && (
        <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Email Broadcast Logs & Delivery History
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete audit trail of all messages sent through Resend Edge Functions.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filter history by subject or audience..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border/80 rounded-xl space-y-3">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <h4 className="text-sm font-bold text-foreground">No Broadcasts Logged Yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Sent announcements and test emails will automatically appear here with timestamps
                and recipient delivery counts.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab("compose")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                Compose First Broadcast
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/60 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Recipients</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dispatched At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground line-clamp-1">
                          {item.subject}
                        </div>
                        {item.preview_text && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.preview_text}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                          {item.target_audience}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {item.recipient_count}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === "sent"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.status === "partial"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                          }`}
                        >
                          {item.status === "sent" && <Check className="h-3 w-3" />}
                          {item.status === "failed" && <X className="h-3 w-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleReuseInComposer(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors"
                          title="Copy into composer to edit or resend"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reuse
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBroadcastModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── 3. RESEND & SENDER CONFIGURATION TAB ─────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeSubTab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 border-border/60 bg-card/60 backdrop-blur-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Resend API Credentials & Sender Settings
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure your Resend API Key to empower the Supabase Edge Functions with reliable
                  email transmission.
                </p>
              </div>

              {/* Resend API Key Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Resend API Key <span className="text-destructive">*</span>
                  </label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Get Key from Resend <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => setSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="re_123456789_abcdef..."
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Starts with <code>re_</code>. This key is securely saved to Supabase{" "}
                  <code>system_settings</code> and accessed by Edge Functions.
                </p>
              </div>

              {/* Default Sender Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Default Sender ("From" Header)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        fromEmail: "PureLearn AI <onboarding@resend.dev>",
                      }))
                    }
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Reset to onboarding@resend.dev
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.fromEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="PureLearn AI <onboarding@resend.dev>"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Using <code>onboarding@resend.dev</code> allows instant testing without domain
                  setup. Emails are sent to your verified Resend account address.
                </p>
              </div>

              {/* Reply-To Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Reply-To Address (Optional)
                </label>
                <input
                  type="email"
                  value={settings.replyTo}
                  onChange={(e) => setSettings((prev) => ({ ...prev, replyTo: e.target.value }))}
                  placeholder="support@purelearn.ai"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Save Settings Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className={`h-4 w-4 ${isSavingSettings ? "animate-spin" : ""}`} />
                  {isSavingSettings ? "Saving Settings..." : "Save Resend Configuration"}
                </button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Resend Sandbox & Edge Function Deployment Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 border-border/60 bg-card/60 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Info className="h-4 w-4" />
                Resend Sending Guide
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Sandbox Notice (onboarding@resend.dev)
                  </div>
                  Resend free accounts start in sandbox mode, which allows sending emails{" "}
                  <strong>only to the email address registered with your Resend account</strong>.
                </div>

                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    Sending to All Users
                  </div>
                  To deliver emails to any student or teacher, navigate to your{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold"
                  >
                    Resend Domains Dashboard
                  </a>{" "}
                  and add DNS records for your custom domain (e.g. <code>mail.purelearn.ai</code>).
                </div>

                <div className="p-3 rounded-lg bg-background border border-border/80 space-y-2">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-primary shrink-0" />
                    Deploy Edge Function to Supabase
                  </div>
                  <p className="text-[11px]">
                    The edge function is already prepared in{" "}
                    <code>supabase/functions/send-email/index.ts</code>. Deploy it to your remote
                    Supabase project with:
                  </p>
                  <pre className="p-2 rounded bg-muted/80 text-[11px] font-mono text-foreground overflow-x-auto select-all">
                    npx supabase functions deploy send-email
                  </pre>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── MODAL: CONFIRM MASS BROADCAST DISPATCH ────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {confirmSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-md w-full p-6 border-border shadow-2xl bg-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Confirm Mass Email Broadcast
                </h3>
                <p className="text-xs text-muted-foreground">
                  Please review the campaign details before dispatching.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audience:</span>
                <span className="font-bold text-foreground uppercase">{audience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Recipients:</span>
                <span className="font-bold text-primary text-sm">
                  {getTargetRecipientCount()} contacts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-semibold text-foreground text-right truncate max-w-[200px]">
                  {subject}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">From Address:</span>
                <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                  {settings.fromEmail}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Emails will be immediately dispatched through Resend. Recipients will receive this
              message directly in their inboxes.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBroadcast}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-md"
              >
                Yes, Send Broadcast Now
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── MODAL: VIEW PAST BROADCAST DETAILS ────────────────────── */}
      {/* ──────────────────────────────────────────────────────────── */}
      {selectedBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-2xl w-full p-6 border-border shadow-2xl bg-card space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {selectedBroadcastModal.subject}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sent on {new Date(selectedBroadcastModal.created_at).toLocaleString()} &bull;{" "}
                  {selectedBroadcastModal.recipient_count} recipients
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBroadcastModal(null)}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-[#f1f5f9] p-2 min-h-[350px]">
              <iframe
                title="Broadcast Content Preview"
                srcDoc={selectedBroadcastModal.body_html}
                className="w-full h-full min-h-[350px] border-none bg-transparent"
                sandbox="allow-same-origin"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleReuseInComposer(selectedBroadcastModal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reuse & Edit in Composer
              </button>
              <button
                type="button"
                onClick={() => setSelectedBroadcastModal(null)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-bold"
              >
                Close View
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
