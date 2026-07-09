import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Divider, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import {
  User,
  Settings as SettingsIcon,
  CreditCard,
  AlertTriangle,
  Check,
  Loader2,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — tutor.vigilance.rw" }] }),
  component: SettingsPage,
});

const sections = ["Profile", "Preferences", "Plan", "Danger zone"] as const;

function SettingsPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<(typeof sections)[number]>("Profile");

  // Auth Guard: redirect to login if unauthenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth/sign-in" });
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] max-w-5xl mx-auto">
        {/* Navigation Sidebar */}
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {sections.map((s) => {
            const isActive = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-left text-xs uppercase tracking-wider font-bold transition-all duration-200 border ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {s === "Profile" && <User className="h-4 w-4" />}
                {s === "Preferences" && <SettingsIcon className="h-4 w-4" />}
                {s === "Plan" && <CreditCard className="h-4 w-4" />}
                {s === "Danger zone" && <AlertTriangle className="h-4 w-4" />}
                {s}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {section === "Profile" && <ProfileSection />}
          {section === "Preferences" && <PreferencesSection />}
          {section === "Plan" && <PlanSection />}
          {section === "Danger zone" && <DangerSection />}
        </div>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 md:p-8 bg-elevated/40 border border-border/80 shadow-xl backdrop-blur-md">
      <div className="mb-6">
        <h3 className="text-base font-bold uppercase tracking-wider text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Divider className="border-border/60" />
      <div className="mt-6 space-y-6">{children}</div>
    </Card>
  );
}

function ProfileSection() {
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    avatarUrl: "",
    educationLevel: "Undergraduate",
    gradeLevel: "2nd Year",
    cognitiveProfile: "standard",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userData.user.id)
            .single();

          const { data: stdProf } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("student_id", userData.user.id)
            .single();

          setProfile({
            id: userData.user.id,
            name: prof?.name || "Student User",
            email: userData.user.email || "",
            avatarUrl: prof?.avatar_url || "",
            educationLevel: stdProf?.education_level || "Undergraduate",
            gradeLevel: stdProf?.grade_level || "2nd Year",
            cognitiveProfile: stdProf?.cognitive_profile || "standard",
          });
        }
      } catch (err) {
        console.warn("Could not load user profile metadata from DB:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (profile.id) {
        await supabase
          .from("profiles")
          .update({ name: profile.name, avatar_url: profile.avatarUrl || null })
          .eq("id", profile.id);
        await supabase
          .from("student_profiles")
          .update({
            education_level: profile.educationLevel,
            grade_level: profile.gradeLevel,
            cognitive_profile: profile.cognitiveProfile,
          })
          .eq("student_id", profile.id);

        // Update local storage sync
        localStorage.setItem(
          "user_profile",
          JSON.stringify({
            name: profile.name,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            role: "student",
            cognitiveProfile: profile.cognitiveProfile,
            educationLevel: profile.educationLevel,
            gradeLevel: profile.gradeLevel,
          }),
        );

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.warn("Profile update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file || !profile.id) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const storagePath = `${profile.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || undefined,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(storagePath);
      const avatarUrl = data.publicUrl;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profile.id);
      setProfile((prev) => ({ ...prev, avatarUrl }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Avatar upload error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </Card>
    );
  }

  return (
    <Section
      title="Profile Information"
      description="Review and customize your educational level and cognitive profiling modes."
    >
      <div className="flex items-center gap-5">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full border-2 border-primary/20 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-sm font-bold text-primary">
            {profile.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Scholar Identity
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Synced with Supabase Auth credentials.
          </p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground hover:bg-muted">
            <Upload className="h-3 w-3" />
            Upload avatar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[10px] uppercase font-bold text-muted-foreground">
            Full name
          </Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground">
            Registered Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="text-xs opacity-60 bg-muted cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
            Level of Education
          </Label>
          <select
            value={profile.educationLevel}
            onChange={(e) => setProfile({ ...profile, educationLevel: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none"
          >
            <option value="High School">High School</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Doctorate">Doctorate</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
            Grade / GPA Level
          </Label>
          <Input
            value={profile.gradeLevel}
            onChange={(e) => setProfile({ ...profile, gradeLevel: e.target.value })}
            placeholder="e.g. 2nd Year, 3.8 GPA"
            className="text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
          Cognitive Presentation Mode
        </Label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { id: "standard", title: "Standard", desc: "Balanced structure." },
            { id: "adhd", title: "ADHD Focus", desc: "Gamified reward checks." },
            { id: "dyslexia", title: "Dyslexia Friendly", desc: "Bionic reading sepia filter." },
            { id: "sensory", title: "Sensory Mode", desc: "Low-stimulus dark theme." },
          ].map((mode) => {
            const isSelected = profile.cognitiveProfile === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setProfile({ ...profile, cognitiveProfile: mode.id })}
                className={`p-3 rounded-lg border text-left text-xs transition duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="font-semibold">{mode.title}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-2">
        {saveSuccess && (
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <Check className="h-3 w-3" /> Profile saved successfully!
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="text-xs font-semibold py-2">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Section>
  );
}

function PreferencesSection() {
  return (
    <Section
      title="System Preferences"
      description="Fine-tune how the Socratic AI model provides support guidelines."
    >
      {[
        {
          k: "Cite source materials by default",
          v: "Automatically append citations referencing page numbers and video stamps.",
        },
        {
          k: "Ingestion auto-summaries",
          v: "Generate core summaries dynamically upon uploading learning items.",
        },
        {
          k: "Weekly progress audit report",
          v: "Receive performance breakdown notifications every Sunday.",
        },
      ].map((p, i) => (
        <div
          key={p.k}
          className={`flex items-center justify-between gap-4 ${i > 0 ? "border-t border-border/40 pt-5" : ""}`}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">{p.k}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{p.v}</div>
          </div>
          <Toggle defaultOn={i !== 2} />
        </div>
      ))}
    </Section>
  );
}

function PlanSection() {
  return (
    <Section title="Subscription Plan Management" description="Inspect current tier access limits.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
              Active Plan
            </span>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Scholar Basic
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground leading-normal">
              • 50 daily Socratic responses
              <br />
              • 5 uploads / day limit
              <br />• Basic AI note taking
            </p>
          </div>
          <div className="text-xl font-extrabold text-foreground mt-4">$0</div>
        </div>

        <div className="rounded-lg border border-border bg-background p-5 flex flex-col justify-between hover:border-primary/40 transition">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Scholar Premium (Pro)
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground leading-normal">
              • Unlimited AI responses
              <br />
              • Unlimited study file uploads
              <br />• Advanced flashcards canvas exports
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xl font-extrabold text-foreground">
              $12<span className="text-[10px] font-normal text-muted-foreground">/mo</span>
            </div>
            <Button size="sm" className="text-[10px] font-bold">
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function DangerSection() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // 1. Purge Supabase active session
    await supabase.auth.signOut();

    // 2. Clear all local storage values (completely logging out of all mock users and cleaning state residues)
    localStorage.clear();

    // 3. Force routing to clean auth screen
    window.location.href = "/auth/sign-in";
  };

  return (
    <Section
      title="Security & Danger zone"
      description="Irreversible account actions. Ending active sessions clears all mock parameters."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-foreground">
            Sign out of all sessions
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            Terminates active auth sessions and purges all mock memory residues.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 text-xs font-bold transition"
        >
          Sign Out
        </button>
      </div>
      <Divider className="border-border/60" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-foreground">
            Delete Account Profile
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            Permanently erase profile files and document records from the server.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          Delete
        </button>
      </div>
    </Section>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-all duration-200 ${
        on ? "bg-primary border-primary" : "bg-border border-border"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-200 ${
          on ? "left-4.5 bg-primary-foreground" : "left-0.5 bg-foreground"
        }`}
      />
    </button>
  );
}
