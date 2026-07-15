import React, { createContext, useContext, useEffect, useState } from "react";

export type CognitiveMode = "default" | "adhd" | "dyslexia";

interface CognitiveModeContextType {
  mode: CognitiveMode;
  setMode: (mode: CognitiveMode) => void;
}

const CognitiveModeContext = createContext<CognitiveModeContextType | undefined>(undefined);

export function CognitiveModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<CognitiveMode>("default");

  useEffect(() => {
    const savedMode = localStorage.getItem("purelearn-cognitive-mode") as CognitiveMode;
    if (savedMode && ["default", "adhd", "dyslexia"].includes(savedMode)) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: CognitiveMode) => {
    setModeState(newMode);
    localStorage.setItem("purelearn-cognitive-mode", newMode);
  };

  return (
    <CognitiveModeContext.Provider value={{ mode, setMode }}>
      {children}
    </CognitiveModeContext.Provider>
  );
}

export function useCognitiveMode() {
  const context = useContext(CognitiveModeContext);
  if (context === undefined) {
    throw new Error("useCognitiveMode must be used within a CognitiveModeProvider");
  }
  return context;
}
