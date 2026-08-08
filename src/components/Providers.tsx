"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "noir" | "day";
type FontSize = "sm" | "md" | "lg";

type PrefsContextType = {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  increaseFont: () => void;
  decreaseFont: () => void;
};

const PrefsContext = createContext<PrefsContextType | null>(null);

const SIZES: FontSize[] = ["sm", "md", "lg"];

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("noir");
  const [fontSize, setFontSize] = useState<FontSize>("md");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("zn-theme") as Theme | null;
    const storedSize = window.localStorage.getItem("zn-fontsize") as FontSize | null;
    if (storedTheme) setTheme(storedTheme);
    if (storedSize) setFontSize(storedSize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("zn-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-fontsize", fontSize);
    window.localStorage.setItem("zn-fontsize", fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme((t) => (t === "noir" ? "day" : "noir"));

  const increaseFont = () =>
    setFontSize((f) => SIZES[Math.min(SIZES.indexOf(f) + 1, SIZES.length - 1)]);

  const decreaseFont = () =>
    setFontSize((f) => SIZES[Math.max(SIZES.indexOf(f) - 1, 0)]);

  return (
    <PrefsContext.Provider value={{ theme, toggleTheme, fontSize, increaseFont, decreaseFont }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs debe usarse dentro de <Providers>");
  return ctx;
}
