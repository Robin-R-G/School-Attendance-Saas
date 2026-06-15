import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCheck, Users, Calendar, Clock, AlertTriangle, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage({
  params,
}: {
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

  // Find the teacher profile associated with logged in user
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          grade: true,
          section: true,
        },
      },
    },
  });

  if (!teacher) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="text-lg font-bold text-destructive">Teacher profile not found.</h3>
        <p className="text-muted-foreground text-xs mt-1">Please ensure your administrator has created a teacher record for your account.</p>
      </div>
    );
  }

  // Today boundaries
  const today = new Date("2026-06-15");
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch today's attendance records marked by this teacher or for the teacher's class
  const classId = teacher.classes[0]?.id; // Use their primary class teacher assignment as dashboard class
  
  const todayAttendances = classId
    ? await db.attendance.findMany({
        where: {
          classId,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          student: true,
        },
      })
    : [];

  const totalToday = todayAttendances.length;
  const absentToday = todayAttendances.filter((a) => a.status === "ABSENT").map((a) => a.student);
  const lateToday = todayAttendances.filter((a) => a.status === "LATE").map((a) => a.student);
  const presentTodayCount = todayAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  
  const attendanceRate = totalToday > 0 ? Math.round((presentTodayCount / totalToday) * 100) : 100;

  // Fetch timetable slots for this teacher
  const timetable = await db.timetableSlot.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: {
        include: {
          grade: true,
          section: true,
        },
      },
      subject: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Teacher Workspace</h2>
          <p className="text-muted-foreground text-xs">
            Welcome back, {session.user.name}. Manage your classrooms, schedules, and student records.
          </p>
        </div>
        <Link
          href={`/schools/${schoolCode}/teacher/attendance`}
          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          <span>Mark Class Attendance</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Attendance Rate</p>
            <p className="text-2xl font-bold tracking-tight">{attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">For primary assigned class today</p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 text-violet-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Absent Students Today</p>
            <p className="text-2xl font-bold tracking-tight text-red-500">{absentToday.length}</p>
            <p className="text-[10px] text-muted-foreground">Requires parent confirmation</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Late Arrivals Today</p>
            <p className="text-2xl font-bold tracking-tight text-amber-500">{lateToday.length}</p>
            <p className="text-[10px] text-muted-foreground">Logged at check-in gate</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable List (Left side) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <span>Timetable Schedule</span>
            </h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Class / Section</th>
                  <th className="px-4 py-2">Time Slot</th>
                  <th className="px-4 py-2">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {timetable.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No classes scheduled.
                    </td>
                  </tr>
                ) : (
                  timetable.map((slot) => (
                    <tr key={slot.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-3 font-semibold text-muted-foreground">{slot.dayOfWeek}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{slot.subject.name}</td>
                      <td className="px-4 py-3 font-medium">
                        {slot.class.grade.name} - {slot.class.section.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-4 py-3 font-mono">{slot.room || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Absentees Quick list (Right side) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-red-500" />
            <span>Today's Absentees ({absentToday.length})</span>
          </h3>
          <div className="divide-y divide-border overflow-y-auto flex-1 max-h-80">
            {absentToday.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No students absent today. Excellent attendance!</p>
            ) : (
              absentToday.map((student) => (
                <div key={student.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-semibold text-xs">
                      {student.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-semibold uppercase">
                    Absent
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
