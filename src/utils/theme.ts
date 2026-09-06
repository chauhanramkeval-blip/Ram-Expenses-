export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "khata_theme_mode";

/**
 * Retrieves the stored theme preference from localStorage,
 * falling back to system preference or dark mode default.
 */
export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch (err) {
    console.warn("Could not read theme from localStorage", err);
  }
  return "light";
}

/**
 * Persists theme preference to localStorage and applies it to the DOM
 */
export function setStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    console.warn("Could not write theme to localStorage", err);
  }
  applyTheme(theme);
}

/**
 * Applies the dark or light class to document elements
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;

  if (theme === "dark") {
    root.classList.add("dark");
    body.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    body.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  // Update theme-color meta tag if present
  let metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (!metaThemeColor) {
    metaThemeColor = document.createElement("meta");
    metaThemeColor.setAttribute("name", "theme-color");
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute("content", theme === "dark" ? "#121316" : "#FFFFFF");
}

/**
 * Initialize theme immediately to prevent flashing
 */
export function initializeTheme(): ThemeMode {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
