"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-10 items-center justify-center rounded-full border border-[hsl(var(--border))] text-foreground transition hover:bg-[hsl(var(--muted))]"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
