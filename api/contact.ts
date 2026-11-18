export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { name, email, topic, message } = await req.json();
    const resendApiKey = process.env.RESEND_API_KEY || "";
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY environment variable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="background: #000000; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">PureLearn Inquiry</span>
          <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 12px 0 4px;">New Contact Inquiry: ${topic || "General"}</h2>
          <p style="font-size: 13px; color: #71717a; margin: 0;">Received from PureLearn.ai Contact Form</p>
        </div>
        <div style="margin-bottom: 18px;">
          <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; display: block; margin-bottom: 4px;">Sender Details</strong>
          <p style="font-size: 15px; color: #09090b; margin: 0 0 4px; font-weight: 600;">${name || "Anonymous"}</p>
          <p style="font-size: 14px; color: #3b82f6; margin: 0;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 8px;">Message Content</strong>
          <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message || ""}</p>
        </div>
        <div style="border-top: 1px solid #f4f4f5; padding-top: 14px; font-size: 12px; color: #a1a1aa; text-align: center;">
          Forwarded directly to emmanhabumugisha@gmail.com &bull; PureLearn.ai
        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PureLearn Inquiries <onboarding@resend.dev>",
        to: ["emmanhabumugisha@gmail.com"],
        reply_to: email,
        subject: `[PureLearn Inquiry] ${topic || "General"}: ${name || "Contact"}`,
        html: emailHtml,
        text: `Inquiry from ${name} (${email}) [${topic}]:\n\n${message}`,
      }),
    });

    const data = await resendRes.json();
    return new Response(JSON.stringify(data), {
      status: resendRes.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
