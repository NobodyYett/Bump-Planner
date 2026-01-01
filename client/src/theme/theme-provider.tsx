// client/src/theme/theme-provider.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "bump-theme-mode";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const m = getStoredMode();
    return m === "system" ? getSystemTheme() : m;
  });

  // Compute and apply resolved theme whenever mode changes
  const updateResolvedTheme = useCallback((currentMode: ThemeMode) => {
    const resolved: ResolvedTheme =
      currentMode === "system" ? getSystemTheme() : currentMode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Set mode and persist
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
      updateResolvedTheme(newMode);
    },
    [updateResolvedTheme]
  );

  // On mount, apply the theme
  useEffect(() => {
    updateResolvedTheme(mode);
  }, [mode, updateResolvedTheme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
