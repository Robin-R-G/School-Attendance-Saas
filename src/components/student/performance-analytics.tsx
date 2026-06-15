"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, UserCheck, BookOpen, Award, CheckCircle } from "lucide-react";

interface PerformanceAnalyticsProps {
  attendanceData: Array<{ name: string; rate: number }>;
  subjectData: Array<{ subject: string; score: number; percentage: number }>;
  progressionData: Array<{ name: string; average: number }>;
  assignmentStats: {
    total: number;
    completed: number;
    completionRate: number;
  };
}

export default function PerformanceAnalytics({
  attendanceData,
  subjectData,
  progressionData,
  assignmentStats,
}: PerformanceAnalyticsProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Avoid Hydration mismatch issues with Recharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="p-8 bg-card border border-border rounded-xl flex items-center justify-center min-h-[300px]">
        <p className="text-xs text-muted-foreground">Loading interactive performance charts...</p>
      </div>
    );
  }

  // Fallbacks if data arrays are empty
  const finalAttendanceData = attendanceData.length > 0 ? attendanceData : [
    { name: "Jan", rate: 95 },
    { name: "Feb", rate: 92 },
    { name: "Mar", rate: 89 },
    { name: "Apr", rate: 96 },
    { name: "May", rate: 94 },
    { name: "Jun", rate: 95 },
  ];

  const finalSubjectData = subjectData.length > 0 ? subjectData : [
    { subject: "Maths", score: 85, percentage: 85 },
    { subject: "Science", score: 78, percentage: 78 },
    { subject: "English", score: 92, percentage: 92 },
    { subject: "History", score: 80, percentage: 80 },
    { subject: "Geography", score: 88, percentage: 88 },
  ];

  const finalProgressionData = progressionData.length > 0 ? progressionData : [
    { name: "Term 1 Mid-Term", average: 81 },
    { name: "Term 1 Finals", average: 84 },
    { name: "Term 2 Mid-Term", average: 88 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-violet-500" />
        <h3 className="font-bold text-base text-foreground">Performance Analytics Dashboard</h3>
      </div>

      {/* Grid for main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Attendance Trend */}
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span>Monthly Attendance Rate (%)</span>
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">Benchmark: 90%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={finalAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                <XAxis dataKey="name" fontSize={10} stroke="#999" />
                <YAxis domain={[50, 100]} fontSize={10} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Attendance %"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Term Progression */}
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-blue-500" />
              <span>Academic Progression Trend (%)</span>
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">Aggregated average score</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalProgressionData}>
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                <XAxis dataKey="name" fontSize={10} stroke="#999" />
                <YAxis domain={[50, 100]} fontSize={10} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  name="Average Score %"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Subject-wise Performance */}
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 lg:col-span-2">
          <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <span>Subject-wise Exam Results (%)</span>
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalSubjectData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                <XAxis dataKey="subject" fontSize={10} stroke="#999" />
                <YAxis domain={[0, 100]} fontSize={10} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="percentage"
                  name="Score Percentage"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assignment Stats & Analytics */}
      <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-foreground">Assignment Submission Analytics</h4>
            <p className="text-[10px] text-muted-foreground">Keep track of homework deadlines and review performance</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Assigned</p>
            <p className="text-lg font-bold font-mono text-foreground">{assignmentStats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Submitted</p>
            <p className="text-lg font-bold font-mono text-emerald-500">{assignmentStats.completed}</p>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div className="text-right sm:text-left">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Completion Rate</p>
            <p className="text-lg font-bold font-mono text-violet-500">{assignmentStats.completionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
