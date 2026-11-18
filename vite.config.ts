import { defineConfig, loadEnv, type Plugin } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function contactApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "contact-api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/contact", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            const { name, email, topic, message } = JSON.parse(body || "{}");
            const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY || "";
            if (!resendApiKey) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing RESEND_API_KEY environment variable" }));
              return;
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
            res.setHeader("Content-Type", "application/json");
            res.statusCode = resendRes.ok ? 200 : 400;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/",
    plugins: [
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      TanStackRouterVite(),
      viteReact(),
      contactApiPlugin(env),
    ].filter(Boolean),
    css: {
      transformer: "lightningcss",
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
      watch: {
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      },
    },
  };
});
