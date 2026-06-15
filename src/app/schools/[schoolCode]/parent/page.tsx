import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SubmitLeaveModal from "@/components/parent/submit-leave-modal";
import { UserCheck, DollarSign, Calendar, CreditCard, Award, FileSpreadsheet } from "lucide-react";
import PerformanceAnalytics from "@/components/student/performance-analytics";
import ParentFeesClient from "@/components/parent/parent-fees-client";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage({
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

  // Find parent and associated student children
  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              class: {
                include: {
                  grade: true,
                  section: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="text-lg font-bold text-destructive">Parent profile not found.</h3>
        <p className="text-muted-foreground text-xs mt-1">Please ensure your administrator has registered your parent account.</p>
      </div>
    );
  }

  const studentsList = parent.students.map((ps) => ps.student);

  if (studentsList.length === 0) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="text-lg font-bold text-amber-500">No children linked to this parent account.</h3>
        <p className="text-muted-foreground text-xs mt-1">Please contact the school administration to link your child's profile.</p>
      </div>
    );
  }

  // Pick the primary child (first student) to display metrics
  const child = studentsList[0];

  // 1. Fetch child attendance
  const childAttendances = await db.attendance.findMany({
    where: { studentId: child.id },
    orderBy: { date: "asc" },
  });
  const totalAttendances = childAttendances.length;
  const presentCount = childAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 95; // Default

  // Group child attendance by month
  const attendanceByMonth = childAttendances.reduce((acc: any, curr) => {
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

  // Fetch homework assignments and submissions
  const assignments = await db.assignment.findMany({
    where: { classId: child.classId },
  });

  const submissions = await db.assignmentSubmission.findMany({
    where: { studentId: child.id },
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

  // 2. Fetch child Invoices
  const invoices = await db.feeInvoice.findMany({
    where: { studentId: child.id },
    orderBy: { dueDate: "desc" },
  });
  const pendingFees = invoices.filter((i) => i.status === "PENDING").reduce((acc, curr) => acc + curr.amount, 0);

  // 3. Fetch Leave Requests
  const leaves = await db.leaveRequest.findMany({
    where: { studentId: child.id },
    orderBy: { createdAt: "desc" },
  });

  // 4. Fetch Exam Marks
  const examMarks = await db.examMark.findMany({
    where: { studentId: child.id },
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

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Parent Portal Dashboard</h2>
          <p className="text-muted-foreground text-xs">
            Viewing child: <span className="font-semibold text-foreground">{child.firstName} {child.lastName}</span> ({child.class.grade.name} - {child.class.section.name})
          </p>
        </div>
        <SubmitLeaveModal students={studentsList} schoolCode={schoolCode} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Child Attendance Rate</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-500">{attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">Class benchmark: 90%</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Invoices Amount</p>
            <p className="text-2xl font-bold tracking-tight text-amber-500">₹{pendingFees.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Next invoice due: July 1st</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Leave Requests</p>
            <p className="text-2xl font-bold tracking-tight text-blue-500">{leaves.length}</p>
            <p className="text-[10px] text-muted-foreground">{leaves.filter((l) => l.status === "PENDING").length} pending approval</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="h-5 w-5" />
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
        {/* Child Fee Invoices & Payment Status (Left) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4 lg:col-span-8 flex flex-col">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-violet-500" />
            <span>Billing & Invoices</span>
          </h3>
          <ParentFeesClient invoices={invoices as any} school={school as any} />
        </div>

        {/* Leave Request Status logs (Right) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col space-y-4 lg:col-span-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>Leave Requests History ({leaves.length})</span>
          </h3>
          <div className="divide-y divide-border overflow-y-auto flex-1 max-h-80">
            {leaves.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No leave requests logged.</p>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      l.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : l.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {l.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {l.fromDate.toISOString().split("T")[0]} to {l.toDate.toISOString().split("T")[0]}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{l.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Child Academic Marks Card (Bottom row) */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm space-y-4 lg:col-span-12">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-500" />
            <span>Recent Exam Marks & Grading Cards</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-2.5">Exam Name</th>
                  <th className="px-6 py-2.5">Subject</th>
                  <th className="px-6 py-2.5">Date Taken</th>
                  <th className="px-6 py-2.5 text-center">Score Obtained</th>
                  <th className="px-6 py-2.5 text-center">Maximum Marks</th>
                  <th className="px-6 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {examMarks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No exam report records found for your child.
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
