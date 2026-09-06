import { useState, useEffect, useCallback } from "react";
import { ThemeMode, getStoredTheme, setStoredTheme, applyTheme, initializeTheme } from "../utils/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => initializeTheme());

  useEffect(() => {
    // Ensure theme is applied on mount
    applyTheme(theme);

    // Listen for storage events (if changed in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "khata_theme_mode" && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const nextTheme: ThemeMode = prev === "dark" ? "light" : "dark";
      setStoredTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return {
    theme,
    isDarkMode: theme === "dark",
    setTheme,
    toggleTheme,
  };
}
