// =========================================================================
// PureLearn AI / Clarity AI Tutor - Resend Email Broadcast Edge Function
// =========================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

interface SendEmailRequest {
  to?: string | string[];
  audience?: "all" | "students" | "teachers" | "specific" | "test";
  userIds?: string[];
  subject: string;
  preview_text?: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
  apiKey?: string;
  buttonText?: string;
  buttonUrl?: string;
  button_text?: string;
  button_url?: string;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Service-role Supabase client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 2. Validate Authorization
    const authHeader = req.headers.get("Authorization");
    let callerUserId: string | null = null;
    let isAuthorizedAdmin = false;

    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(token);

      if (user && !userError) {
        callerUserId = user.id;
        // Verify user has admin role in profiles
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role, approval_status")
          .eq("id", user.id)
          .single();

        if (profile && profile.role === "admin" && profile.approval_status !== "banned") {
          isAuthorizedAdmin = true;
        }
      } else if (token === supabaseServiceKey) {
        // Direct service role invocation
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Admin privileges required to broadcast emails." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Parse and validate request body
    const body: SendEmailRequest = await req.json();
    const {
      to,
      audience = "all",
      userIds = [],
      subject,
      preview_text = "",
      html,
      text,
      from: customFrom,
      reply_to: customReplyTo,
      apiKey: payloadApiKey,
      buttonText: payloadBtnText,
      button_text: snakeBtnText,
      buttonUrl: payloadBtnUrl,
      button_url: snakeBtnUrl,
    } = body;

    const buttonText = payloadBtnText || snakeBtnText;
    const buttonUrl = payloadBtnUrl || snakeBtnUrl;

    if (!subject || (!html && !text)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: 'subject' and email content ('html' or 'text') are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4. Resolve Resend API Key (Priority: Deno env -> system_settings -> payload)
    let resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!resendApiKey) {
      const { data: settingRow } = await supabaseAdmin
        .from("system_settings")
        .select("value")
        .eq("key", "resend_api_key")
        .maybeSingle();

      if (settingRow?.value) {
        resendApiKey = settingRow.value;
      }
    }
    if (!resendApiKey && payloadApiKey) {
      resendApiKey = payloadApiKey;
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Resend API Key is not configured. Please add your Resend API Key in Admin Settings > Resend Settings, or set RESEND_API_KEY in Supabase secrets.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5. Resolve Sender From & Reply-To
    let fromEmail = customFrom || Deno.env.get("RESEND_FROM_EMAIL") || "";
    if (!fromEmail) {
      const { data: fromRow } = await supabaseAdmin
        .from("system_settings")
        .select("value")
        .eq("key", "resend_from_email")
        .maybeSingle();
      if (fromRow?.value) fromEmail = fromRow.value;
    }
    if (!fromEmail) {
      fromEmail = "PureLearn AI <onboarding@resend.dev>";
    }

    let replyTo = customReplyTo || Deno.env.get("RESEND_REPLY_TO") || undefined;
    if (!replyTo) {
      const { data: replyRow } = await supabaseAdmin
        .from("system_settings")
        .select("value")
        .eq("key", "resend_reply_to")
        .maybeSingle();
      if (replyRow?.value) replyTo = replyRow.value;
    }

    // 6. Resolve Recipient Emails
    type RecipientEntry = { email: string; name?: string };
    const recipientsMap = new Map<string, RecipientEntry>();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Direct 'to' addresses
    if (to) {
      const list = Array.isArray(to) ? to : [to];
      for (const item of list) {
        const clean = String(item).trim().toLowerCase();
        if (clean && emailRegex.test(clean)) {
          recipientsMap.set(clean, { email: clean });
        }
      }
    } else if (userIds && userIds.length > 0) {
      // Specific user IDs
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .in("id", userIds)
        .neq("approval_status", "banned");

      if (profiles) {
        for (const p of profiles) {
          const clean = (p.email || "").trim().toLowerCase();
          if (clean && emailRegex.test(clean)) {
            recipientsMap.set(clean, { email: clean, name: p.name || "" });
          }
        }
      }
    } else {
      // Query by audience
      let query = supabaseAdmin
        .from("profiles")
        .select("email, name, role")
        .neq("approval_status", "banned");

      if (audience === "students") {
        query = query.eq("role", "student");
      } else if (audience === "teachers") {
        query = query.eq("role", "teacher");
      }

      const { data: profiles, error: pErr } = await query;
      if (pErr) {
        throw new Error(`Failed to query audience profiles: ${pErr.message}`);
      }

      if (profiles) {
        for (const p of profiles) {
          const clean = (p.email || "").trim().toLowerCase();
          if (clean && emailRegex.test(clean)) {
            recipientsMap.set(clean, { email: clean, name: p.name || "" });
          }
        }
      }
    }

    const recipients = Array.from(recipientsMap.values());

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No valid recipient email addresses found for the specified audience.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 7. Ensure HTML template has responsive PureLearn branding if not full document
    const finalHtml = formatPureLearnEmailTemplate({
      title: subject,
      previewText: preview_text,
      content: html,
      buttonText,
      buttonUrl,
    });
    const finalText = text || subject;

    // 8. Send via Resend API
    // Resend supports batch sending up to 100 emails per request at POST https://api.resend.com/emails/batch
    let sentCount = 0;
    const batchErrors: string[] = [];

    if (recipients.length === 1) {
      // Single email send
      const singleRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipients[0].email],
          subject: subject,
          html: finalHtml,
          text: finalText,
          reply_to: replyTo,
        }),
      });

      const singleData = await singleRes.json();
      if (!singleRes.ok) {
        const errorMsg =
          singleData.message || singleData.error || `Resend Error (${singleRes.status})`;
        throw new Error(parseResendErrorMessage(errorMsg, fromEmail));
      }
      sentCount = 1;
    } else {
      // Batch send in chunks of 100 (Resend limit)
      const CHUNK_SIZE = 100;
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE);
        const batchPayload = chunk.map((r) => ({
          from: fromEmail,
          to: [r.email],
          subject: subject,
          html: finalHtml,
          text: finalText,
          reply_to: replyTo,
        }));

        const batchRes = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batchPayload),
        });

        const batchData = await batchRes.json();
        if (!batchRes.ok) {
          const err =
            batchData.message || batchData.error || `Batch chunk error (${batchRes.status})`;
          batchErrors.push(parseResendErrorMessage(err, fromEmail));
        } else {
          sentCount += chunk.length;
        }
      }
    }

    // 9. Log Broadcast to Database
    const logRecord = {
      subject,
      preview_text,
      body_html: finalHtml,
      body_text: finalText,
      target_audience: audience,
      recipient_count: sentCount,
      recipients: recipients.map((r) => r.email).slice(0, 500),
      status: batchErrors.length > 0 ? (sentCount > 0 ? "partial" : "failed") : "sent",
      sent_by: callerUserId,
      error_message: batchErrors.length > 0 ? batchErrors.join("; ") : null,
      metadata: {
        from_email: fromEmail,
        reply_to: replyTo || null,
        total_target_count: recipients.length,
      },
    };

    // Try inserting into email_broadcasts table, fallback to system_settings if table not created yet
    try {
      await supabaseAdmin.from("email_broadcasts").insert([logRecord]);
    } catch (_logErr) {
      console.warn("Could not insert to email_broadcasts table, saving to system_settings backup.");
      try {
        const { data: histRow } = await supabaseAdmin
          .from("system_settings")
          .select("value")
          .eq("key", "email_broadcast_history")
          .maybeSingle();

        const history = histRow?.value ? JSON.parse(histRow.value) : [];
        history.unshift({
          id: crypto.randomUUID(),
          ...logRecord,
          created_at: new Date().toISOString(),
        });

        await supabaseAdmin.from("system_settings").upsert({
          key: "email_broadcast_history",
          value: JSON.stringify(history.slice(0, 100)),
          updated_at: new Date().toISOString(),
        });
      } catch (backupErr) {
        console.error("Backup log error:", backupErr);
      }
    }

    if (sentCount === 0 && batchErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Failed to deliver emails: ${batchErrors.join("; ")}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        totalRecipients: recipients.length,
        fromEmail,
        message: `Successfully dispatched email to ${sentCount} recipient${sentCount === 1 ? "" : "s"}!`,
        errors: batchErrors.length > 0 ? batchErrors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("Unhandled send-email error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "An unexpected error occurred while sending emails.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

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

// Helper: Formats rich email with modern PureLearn branding (Clean Black & White)
function formatPureLearnEmailTemplate({
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
  // If content already contains <html> or <body>, return as is
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
