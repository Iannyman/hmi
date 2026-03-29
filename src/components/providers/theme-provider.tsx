"use client";

import * as React from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  // Load persisted theme from localStorage after mount (client-only)
  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && (saved === "dark" || saved === "light")) {
      setTheme(saved);
    }
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;

    // Use requestAnimationFrame for more reliable DOM updates on certain browsers
    requestAnimationFrame(() => {
      // Set both class and data-theme for better browser compatibility
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);

      // Force repaint to trigger CSS variable recalculation
      void root.offsetHeight;

      localStorage.setItem("theme", theme);
    });
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
