"use client";

/**
 * user-context.tsx — Global context for the authenticated user and theme.
 *
 * Provides:
 *   • user — fetched from GET /users/me on first render
 *   • setUser — update user state (after PATCH /users/me)
 *   • theme — "light" | "dark" | "system", persisted to localStorage
 *   • setTheme — change and persist the theme, applies 'dark' class to <html>
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "./types";
import { getMe } from "./api";

export type Theme = "light" | "dark" | "system";

interface UserContextValue {
  user: User | null;
  setUser: (u: User) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  userLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  theme: "system",
  setTheme: () => {},
  userLoading: true,
});

/** Apply or remove the 'dark' class on <html> based on theme + system preference. */
function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (theme === "dark" || (theme === "system" && prefersDark)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [theme, setThemeState] = useState<Theme>("system");
  const [userLoading, setUserLoading] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = (localStorage.getItem("zoom-theme") as Theme) ?? "system";
    setThemeState(saved);
    applyTheme(saved);

    // Listen for system dark-mode changes when theme === 'system'
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("zoom-theme") as Theme) ?? "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Fetch user on mount
  useEffect(() => {
    getMe()
      .then(setUserState)
      .catch(console.error)
      .finally(() => setUserLoading(false));
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("zoom-theme", t);
    applyTheme(t);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, theme, setTheme, userLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

/** Derive initials from a display name (up to 2 chars). */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
