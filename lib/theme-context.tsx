"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-preference") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (theme === "system") {
      localStorage.removeItem("theme-preference");
      root.classList.remove("light", "dark");
    } else {
      localStorage.setItem("theme-preference", theme);
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  // Evita flash indesejado antes de montar o provedor.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
