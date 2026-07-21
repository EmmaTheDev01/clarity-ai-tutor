import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Theme = "light" | "dark" | "system" | "low-light";
export type Scaling = "compact" | "standard" | "comfortable";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  scaling: Scaling;
  setScaling: (scaling: Scaling) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [scaling, setScalingState] = useState<Scaling>("standard");

  useEffect(() => {
    const savedTheme = localStorage.getItem("purelearn-theme") as Theme;
    if (savedTheme && ["light", "dark", "system", "low-light"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    const savedScaling = localStorage.getItem("purelearn-scaling") as Scaling;
    if (savedScaling && ["compact", "standard", "comfortable"].includes(savedScaling)) {
      setScalingState(savedScaling);
    }

    // Attempt to sync from database
    const syncFromDb = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("theme_preference")
          .eq("id", userData.user.id)
          .maybeSingle();
        
        if (data?.theme_preference && ["light", "dark", "system", "low-light"].includes(data.theme_preference)) {
          setThemeState(data.theme_preference as Theme);
          localStorage.setItem("purelearn-theme", data.theme_preference);
        }
      }
    };
    syncFromDb();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "low-light");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("text-sm", "text-base", "text-lg");
    if (scaling === "compact") {
      root.classList.add("text-sm");
    } else if (scaling === "standard") {
      root.classList.add("text-base");
    } else if (scaling === "comfortable") {
      root.classList.add("text-lg");
    }
  }, [scaling]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("purelearn-theme", newTheme);
  };

  const setScaling = (newScaling: Scaling) => {
    setScalingState(newScaling);
    localStorage.setItem("purelearn-scaling", newScaling);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, scaling, setScaling }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
