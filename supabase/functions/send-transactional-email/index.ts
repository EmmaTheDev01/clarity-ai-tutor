// =========================================================================
// PureLearn AI - Transactional Email Edge Function
// Handles: Welcome emails, Educator verification, Status updates
// Secured by JWT (any valid authenticated user can trigger transactional)
// =========================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

interface TransactionalEmailRequest {
  type: "welcome_student" | "welcome_teacher" | "educator_approved" | "educator_rejected" | "custom";
  to: string;
  name?: string;
  subject?: string;
  html?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  apiKey?: string;
  from?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Validate caller — any valid authenticated session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (!user || userError) {
      return new Response(JSON.stringify({ error: "Unauthorized. Invalid session token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TransactionalEmailRequest = await req.json();
    const { type, to, name, subject: customSubject, html: customHtml, buttonText, buttonUrl, apiKey: payloadApiKey, from: customFrom } = body;

    if (!to || !to.includes("@")) {
      return new Response(JSON.stringify({ error: "Missing or invalid recipient email." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve Resend API Key: env > db > payload
    let resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!resendApiKey) {
      const { data: settingRow } = await supabaseAdmin
        .from("system_settings")
        .select("value")
        .eq("key", "resend_api_key")
        .maybeSingle();
      if (settingRow?.value) resendApiKey = settingRow.value;
    }
    if (!resendApiKey && payloadApiKey) resendApiKey = payloadApiKey;

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Resend API Key not configured." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve sender
    let fromEmail = customFrom || Deno.env.get("RESEND_FROM_EMAIL") || "";
    if (!fromEmail) {
      const { data: fromRow } = await supabaseAdmin
        .from("system_settings").select("value").eq("key", "resend_from_email").maybeSingle();
      if (fromRow?.value) fromEmail = fromRow.value;
    }
    if (!fromEmail) fromEmail = "PureLearn AI <onboarding@resend.dev>";

    const recipientName = name || "there";
    let subject = customSubject || "Important update from PureLearn AI";
    let htmlContent = customHtml || "";

    if (type === "welcome_student") {
      subject = "Welcome to PureLearn AI — Your AI Tutor is Ready";
      htmlContent = `
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Welcome ${esc(recipientName)},</p>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Your <strong>PureLearn AI</strong> account is ready. Experience AI-powered Socratic tutoring tailored to your unique learning style.</p>
        <div style="background-color:#fafafa;border:1px solid #e4e4e7;border-left:4px solid #000;padding:18px 20px;border-radius:8px;margin:24px 0;">
          <h4 style="margin:0 0 10px;color:#000;font-size:15px;font-weight:700;">Getting Started:</h4>
          <ul style="margin:0;padding-left:20px;color:#09090b;font-size:14px;line-height:1.7;">
            <li><strong>Upload your course notes</strong> — Generate flashcards and active recall quizzes.</li>
            <li><strong>Configure your cognitive profile</strong> — ADHD, Dyslexia, or Visual Focus mode.</li>
            <li><strong>Ask your AI Tutor</strong> — Socratic step-by-step guidance through tough concepts.</li>
          </ul>
        </div>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Click below to sign in and begin your first session.</p>
      `;
      if (!buttonText) body.buttonText = "Sign In to PureLearn";
      if (!buttonUrl) body.buttonUrl = "https://purelearn.ai/auth/sign-in";
    } else if (type === "welcome_teacher") {
      subject = "Educator Verification Received — PureLearn AI";
      htmlContent = `
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Hello ${esc(recipientName)},</p>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Thank you for registering as an educator on <strong>PureLearn AI</strong>.</p>
        <div style="background-color:#fafafa;border:1px solid #e4e4e7;border-left:4px solid #000;padding:18px 20px;border-radius:8px;margin:24px 0;">
          <h4 style="margin:0 0 10px;color:#000;font-size:15px;font-weight:700;">Account Status: Pending Verification</h4>
          <p style="margin:0;color:#09090b;font-size:14px;line-height:1.6;">Our administration team reviews educator credentials to ensure a safe, compliant learning environment. You will receive a confirmation email within 24–48 hours.</p>
        </div>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Once approved, you'll have full access to classroom creation, quiz generation, and student progress telemetry.</p>
      `;
      if (!buttonText) body.buttonText = "Check My Application Status";
      if (!buttonUrl) body.buttonUrl = "https://purelearn.ai/auth/sign-in";
    } else if (type === "educator_approved") {
      subject = "Educator Verification Approved — PureLearn AI";
      htmlContent = `
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Dear ${esc(recipientName)},</p>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Your educator account on <strong>PureLearn AI</strong> has been <strong>verified and approved</strong>.</p>
        <div style="background-color:#fafafa;border:1px solid #e4e4e7;border-left:4px solid #000;padding:18px 20px;border-radius:8px;margin:24px 0;">
          <h4 style="margin:0 0 8px;color:#000;font-size:15px;font-weight:700;">Full Educator Privileges Activated</h4>
          <p style="margin:0;color:#09090b;font-size:14px;line-height:1.6;">You can now create classrooms, invite students, upload syllabus materials, generate automated quizzes, and monitor student cognitive progress.</p>
        </div>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Log in to your Educator Hub to get started.</p>
      `;
      if (!buttonText) body.buttonText = "Open Educator Hub";
      if (!buttonUrl) body.buttonUrl = "https://purelearn.ai/teacher";
    } else if (type === "educator_rejected") {
      subject = "Update Regarding Your Educator Application — PureLearn AI";
      htmlContent = `
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Dear ${esc(recipientName)},</p>
        <p style="font-size:15px;color:#09090b;line-height:1.6;margin:0 0 16px;">Thank you for your interest in PureLearn AI. After review, our team was unable to verify the credentials provided with your educator application.</p>
        <div style="background-color:#fafafa;border:1px solid #e4e4e7;border-left:4px solid #000;padding:18px 20px;border-radius:8px;margin:24px 0;">
          <p style="margin:0;color:#09090b;font-size:14px;line-height:1.6;">If you believe this is an error, or have alternative institutional credentials to submit, please contact our support team and we will be happy to assist.</p>
        </div>
      `;
      if (!buttonText) body.buttonText = "Contact Support";
      if (!buttonUrl) body.buttonUrl = "mailto:support@purelearn.ai";
    }

    const finalHtml = buildEmailHtml({ title: subject, content: htmlContent, buttonText: body.buttonText || buttonText, buttonUrl: body.buttonUrl || buttonUrl });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html: finalHtml, text: body.text || subject }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(resendData.message || resendData.error || `Resend Error ${resendRes.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Transactional email error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildEmailHtml({ title, content, buttonText, buttonUrl }: { title: string; content: string; buttonText?: string; buttonUrl?: string }): string {
  const cta = buttonText && buttonUrl
    ? `<div style="text-align:center;margin:32px 0 16px;"><a href="${esc(buttonUrl)}" style="display:inline-block;padding:14px 32px;background-color:#000;color:#fff!important;font-size:14px;font-weight:700;text-decoration:none!important;border-radius:8px;border:1px solid #000;box-shadow:0 2px 8px rgba(0,0,0,.15);letter-spacing:.2px;">${esc(buttonText)}</a></div>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title>
<style>body{margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#09090b;}.wrapper{width:100%;background-color:#f4f4f5;padding:40px 16px;}.container{max-width:600px;margin:0 auto;background-color:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.05);}.header{padding:32px 32px 24px;background-color:#fff;border-bottom:1px solid #f4f4f5;text-align:center;}.brand-badge{display:inline-block;padding:5px 14px;background-color:#000;border-radius:9999px;color:#fff;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:14px;}.title{margin:0;font-size:22px;font-weight:800;color:#000;line-height:1.35;letter-spacing:-.3px;}.body-content{padding:32px;background-color:#fff;color:#09090b;font-size:15px;line-height:1.65;}.body-content a{color:#000;text-decoration:underline;font-weight:600;}.footer{padding:24px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;font-size:12px;color:#52525b;line-height:1.6;}.footer a{color:#000;text-decoration:underline;font-weight:600;}</style>
</head><body><div class="wrapper"><div class="container">
<div class="header"><div class="brand-badge">PureLearn AI</div><h1 class="title">${esc(title)}</h1></div>
<div class="body-content">${content}${cta}</div>
<div class="footer"><p style="margin:0 0 8px;">This email was sent because you have an account on <strong>PureLearn AI / Clarity AI Tutor</strong>.</p><p style="margin:0;">PureLearn AI &bull; Personalized Cognitive Education &bull; <a href="https://purelearn.ai">purelearn.ai</a></p></div>
</div></div></body></html>`;
}

function esc(str: string): string {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
