"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Search, Menu } from "lucide-react";

interface TopbarProps {
  title?: string;
  schoolName?: string;
}

export default function Topbar({ title = "Dashboard", schoolName }: TopbarProps) {
  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-1.5 rounded-lg border border-border bg-background hover:bg-secondary cursor-pointer">
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>{title}</span>
            {schoolName && (
              <>
                <span className="text-muted-foreground font-normal">/</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {schoolName}
                </span>
              </>
            )}
          </h1>
        </div>
      </div>

      {/* Global Header Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input Box (Visual) */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search record..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>

        {/* Notifications Icon (Visual) */}
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground relative border border-border cursor-pointer transition-colors bg-background">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-600 border border-card" />
        </button>

        {/* Light/Dark Mode Switcher */}
        <ThemeToggle />
      </div>
    </header>
  );
}
