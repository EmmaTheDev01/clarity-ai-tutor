// =========================================================================
// PureLearn AI - Resend Mailing & Broadcast Service
// =========================================================================
import { supabase } from "@/lib/supabase";

export interface EmailBroadcastRecord {
  id: string;
  subject: string;
  preview_text?: string;
  body_html: string;
  body_text?: string;
  target_audience: "all" | "students" | "teachers" | "specific" | "test";
  recipient_count: number;
  recipients?: string[];
  status: "draft" | "sending" | "sent" | "partial" | "failed";
  sent_by?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SendEmailBroadcastOptions {
  subject: string;
  preview_text?: string;
  html: string;
  text?: string;
  audience: "all" | "students" | "teachers" | "specific" | "test";
  to?: string | string[];
  userIds?: string[];
  from?: string;
  reply_to?: string;
  apiKey?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface ResendSettings {
  apiKey: string;
  fromEmail: string;
  replyTo: string;
}

// 1. Fetch Resend Configuration from system_settings with localStorage fallback
export async function fetchResendSettings(): Promise<ResendSettings> {
  const result: ResendSettings = {
    apiKey: "",
    fromEmail: "PureLearn AI <onboarding@resend.dev>",
    replyTo: "",
  };

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["resend_api_key", "resend_from_email", "resend_reply_to"]);

    if (!error && data) {
      for (const row of data) {
        if (row.key === "resend_api_key" && row.value) result.apiKey = row.value;
        if (row.key === "resend_from_email" && row.value) result.fromEmail = row.value;
        if (row.key === "resend_reply_to" && row.value) result.replyTo = row.value;
      }
    }
  } catch (err) {
    console.warn("Could not fetch resend settings from db:", err);
  }

  // Fallback to localStorage if not found in db
  if (typeof localStorage !== "undefined") {
    if (!result.apiKey) {
      result.apiKey = localStorage.getItem("resend_api_key") || "";
    }
    const localFrom = localStorage.getItem("resend_from_email");
    if (localFrom && result.fromEmail === "PureLearn AI <onboarding@resend.dev>") {
      result.fromEmail = localFrom;
    }
    const localReply = localStorage.getItem("resend_reply_to");
    if (localReply && !result.replyTo) {
      result.replyTo = localReply;
    }
  }

  return result;
}

// 2. Save Resend Configuration to system_settings & localStorage
export async function saveResendSettings(
  settings: Partial<ResendSettings>,
): Promise<{ success: boolean; error?: string }> {
  // Always update local cache first for 100% immediate reliability
  if (typeof localStorage !== "undefined") {
    if (settings.apiKey !== undefined) {
      localStorage.setItem("resend_api_key", settings.apiKey.trim());
    }
    if (settings.fromEmail !== undefined) {
      localStorage.setItem("resend_from_email", settings.fromEmail.trim());
    }
    if (settings.replyTo !== undefined) {
      localStorage.setItem("resend_reply_to", settings.replyTo.trim());
    }
  }

  try {
    const updates = [];
    if (settings.apiKey !== undefined) {
      updates.push({
        key: "resend_api_key",
        value: settings.apiKey.trim(),
        updated_at: new Date().toISOString(),
      });
    }
    if (settings.fromEmail !== undefined) {
      updates.push({
        key: "resend_from_email",
        value: settings.fromEmail.trim(),
        updated_at: new Date().toISOString(),
      });
    }
    if (settings.replyTo !== undefined) {
      updates.push({
        key: "resend_reply_to",
        value: settings.replyTo.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    for (const item of updates) {
      const { error } = await supabase
        .from("system_settings")
        .upsert(item, { onConflict: "key" });
      if (error) throw error;
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Database upsert failed for system_settings:", error);

    // If RLS blocked database save, we still saved it locally so the UI can send emails without interruption
    if (
      error.message?.includes("row-level security") ||
      error.message?.includes("violates") ||
      error.message?.includes("policy")
    ) {
      return {
        success: true,
        error:
          "Config saved locally for this session. (To save permanently to Supabase DB, push the RLS migration).",
      };
    }
    return { success: false, error: error.message || "Failed to save settings." };
  }
}

// 3. Fetch past email broadcasts with seamless table + fallback support
export async function fetchEmailBroadcastHistory(): Promise<EmailBroadcastRecord[]> {
  try {
    // Attempt to query primary table
    const { data, error } = await supabase
      .from("email_broadcasts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data as EmailBroadcastRecord[];
    }
  } catch (e) {
    // Ignore and proceed to fallback
  }

  // Graceful fallback: check system_settings backup key
  try {
    const { data: histRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "email_broadcast_history")
      .maybeSingle();

    if (histRow?.value) {
      return JSON.parse(histRow.value) as EmailBroadcastRecord[];
    }
  } catch (err) {
    console.warn("Could not load broadcast history from system_settings:", err);
  }

  return [];
}

// 4. Send Email Broadcast via Supabase Edge Function
// NOTE: The direct browser-to-Resend fallback was removed because browsers cannot call
// api.resend.com directly (CORS restriction). All sending must go through the edge function.
export async function sendEmailBroadcast(options: SendEmailBroadcastOptions): Promise<{
  success: boolean;
  sentCount?: number;
  totalRecipients?: number;
  message?: string;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      subject: options.subject,
      preview_text: options.preview_text,
      html: options.html,
      text: options.text,
      audience: options.audience,
      to: options.to,
      userIds: options.userIds,
      from: options.from,
      reply_to: options.reply_to,
      apiKey: options.apiKey,
      buttonText: options.buttonText,
      buttonUrl: options.buttonUrl,
    },
  });

  if (error) {
    // Extract a helpful message from the FunctionsHttpError context
    let msg = error.message || "Edge function invocation failed.";
    try {
      // FunctionsHttpError exposes the response body via error.context
      const ctx = (error as any).context;
      if (ctx) {
        const json = typeof ctx === "string" ? JSON.parse(ctx) : ctx;
        if (json?.error) msg = json.error;
      }
    } catch (_) {/* ignore parse errors */}
    return { success: false, error: msg };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  if (data?.success) {
    return {
      success: true,
      sentCount: data.sentCount,
      totalRecipients: data.totalRecipients,
      message: data.message || `Successfully sent to ${data.sentCount} recipient(s).`,
    };
  }

  return { success: false, error: "Unknown email dispatch state." };
}

// 4b. Send Transactional Email via the dedicated edge function (no admin role required)
export async function sendTransactionalEmail(params: {
  type: "welcome_student" | "welcome_teacher" | "educator_approved" | "educator_rejected" | "custom";
  to: string;
  name?: string;
  subject?: string;
  html?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  apiKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("send-transactional-email", {
    body: params,
  });

  if (error) {
    let msg = error.message || "Transactional email failed.";
    try {
      const ctx = (error as any).context;
      if (ctx) {
        const json = typeof ctx === "string" ? JSON.parse(ctx) : ctx;
        if (json?.error) msg = json.error;
      }
    } catch (_) {/* ignore */}
    return { success: false, error: msg };
  }

  if (data?.error) return { success: false, error: data.error };
  if (data?.success) return { success: true };

  return { success: false, error: "Unknown transactional email state." };
}

// Helper: Formats user-friendly explanation when Resend sandbox restrictions trigger
function parseResendErrorMessage(rawMsg: string, fromEmail: string): string {
  if (
    rawMsg.includes("only send testing emails to your own email address") ||
    rawMsg.includes("validation_error") ||
    rawMsg.toLowerCase().includes("testing emails")
  ) {
    return `Resend Sandbox Restriction: Because your sender is set to "${fromEmail}", Resend only permits sending to your registered Resend account email address. Use the "Test / Custom Email" option with your account email to test, or verify your domain at resend.com/domains to send to any user.`;
  }
  return rawMsg;
}

// ---- sendDirectViaResend was removed. Direct browser→Resend calls are blocked by CORS.
// ---- All email sending must go through Supabase Edge Functions which run server-side.

// Kept for backward compat — immediately returns error explaining the situation
async function sendDirectViaResend(_options: SendEmailBroadcastOptions): Promise<{
  success: boolean;
  sentCount?: number;
  totalRecipients?: number;
  message?: string;
  error?: string;
  usedFallback?: boolean;
}> {
  return {
    success: false,
    error:
      "Direct browser-to-Resend is blocked by CORS. Deploy the 'send-email' Supabase Edge Function to enable email sending.",
  };
}

// 5. Rich Built-in Templates
export interface EmailTemplatePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  previewText: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}

export const EMAIL_TEMPLATES: EmailTemplatePreset[] = [
  {
    id: "announcement",
    name: "Feature Announcement",
    category: "Product Updates",
    description: "Inform users of major platform features, model updates, or tool improvements.",
    subject: "🚀 Exciting Platform Update: New Learning Tools Now Live on PureLearn AI",
    previewText: "Discover new features designed to help you study smarter and faster.",
    content: `
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Hello PureLearn Learner,</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">We are thrilled to share our latest platform update, bringing powerful new tools to elevate your personalized learning experience:</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 4px solid #000000; padding: 18px 20px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 10px; color: #000000; font-size: 15px; font-weight: 700;">✨ What's New:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #09090b; font-size: 14px; line-height: 1.7;">
          <li><strong>Smart Tablet Scratchpad:</strong> Draw, sketch math equations, and receive instant AI step-by-step socratic breakdown.</li>
          <li><strong>Audio Socratic Tutor:</strong> Real-time voice interaction with active pacing adapted to your learning style.</li>
          <li><strong>Enhanced Memory Retention:</strong> Upgraded flashcard scheduling based on active cognitive recall.</li>
        </ul>
      </div>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Log in now to test out these updates and continue progressing through your learning goals!</p>
    `,
    buttonText: "Open PureLearn Dashboard",
    buttonUrl: "https://purelearn.ai/app",
  },
  {
    id: "maintenance",
    name: "System Maintenance Notice",
    category: "System Alerts",
    description: "Notify users of planned system upgrades or scheduled downtime.",
    subject: "⚙️ Scheduled System Maintenance Notice — PureLearn AI",
    previewText:
      "Planned maintenance scheduled for this weekend. Brief service interruption expected.",
    content: `
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Dear PureLearn Member,</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">To ensure maximum platform speed, database security, and AI inference performance, our infrastructure team will be performing scheduled maintenance.</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 4px solid #000000; padding: 18px 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #000000; font-weight: 700; font-size: 15px;">🕒 Maintenance Window:</p>
        <p style="margin: 0; color: #09090b; font-size: 14px; line-height: 1.6;"><strong>Date:</strong> Sunday, 02:00 AM – 03:00 AM UTC<br><strong>Expected Impact:</strong> Brief read-only access to study materials for approximately 15 minutes.</p>
      </div>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">All your notes, flashcards, streaks, and quiz progress remain completely safe. We appreciate your patience as we make PureLearn even better.</p>
    `,
    buttonText: "Check System Status",
    buttonUrl: "https://purelearn.ai",
  },
  {
    id: "motivation",
    name: "Weekly Study Motivation",
    category: "Engagement",
    description: "Inspire students to maintain their learning streak and review flashcards.",
    subject: "🔥 Keep Your Study Streak Alive! Your Weekly PureLearn Check-in",
    previewText: "10 minutes of daily active recall beats 5 hours of cramming.",
    content: `
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Consistency is the secret to mastering difficult concepts. Did you know that reviewing just <strong>5 flashcards a day</strong> reinforces long-term memory retention by over 80%?</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; padding: 22px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <span style="font-size: 36px; display: block; margin-bottom: 8px;">🎯</span>
        <h3 style="margin: 0 0 8px; color: #000000; font-size: 17px; font-weight: 700;">Your Weekly Challenge</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.5;">Complete 1 quick quiz or review 10 cards to maintain your learning streak and earn bonus XP.</p>
      </div>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Take a 5-minute study break now and test your understanding with your AI tutor.</p>
    `,
    buttonText: "Start 5-Minute Session",
    buttonUrl: "https://purelearn.ai/app",
  },
  {
    id: "welcome",
    name: "Welcome & Onboarding Guide",
    category: "Onboarding",
    description: "Welcome new learners and guide them to their first study session.",
    subject: "🎓 Welcome to PureLearn AI — Your Personalized AI Socratic Tutor",
    previewText: "Here is your 3-step quick start guide to mastering any subject.",
    content: `
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Welcome to <strong>PureLearn AI / Clarity AI Tutor</strong>!</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">We are thrilled to have you here. PureLearn adapts specifically to how your brain learns best — whether you have ADHD, dyslexia, or prefer high-focus visual cards.</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-left: 4px solid #000000; padding: 18px 22px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 12px; color: #000000; font-size: 15px; font-weight: 700;">🚀 3 Steps to Get Started:</h4>
        <ol style="margin: 0; padding-left: 20px; color: #09090b; font-size: 14px; line-height: 1.75;">
          <li><strong>Upload your course material:</strong> Upload PDFs, slide decks, or lecture notes.</li>
          <li><strong>Generate Flashcards & Quizzes:</strong> Let AI create instant active recall decks grounded strictly in your syllabus.</li>
          <li><strong>Ask Socratic Questions:</strong> Instead of giving away answers, your AI tutor guides your reasoning step by step.</li>
        </ol>
      </div>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Jump right in and start your first session today!</p>
    `,
    buttonText: "Go to My Dashboard",
    buttonUrl: "https://purelearn.ai/app",
  },
  {
    id: "custom",
    name: "Custom / Blank Template",
    category: "Custom",
    description: "Start with a clean slate for custom announcements or messages.",
    subject: "📢 Important Update from PureLearn AI",
    previewText: "A quick update from the PureLearn AI team.",
    content: `
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Hello,</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">We wanted to reach out with an important announcement regarding your PureLearn AI account and learning progress.</p>
      <p style="font-size: 15px; color: #09090b; line-height: 1.6; margin: 0 0 16px;">Type your message content here...</p>
    `,
    buttonText: "View on PureLearn",
    buttonUrl: "https://purelearn.ai/app",
  },
];

// Helper: Formats rich email with modern PureLearn branding & crisp white body
export function formatPureLearnEmailTemplate({
  title,
  previewText,
  content,
  buttonText,
  buttonUrl,
}: {
  title: string;
  previewText?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}): string {
  if (content.includes("<html") || content.includes("<body")) {
    return content;
  }

  const ctaButtonHtml =
    buttonText && buttonUrl
      ? `<div style="text-align: center; margin: 32px 0 16px;">
           <a href="${escapeHtml(buttonUrl)}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none !important; border-radius: 8px; border: 1px solid #000000; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); letter-spacing: 0.2px;">
             ${escapeHtml(buttonText)}
           </a>
         </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #09090b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 32px 32px 24px;
      background-color: #ffffff;
      border-bottom: 1px solid #f4f4f5;
      text-align: center;
    }
    .brand-badge {
      display: inline-block;
      padding: 5px 14px;
      background-color: #000000;
      border: 1px solid #000000;
      border-radius: 9999px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .title {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 800;
      color: #000000;
      line-height: 1.35;
      letter-spacing: -0.3px;
    }
    .body-content {
      padding: 32px;
      background-color: #ffffff;
      color: #09090b;
      font-size: 15px;
      line-height: 1.65;
    }
    .body-content h1, .body-content h2, .body-content h3, .body-content h4 {
      color: #000000;
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .body-content a {
      color: #000000;
      text-decoration: underline;
      font-weight: 600;
    }
    .body-content p {
      margin: 0 0 16px;
      color: #09090b;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 16px;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background-color: #000000 !important;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none !important;
      border-radius: 8px;
      border: 1px solid #000000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      letter-spacing: 0.2px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #fafafa;
      border-top: 1px solid #e4e4e7;
      text-align: center;
      font-size: 12px;
      color: #52525b;
      line-height: 1.6;
    }
    .footer a {
      color: #000000;
      text-decoration: underline;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>` : ""}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-badge">PureLearn AI Platform Notice</div>
        <h1 class="title">${escapeHtml(title)}</h1>
      </div>
      <div class="body-content">
        ${content}
        ${ctaButtonHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px;">
          You received this announcement because you are an active member of <strong>PureLearn AI / Clarity AI Tutor</strong>.
        </p>
        <p style="margin: 0;">
          PureLearn AI &bull; Personalized Cognitive Education &bull; <a href="https://purelearn.ai">purelearn.ai</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 6. User Verification & Onboarding Email Helper
// Uses the dedicated transactional edge function (no admin role required)
export async function sendRegistrationVerificationEmail(params: {
  email: string;
  name?: string;
  role: "student" | "teacher";
}): Promise<{ success: boolean; error?: string }> {
  return await sendTransactionalEmail({
    type: params.role === "teacher" ? "welcome_teacher" : "welcome_student",
    to: params.email,
    name: params.name,
  });
}

// 7. Educator Verification Status (Approved/Rejected) Email Helper
// Uses the dedicated transactional edge function (no admin role required)
export async function sendEducatorStatusUpdateEmail(params: {
  email: string;
  name?: string;
  status: "approved" | "rejected";
}): Promise<{ success: boolean; error?: string }> {
  return await sendTransactionalEmail({
    type: params.status === "approved" ? "educator_approved" : "educator_rejected",
    to: params.email,
    name: params.name,
  });
}

