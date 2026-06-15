import { auth } from "@/auth";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        role={session.user.role}
        userName={session.user.name || "Super Admin"}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar title="System Administration" />

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/10 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
