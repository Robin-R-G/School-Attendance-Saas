"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  FileCheck,
  CreditCard,
  TrendingUp,
  CalendarDays,
  Percent
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface SchoolAdminDashboardClientProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    attendanceToday: number;
    attendanceRate: number;
    pendingFees: number;
    upcomingExams: number;
  };
  charts: {
    attendanceTrend: Array<{ date: string; rate: number }>;
    feeTrend: Array<{ name: string; amount: number; fill: string }>;
    academicPerformance: Array<{ subject: string; average: number }>;
  };
}

export default function SchoolAdminDashboardClient({ stats, charts }: SchoolAdminDashboardClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-card rounded-xl border border-border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-card rounded-xl border border-border animate-pulse" />
          <div className="h-80 bg-card rounded-xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Teachers", value: stats.totalTeachers, icon: UserRound, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Attendance Today", value: `${stats.attendanceRate}%`, icon: Percent, color: "text-violet-500", bg: "bg-violet-500/10", desc: `${stats.attendanceToday} students present` },
    { label: "Pending Fees", value: `$${stats.pendingFees.toLocaleString()}`, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                {card.desc && <p className="text-[10px] text-muted-foreground">{card.desc}</p>}
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Area Chart */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col h-96">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span>Attendance Rate Trend</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Percentage rate of student attendance over last few dates.</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" name="Present Rate (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Status Bar Chart */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col h-96">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>Fee Collection Summary</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Total cash invoices collected vs pending payments in USD.</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.feeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60} name="Amount ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Performance (Exams Average) Bar Chart */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col h-96 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-500" />
              <span>Academic Performance (Exam Averages)</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Average student grade points scored across subjects in midterm exams.</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.academicPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="subject" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} name="Avg Marks (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
