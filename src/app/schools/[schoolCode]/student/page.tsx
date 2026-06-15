import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserCheck, BookOpen, Calendar, Award, Clock } from "lucide-react";
import PerformanceAnalytics from "@/components/student/performance-analytics";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
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

  // Find the student profile associated with the logged-in user
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      class: {
        include: {
          grade: true,
          section: true,
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="text-lg font-bold text-destructive">Student profile not found.</h3>
        <p className="text-muted-foreground text-xs mt-1">Please ensure your administrator has registered your profile correctly.</p>
      </div>
    );
  }

  // 1. Fetch and calculate attendance rate
  const studentAttendances = await db.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "asc" },
  });

  const totalAttendances = studentAttendances.length;
  const presentCount = studentAttendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100;

  // Group attendance by month
  const attendanceByMonth = studentAttendances.reduce((acc: any, curr) => {
    const month = curr.date.toLocaleString("default", { month: "short" });
    if (!acc[month]) acc[month] = { total: 0, present: 0 };
    acc[month].total += 1;
    if (curr.status === "PRESENT" || curr.status === "LATE") {
      acc[month].present += 1;
    }
    return acc;
  }, {});

  const attendanceData = Object.entries(attendanceByMonth).map(([month, val]: any) => ({
    name: month,
    rate: Math.round((val.present / val.total) * 100),
  }));

  // 2. Fetch Assignments
  const assignments = await db.assignment.findMany({
    where: { classId: student.classId },
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Fetch student submissions
  const submissions = await db.assignmentSubmission.findMany({
    where: { studentId: student.id },
  });

  const totalAssignments = assignments.length;
  const completedAssignments = submissions.filter(
    (s) => s.status === "SUBMITTED" || s.status === "GRADED"
  ).length;
  const assignmentCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 100;

  const assignmentStats = {
    total: totalAssignments,
    completed: completedAssignments,
    completionRate: assignmentCompletionRate,
  };

  // 3. Fetch Exam Marks & Report Card Info
  const examMarks = await db.examMark.findMany({
    where: { studentId: student.id },
    include: {
      examSubject: {
        include: {
          exam: true,
          subject: true,
        },
      },
    },
    orderBy: { examSubject: { date: "desc" } },
  });

  // Calculate subject-wise performance
  const subjectPerformance = examMarks.reduce((acc: any, curr) => {
    const subjectName = curr.examSubject.subject.name;
    if (!acc[subjectName]) acc[subjectName] = { score: 0, max: 0 };
    acc[subjectName].score += curr.marksObtained;
    acc[subjectName].max += curr.examSubject.maxMarks;
    return acc;
  }, {});

  const subjectData = Object.entries(subjectPerformance).map(([subject, val]: any) => ({
    subject,
    score: Math.round(val.score),
    percentage: Math.round((val.score / val.max) * 100),
  }));

  // Calculate progression term by term
  const examProgression = examMarks.reduce((acc: any, curr) => {
    const examName = curr.examSubject.exam.name;
    if (!acc[examName]) acc[examName] = { score: 0, max: 0 };
    acc[examName].score += curr.marksObtained;
    acc[examName].max += curr.examSubject.maxMarks;
    return acc;
  }, {});

  const progressionData = Object.entries(examProgression).map(([name, val]: any) => ({
    name,
    average: Math.round((val.score / val.max) * 100),
  }));

  // 4. Fetch class timetable slots
  const timetable = await db.timetableSlot.findMany({
    where: { classId: student.classId },
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Student Workspace</h2>
        <p className="text-muted-foreground text-xs">
          Assigned Class: {student.class.grade.name} - {student.class.section.name} | Roll No: {student.rollNumber}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">My Attendance Rate</p>
            <p className="text-2xl font-bold tracking-tight">{attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">Class benchmark: 90%</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Assignments</p>
            <p className="text-2xl font-bold tracking-tight text-violet-500">{assignments.length}</p>
            <p className="text-[10px] text-muted-foreground">Pending your submission</p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 text-violet-500">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent GPA Avg</p>
            <p className="text-2xl font-bold tracking-tight text-blue-500">
              {examMarks.length > 0
                ? `${Math.round(
                    (examMarks.reduce((acc, c) => acc + c.marksObtained, 0) /
                      examMarks.reduce((acc, c) => acc + c.examSubject.maxMarks, 0)) *
                      100
                  )}%`
                : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground">From Term 1 Mid-terms</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Performance Analytics Charts Section */}
      <PerformanceAnalytics
        attendanceData={attendanceData}
        subjectData={subjectData}
        progressionData={progressionData}
        assignmentStats={assignmentStats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Timetable View (Left) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4 lg:col-span-8 flex flex-col">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            <span>Class Timetable Schedule</span>
          </h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Time Slot</th>
                  <th className="px-4 py-2">Instructor</th>
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
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-4 py-3 font-medium">{slot.teacher.user.name}</td>
                      <td className="px-4 py-3 font-mono">{slot.room || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignments list (Right) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col space-y-4 lg:col-span-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <span>Homework Assignments ({assignments.length})</span>
          </h3>
          <div className="divide-y divide-border overflow-y-auto flex-1 max-h-80">
            {assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">All caught up! No pending homework.</p>
            ) : (
              assignments.map((asm) => (
                <div key={asm.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary font-semibold text-muted-foreground border border-border">
                      {asm.subject.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-500 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {asm.dueDate.toISOString().split("T")[0]}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug">{asm.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {asm.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exam Report Card (Bottom row) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4 lg:col-span-12">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-500" />
            <span>Academic Performance & Exam Marks</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2.5">Exam Term</th>
                  <th className="px-6 py-2.5">Subject</th>
                  <th className="px-6 py-2.5">Exam Date</th>
                  <th className="px-6 py-2.5 text-center">Score Obtained</th>
                  <th className="px-6 py-2.5 text-center">Max Marks</th>
                  <th className="px-6 py-2.5 text-center">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {examMarks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No exam records published.
                    </td>
                  </tr>
                ) : (
                  examMarks.map((mark) => {
                    const pass = mark.marksObtained >= mark.examSubject.passingMarks;
                    return (
                      <tr key={mark.id} className="hover:bg-secondary/10">
                        <td className="px-6 py-3.5 font-semibold text-foreground">
                          {mark.examSubject.exam.name}
                        </td>
                        <td className="px-6 py-3.5 font-medium">{mark.examSubject.subject.name}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {mark.examSubject.date.toISOString().split("T")[0]}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold font-mono text-foreground">
                          {mark.marksObtained}
                        </td>
                        <td className="px-6 py-3.5 text-center font-semibold font-mono text-muted-foreground">
                          {mark.examSubject.maxMarks}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            pass ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {pass ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
