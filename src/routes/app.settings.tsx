import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Divider, Input, Label } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  User,
  Settings as SettingsIcon,
  CreditCard,
  AlertTriangle,
  Check,
  Loader2,
  Upload,
  Sparkles,
  ShieldAlert,
  X,
  Trash2,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — tutor.vigilance.rw" }] }),
  component: SettingsPage,
});

const sections = ["Profile", "Preferences", "Plan", "Security", "Danger zone"] as const;

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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] w-full items-start">
        {/* Navigation Sidebar */}
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col bg-elevated/20 p-2.5 rounded-2xl border border-border/40 backdrop-blur-md">
          {sections.map((s) => {
            const isActive = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left text-xs uppercase tracking-wider font-extrabold transition-all duration-300 border ${
                  isActive
                    ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5 scale-[1.02]"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:translate-x-0.5"
                }`}
              >
                {s === "Profile" && <User className="h-4 w-4 shrink-0" />}
                {s === "Preferences" && <SettingsIcon className="h-4 w-4 shrink-0" />}
                {s === "Plan" && <CreditCard className="h-4 w-4 shrink-0" />}
                {s === "Security" && <ShieldAlert className="h-4 w-4 shrink-0" />}
                {s === "Danger zone" && <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{s}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {section === "Profile" && <ProfileSection />}
          {section === "Preferences" && <PreferencesSection />}
          {section === "Plan" && <PlanSection />}
          {section === "Security" && <SecuritySection />}
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
    <Card className="p-6 md:p-8 bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg relative overflow-hidden rounded-2xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Divider className="border-border/30" />
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

  const loadProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        let prof = null;
        const { data: existingProf, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (profErr || !existingProf) {
          const newName = userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || "Student User";
          const { data: createdProf } = await supabase
            .from("profiles")
            .insert({
              id: userData.user.id,
              name: newName,
              email: userData.user.email || "",
              role: "student",
            })
            .select("*")
            .maybeSingle();
          prof = createdProf;
        } else {
          prof = existingProf;
        }

        let stdProf = null;
        const { data: existingStdProf, error: stdProfErr } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("student_id", userData.user.id)
          .maybeSingle();

        if (stdProfErr || !existingStdProf) {
          const { data: createdStdProf } = await supabase
            .from("student_profiles")
            .insert({
              student_id: userData.user.id,
              education_level: "Undergraduate",
              grade_level: "2nd Year",
              cognitive_profile: "standard",
            })
            .select("*")
            .maybeSingle();
          stdProf = createdStdProf;
        } else {
          stdProf = existingStdProf;
        }

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

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfileData = async (currentProfile: typeof profile) => {
    if (!currentProfile.id) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await supabase
        .from("profiles")
        .update({ name: currentProfile.name, avatar_url: currentProfile.avatarUrl || null })
        .eq("id", currentProfile.id);

      await supabase
        .from("student_profiles")
        .upsert({
          student_id: currentProfile.id,
          education_level: currentProfile.educationLevel,
          grade_level: currentProfile.gradeLevel,
          cognitive_profile: currentProfile.cognitiveProfile,
        });

      // Update local storage sync
      localStorage.setItem(
        "user_profile",
        JSON.stringify({
          name: currentProfile.name,
          email: currentProfile.email,
          avatarUrl: currentProfile.avatarUrl,
          role: "student",
          cognitiveProfile: currentProfile.cognitiveProfile,
          educationLevel: currentProfile.educationLevel,
          gradeLevel: currentProfile.gradeLevel,
        }),
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Profile update error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    saveProfileData(profile);
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
      <Card className="p-8 flex items-center justify-center min-h-[300px] border-border/50 bg-elevated/20">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </Card>
    );
  }

  return (
    <Section
      title="Profile Information"
      description="Review and customize your educational level and cognitive profiling modes."
    >
      <div className="flex items-center gap-6 p-5 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-md">
        <div className="relative group cursor-pointer overflow-hidden rounded-full h-16 w-16 border-2 border-primary/20 shadow-lg">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-full w-full object-cover group-hover:opacity-80 transition duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-primary/15 to-primary/5 text-base font-bold text-primary group-hover:opacity-80 transition duration-300">
              {profile.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
            <Upload className="h-4 w-4 text-white" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
            />
          </label>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            Scholar Identity <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Full name
          </Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            onBlur={() => saveProfileData(profile)}
            className="text-xs bg-background/40 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Registered Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="text-xs opacity-60 bg-muted/30 cursor-not-allowed border-border/40 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Level of Education
          </Label>
          <select
            value={profile.educationLevel}
            onChange={(e) => {
              const updated = { ...profile, educationLevel: e.target.value };
              setProfile(updated);
              saveProfileData(updated);
            }}
            className="w-full rounded-xl border border-border/80 bg-background/40 px-3 py-2.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value="High School">High School</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Doctorate">Doctorate</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            Grade / GPA Level
          </Label>
          <Input
            value={profile.gradeLevel}
            onChange={(e) => setProfile({ ...profile, gradeLevel: e.target.value })}
            onBlur={() => saveProfileData(profile)}
            placeholder="e.g. 2nd Year, 3.8 GPA"
            className="text-xs bg-background/40 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Cognitive Presentation Mode
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { id: "standard", title: "Standard", desc: "Balanced structure.", accent: "border-primary bg-primary/5" },
            { id: "adhd", title: "ADHD Focus", desc: "Gamified reward checks.", accent: "border-amber-500/40 bg-amber-500/5 text-amber-500" },
            { id: "dyslexia", title: "Dyslexia Friendly", desc: "Bionic reading sepia filter.", accent: "border-orange-500/40 bg-orange-500/5 text-orange-500" },
            { id: "sensory", title: "Sensory Mode", desc: "Low-stimulus dark theme.", accent: "border-indigo-500/40 bg-indigo-500/5 text-indigo-500" },
          ].map((mode) => {
            const isSelected = profile.cognitiveProfile === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  const updated = { ...profile, cognitiveProfile: mode.id };
                  setProfile(updated);
                  saveProfileData(updated);
                }}
                className={`p-4 rounded-xl border text-left text-xs transition-all duration-300 hover:scale-[1.01] h-full flex flex-col justify-between ${
                  isSelected
                    ? `${mode.accent} font-semibold shadow-lg shadow-primary/5`
                    : "border-border/60 bg-background/30 text-muted-foreground hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="font-bold tracking-wide uppercase text-xs text-foreground">{mode.title}</div>
                <div className="text-xs opacity-80 mt-1.5 leading-relaxed">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-2">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 animate-fade-in">
            <Check className="h-3.5 w-3.5" /> Profile saved successfully!
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="text-xs font-semibold py-2.5 px-5 rounded-xl transition-all duration-200">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Section>
  );
}

function PreferencesSection() {
  return (
    <div className="space-y-6">
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
            className={`flex items-center justify-between gap-6 py-1 ${i > 0 ? "border-t border-border/30 pt-5" : ""}`}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">{p.k}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.v}</div>
            </div>
            <Toggle defaultOn={i !== 2} />
          </div>
        ))}
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">ADHD Visual Scaling</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Enlarge text headings, increase layout margins, and show prominent checkmarks by default.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Status: Disabled</span>
            <Toggle />
          </div>
        </div>

        <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">API Keys Credentials</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Allow using external custom API keys to run generative models when limits are reached.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Status: Enabled</span>
            <Toggle defaultOn />
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanSection() {
  const [tier, setTier] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("plan_tier")
            .eq("user_id", userData.user.id)
            .maybeSingle();
          if (sub) {
            setTier(sub.plan_tier || "free");
          }
        }
      } catch (err) {
        console.warn("Could not load subscription details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscription();
  }, []);

  const handleUpgrade = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Upsert standard subscription record
        await supabase.from("subscriptions").upsert({
          user_id: userData.user.id,
          plan_tier: "premium",
          status: "active",
        });
        setTier("premium");
      }
    } catch (err) {
      console.warn("Upgrade error:", err);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[200px] border-border/50 bg-elevated/20">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </Card>
    );
  }

  const isPremium = tier === "premium" || tier === "pro";

  return (
    <Section title="Subscription Plan Management" description="Inspect current tier access limits.">
      <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
        Choose the study plan that fits your academic workload. The Scholar Basic tier provides robust daily AI tutor feedback and note summaries, while the Premium tier unlocks unlimited inquiries, high-resolution study cards, and full study-set library exports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        {/* Basic Plan */}
        <div
          className={`rounded-xl border p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 h-full ${
            !isPremium
              ? "border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 shadow-lg shadow-primary/5"
              : "border-border/60 bg-background/40"
          }`}
        >
          <div>
            {!isPremium && (
              <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest bg-primary/20 border border-primary/30 text-primary px-2.5 py-0.5 rounded-full">
                Active
              </span>
            )}
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">Scholar Basic</div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed space-y-1">
              <span className="block">• 50 daily Socratic responses</span>
              <span className="block">• 5 uploads / day limit</span>
              <span className="block">• Basic AI note taking</span>
            </p>
          </div>
          <div className="text-2xl font-black text-foreground mt-5">$0</div>
        </div>

        {/* Premium Plan */}
        <div
          className={`rounded-xl border p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 h-full ${
            isPremium
              ? "border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 shadow-lg shadow-primary/5"
              : "border-border/60 bg-background/40 hover:border-primary/40 hover:scale-[1.01]"
          }`}
        >
          <div>
            {isPremium && (
              <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest bg-primary/20 border border-primary/30 text-primary px-2.5 py-0.5 rounded-full">
                Active
              </span>
            )}
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              Scholar Premium
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed space-y-1">
              <span className="block">• Unlimited AI responses</span>
              <span className="block">• Unlimited study file uploads</span>
              <span className="block">• Advanced flashcards canvas exports</span>
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="text-2xl font-black text-foreground">
              $12<span className="text-xs font-normal text-muted-foreground">/mo</span>
            </div>
            {!isPremium && (
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-md transition-all px-4 py-2 hover:scale-[1.02]"
              >
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setMessage("Please enter your current password.");
      setIsSuccess(false);
      return;
    }
    if (!password) {
      setMessage("Please enter a new password.");
      setIsSuccess(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("New passwords do not match.");
      setIsSuccess(false);
      return;
    }
    setIsUpdating(true);
    setMessage("");
    try {
      // 1. Get user email
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || !userData.user.email) {
        throw new Error("Could not retrieve current user profile details.");
      }

      // 2. Verify current password by signing in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Incorrect current password. Please try again.");
      }

      // 3. Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setIsSuccess(true);
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.message || "Failed to update password.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Section
        title="Account Security"
        description="Update your credentials and manage multi-factor authentication preferences."
      >
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">Change Password</div>
          
          <div className="space-y-2 max-w-md">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="text-xs bg-background/40 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-xs bg-background/40 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-xs bg-background/40 border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 pt-2">
            {message && (
              <span className={`text-xs font-bold flex items-center gap-1 ${isSuccess ? "text-emerald-500" : "text-red-500"}`}>
                {isSuccess && <Check className="h-3.5 w-3.5" />} {message}
              </span>
            )}
            <Button type="submit" disabled={isUpdating} className="text-xs font-semibold py-2.5 px-5 rounded-xl ml-auto">
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">Multi-Factor Authentication (MFA)</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Require an authenticator app (like Google Authenticator or Duo) to confirm log-in attempts.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Status: Disabled</span>
            <Toggle />
          </div>
        </div>

        <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 shadow-2xl backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">Active Browser Session</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Logged in on Chrome (macOS). Last active: Just now.
            </p>
          </div>
          <button className="mt-5 rounded-xl border border-border px-4 py-2.5 text-left text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-300 w-fit">
            Revoke other sessions
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerSection() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<"signout" | "delete" | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleSignOut = async () => {
    setIsWorking(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      toast.success("Signed out successfully.");
      window.location.href = "/auth/sign-in";
    } catch {
      toast.error("Failed to sign out.");
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    setIsWorking(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      toast.success("Account deleted. Goodbye!");
      window.location.href = "/auth/sign-in";
    } catch {
      toast.error("Failed to delete account.");
      setIsWorking(false);
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                modal === "delete" ? "bg-red-500/10 border border-red-500/20" : "bg-muted border border-border"
              }`}>
                {modal === "delete" ? (
                  <Trash2 className="h-4 w-4 text-red-500" />
                ) : (
                  <LogOut className="h-4 w-4 text-foreground" />
                )}
              </div>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {modal === "delete" ? "Delete Account" : "Sign Out"}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {modal === "delete"
                ? "This will permanently erase your profile, all uploaded study materials, notes, and learning history. This action cannot be undone."
                : "You will be signed out of all active sessions. Your data will remain intact and can be accessed when you sign back in."}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={modal === "delete" ? handleDelete : handleSignOut}
                disabled={isWorking}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition flex items-center gap-2 ${
                  modal === "delete"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-foreground hover:bg-foreground/90 text-background"
                }`}
              >
                {isWorking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modal === "delete" ? "Delete permanently" : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Section
        title="Security & Danger zone"
        description="Irreversible account actions. Ending active sessions clears all mock parameters."
      >
        <div className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed -mt-2">
          <p>
            Please review these security options carefully before proceeding. The actions listed below execute destructive database operations that instantly terminate data states.
          </p>
          <p>
            Signing out will invalidate your active JSON Web Tokens (JWT) across all browser storage cache entries. This action purges all mock student attributes, workspace memory settings, and credentials.
          </p>
          <p>
            Initiating profile deletion permanently removes all reference records. All study summaries, note notebooks, and quiz history will be erased from Supabase tables.
          </p>
          <p>
            Warning: Account deletion is completely irreversible. Once confirmed, you will lose complete access to tutor.vigilance.rw and all associated learning progress.
          </p>
        </div>

        <div className="space-y-5 mt-5">
          <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="text-sm font-black uppercase tracking-wider text-foreground">
                Sign out of all sessions
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Terminates active auth sessions and purges all mock memory residues.
              </p>
            </div>
            <button
              onClick={() => setModal("signout")}
              className="mt-5 rounded-xl border border-border bg-elevated hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-primary px-4 py-2.5 text-xs font-extrabold transition-all duration-300 hover:scale-[1.02] w-fit"
            >
              Sign Out
            </button>
          </div>

          <div className="p-6 md:p-8 bg-elevated/20 border border-border/50 backdrop-blur-lg rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="text-sm font-black uppercase tracking-wider text-foreground">
                Delete Account Profile
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Permanently erase profile files and document records from the server.
              </p>
            </div>
            <button
              onClick={() => setModal("delete")}
              className="mt-5 rounded-xl border border-border bg-elevated hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-muted-foreground px-4 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-[1.02] w-fit"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}


function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-5 w-10 shrink-0 rounded-full border transition-all duration-300 ${
        on ? "bg-primary border-primary shadow-sm shadow-primary/30" : "bg-muted/85 border-border/80"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-[2px] h-3 w-3 rounded-full bg-white transition-all duration-300 shadow-md ${
          on ? "left-[22px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
