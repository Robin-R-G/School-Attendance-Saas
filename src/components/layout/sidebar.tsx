"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  DollarSign,
  FileSpreadsheet,
  Settings,
  LogOut,
  FolderLock,
  CalendarDays,
  FileCheck,
  UserRound,
  BellRing
} from "lucide-react";

interface SidebarProps {
  role: string;
  schoolCode?: string | null;
  userName: string;
  logoUrl?: string | null;
}

export default function Sidebar({ role, schoolCode, userName, logoUrl }: SidebarProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    if (role === "SUPER_ADMIN") {
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Onboard Schools", href: "/admin/schools", icon: GraduationCap },
        { label: "Audit Logs", href: "/admin/logs", icon: FolderLock },
      ];
    }

    const base = `/schools/${schoolCode}`;

    if (role === "SCHOOL_ADMIN") {
      return [
        { label: "Dashboard", href: `${base}/admin`, icon: LayoutDashboard },
        { label: "Students", href: `${base}/admin/students`, icon: Users },
        { label: "Teachers", href: `${base}/admin/teachers`, icon: UserRound },
        { label: "Classes", href: `${base}/admin/classes`, icon: CalendarDays },
        { label: "Subjects", href: `${base}/admin/subjects`, icon: BookOpen },
        { label: "Fees & Invoices", href: `${base}/admin/fees`, icon: DollarSign },
        { label: "Leave Requests", href: `${base}/admin/leaves`, icon: Calendar },
        { label: "Exams & Grades", href: `${base}/admin/exams`, icon: FileCheck },
        { label: "Audit Logs", href: `${base}/admin/logs`, icon: FolderLock },
      ];
    }

    if (role === "TEACHER") {
      return [
        { label: "Dashboard", href: `${base}/teacher`, icon: LayoutDashboard },
        { label: "Students Directory", href: `${base}/teacher/students`, icon: Users },
        { label: "Mark Attendance", href: `${base}/teacher/attendance`, icon: UserCheck },
        { label: "Timetable", href: `${base}/teacher/timetable`, icon: Calendar },
        { label: "Assignments", href: `${base}/teacher/assignments`, icon: BookOpen },
        { label: "Enter Grades", href: `${base}/teacher/grades`, icon: FileCheck },
      ];
    }

    if (role === "STUDENT") {
      return [
        { label: "Dashboard", href: `${base}/student`, icon: LayoutDashboard },
        { label: "My Attendance", href: `${base}/student/attendance`, icon: UserCheck },
        { label: "Timetable", href: `${base}/student/timetable`, icon: Calendar },
        { label: "Assignments", href: `${base}/student/assignments`, icon: BookOpen },
        { label: "Grades & Cards", href: `${base}/student/grades`, icon: FileCheck },
      ];
    }

    if (role === "PARENT") {
      return [
        { label: "Dashboard", href: `${base}/parent`, icon: LayoutDashboard },
        { label: "Child Attendance", href: `${base}/parent/attendance`, icon: UserCheck },
        { label: "Academic Grades", href: `${base}/parent/grades`, icon: FileCheck },
        { label: "Fee Status", href: `${base}/parent/fees`, icon: DollarSign },
        { label: "Leave Requests", href: `${base}/parent/leaves`, icon: Calendar },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-400 flex flex-col h-screen sticky top-0 border-r border-zinc-900 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-zinc-900">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded shrink-0 bg-white/10 p-0.5" />
        ) : (
          <div className="p-1.5 bg-violet-600 rounded-lg text-white shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
        )}
        <span className="font-bold text-white tracking-wide text-xs truncate">AETHER ERP</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white border border-zinc-800 shadow-md"
                  : "hover:bg-zinc-900/50 hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Slot & Sign Out */}
      <div className="p-4 border-t border-zinc-900 space-y-3 bg-zinc-950/40">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-200 truncate">{userName}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">
              {role.replace("SCHOOL_", "").replace("_", " ")}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/10 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
