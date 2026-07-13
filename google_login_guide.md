# Google OAuth Integration Guide for Supabase Auth

This guide provides step-by-step instructions to enable Google Sign-In for **Clarity AI Tutor** using Supabase.

---

## Step 1: Create credentials on Google Cloud Console

1. Navigate to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Click **Select a project** (top bar) and select **New Project**. Give it a descriptive name (e.g., `Clarity AI Tutor`) and click **Create**.
3. Go to **APIs & Services** > **OAuth consent screen**:
   * Select **External** (unless you are using Google Workspace for internal organization users) and click **Create**.
   * Fill in the mandatory app details:
     * **App name**: `Clarity AI Tutor`
     * **User support email**: Your support email.
     * **Developer contact information**: Your developer email address.
   * Click **Save and Continue** (skip Scopes and Test Users by default unless restricting access).
4. Go to **APIs & Services** > **Credentials**:
   * Click **Create Credentials** > **OAuth client ID**.
   * Under **Application type**, choose **Web application**.
   * Under **Authorized JavaScript origins**, add:
     * `http://localhost:8080` (for local development)
     * Your production domain (e.g., `https://tutor.vigilance.rw`)
   * Under **Authorized redirect URIs**, copy your Supabase OAuth redirect URL.
     * To find it, go to your **Supabase Dashboard** > **Authentication** > **Providers** > **Google** and copy the **Redirect URI** shown there. It typically looks like:
       `https://<your-project-ref>.supabase.co/auth/v1/callback`
     * Paste this URL into the Google credentials screen under Authorized redirect URIs.
   * Click **Create**.
   * Copy the generated **Client ID** and **Client Secret**.

---

## Step 2: Configure Google Provider in Supabase

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to your project, then click on **Authentication** (sidebar) > **Providers**.
3. Find and expand the **Google** provider option.
4. Toggle **Enable Google provider** to ON.
5. Paste your copied **Client ID** and **Client Secret** into the respective fields.
6. Click **Save**.

---

## Step 3: Trigger Google Login in Your React Code

To log users in with Google, execute the Supabase authentication trigger. Below is the React component implementation code:

```tsx
import { supabase } from "@/lib/supabase";
import { Chrome } from "lucide-react"; // Or any Google icon

export function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Directs the user back to the app home page after successful OAuth login
        redirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      console.error("Google Auth error:", error.message);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted active:scale-[0.97]"
    >
      <Chrome className="h-4 w-4" />
      <span>Continue with Google</span>
    </button>
  );
}
```

---

## Step 4: Verify Integration

1. Fire up your development server (`npm run dev`).
2. Go to the sign-in page (`http://localhost:8080/auth/sign-in`).
3. Click the **Google Login** button.
4. You will be redirected to Google's authentication page, and then safely returned to the `/app` dashboard.
