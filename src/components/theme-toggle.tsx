"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9 rounded-lg bg-secondary/50 animate-pulse" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-secondary hover:bg-muted transition-all cursor-pointer flex items-center justify-center text-muted-foreground hover:text-foreground border border-border"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-violet-600" />}
    </button>
  );
}
