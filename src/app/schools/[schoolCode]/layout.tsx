import { auth } from "@/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function SchoolLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ schoolCode: string }>;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const { schoolCode } = await params;

  // Resolve school record
  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) {
    redirect("/login");
  }

  // Convert HEX to HSL values dynamically for custom theme overrides
  const hexToHsl = (hex: string): string => {
    let c = hex.replace("#", "");
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `${hDeg} ${sPct}% ${lPct}%`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Custom Theme Injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${school.primaryColor ? `--primary: ${hexToHsl(school.primaryColor)};` : ""}
          ${school.secondaryColor ? `--secondary: ${hexToHsl(school.secondaryColor)};` : ""}
          ${school.accentColor ? `--accent: ${hexToHsl(school.accentColor)};` : ""}
          ${school.backgroundColor ? `--background: ${hexToHsl(school.backgroundColor)};` : ""}
          ${school.textColor ? `--foreground: ${hexToHsl(school.textColor)};` : ""}
        }
      `}} />

      {/* Dynamic Sidebar */}
      <Sidebar
        role={session.user.role}
        schoolCode={schoolCode}
        userName={session.user.name || "User"}
        logoUrl={school.logoUrl}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <Topbar schoolName={school.name} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-secondary/10 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
