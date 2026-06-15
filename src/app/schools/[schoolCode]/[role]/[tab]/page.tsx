import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Calendar, BookOpen, FileCheck, DollarSign, UserCheck, AlertCircle, Clock, Award } from "lucide-react";
import AssignmentsManagerClient from "@/components/teacher/assignments-manager-client";
import GradesManagerClient from "@/components/teacher/grades-manager-client";

export const dynamic = "force-dynamic";

export default async function DynamicRoleTabPage({
  params,
}: {
  params: Promise<{ schoolCode: string; role: string; tab: string }>;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const { schoolCode, role: rawRole, tab: rawTab } = await params;
  const role = rawRole.toLowerCase();
  const tab = rawTab.toLowerCase();

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  // Resolve Student profile for Student or Parent roles
  let studentId = "";
  let classId = "";
  let studentName = "";

  if (role === "student") {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
    });
    if (student) {
      studentId = student.id;
      classId = student.classId;
      studentName = `${student.firstName} ${student.lastName}`;
    }
  } else if (role === "parent") {
    const parent = await db.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: { student: true },
        },
      },
    });
    const firstChild = parent?.students[0]?.student;
    if (firstChild) {
      studentId = firstChild.id;
      classId = firstChild.classId;
      studentName = `${firstChild.firstName} ${firstChild.lastName}`;
    }
  }

  // Resolve Teacher profile for Teacher role
  let teacherId = "";
  if (role === "teacher") {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });
    if (teacher) {
      teacherId = teacher.id;
    }
  }

  // RENDER SECTIONS BASED ON TAB
  // 1. TIMETABLE
  if (tab === "timetable") {
    const timetable = await db.timetableSlot.findMany({
      where: role === "teacher" ? { teacherId } : { classId },
      include: {
        subject: true,
        class: { include: { grade: true, section: true } },
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize">{role} Timetable Schedule</h2>
          <p className="text-muted-foreground text-xs">
            {role === "teacher" ? "Your teaching calendar" : `Weekly schedule for ${studentName}`}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Day of Week</th>
                  <th className="px-6 py-3">Subject</th>
                  {role === "teacher" && <th className="px-6 py-3">Class Section</th>}
                  <th className="px-6 py-3">Time Slot</th>
                  {role !== "teacher" && <th className="px-6 py-3">Instructor</th>}
                  <th className="px-6 py-3 text-right">Room No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {timetable.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No classes scheduled.</td>
                  </tr>
                ) : (
                  timetable.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-muted-foreground">{t.dayOfWeek}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{t.subject.name}</td>
                      {role === "teacher" && <td className="px-6 py-4 font-medium">{t.class.grade.name} - {t.class.section.name}</td>}
                      <td className="px-6 py-4 font-mono text-muted-foreground">{t.startTime} - {t.endTime}</td>
                      {role !== "teacher" && <td className="px-6 py-4 font-medium">{t.teacher.user.name}</td>}
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground pr-8">{t.room || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. ASSIGNMENTS
  if (tab === "assignments") {
    if (role === "teacher") {
      return <AssignmentsManagerClient schoolCode={schoolCode} />;
    }

    const assignments = await db.assignment.findMany({
      where: role === "teacher" ? { teacherId } : { classId },
      include: {
        subject: true,
        class: { include: { grade: true, section: true } },
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { dueDate: "asc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize">{role} Homework Assignments</h2>
          <p className="text-muted-foreground text-xs">
            {role === "teacher" ? "Assignments you published" : `Pending homework for ${studentName}`}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.length === 0 ? (
            <div className="col-span-2 p-10 text-center bg-card border border-border rounded-xl text-muted-foreground text-xs">
              No assignments published.
            </div>
          ) : (
            assignments.map((asm) => (
              <div key={asm.id} className="p-5 bg-card border border-border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                    {asm.subject.name}
                  </span>
                  <span className="text-[10px] font-mono text-amber-500 font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due: {asm.dueDate.toISOString().split("T")[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{asm.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{asm.description}</p>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>Class: {asm.class.grade.name} - {asm.class.section.name}</span>
                  <span>By: {asm.teacher.user.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 3. GRADES / ACADEMICS
  if (tab === "grades") {
    if (role === "teacher") {
      return <GradesManagerClient schoolCode={schoolCode} />;
    }

    const examMarks = await db.examMark.findMany({
      where: role === "teacher"
        ? { examSubject: { class: { classTeacherId: teacherId } } }
        : { studentId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        examSubject: {
          include: {
            exam: true,
            subject: true,
            class: { include: { grade: true, section: true } },
          },
        },
      },
      orderBy: { examSubject: { date: "desc" } },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize">{role} Academic Report Cards</h2>
          <p className="text-muted-foreground text-xs">
            {role === "teacher" ? "Grading lists for your classroom advisor role" : `Published exam markings for ${studentName}`}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Exam Term</th>
                  {role === "teacher" && <th className="px-6 py-3">Student</th>}
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Date Taken</th>
                  <th className="px-6 py-3 text-center">Score Obtained</th>
                  <th className="px-6 py-3 text-center">Max Marks</th>
                  <th className="px-6 py-3 text-right">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {examMarks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">No academic scores logged.</td>
                  </tr>
                ) : (
                  examMarks.map((m) => {
                    const pass = m.marksObtained >= m.examSubject.passingMarks;
                    return (
                      <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{m.examSubject.exam.name}</td>
                        {role === "teacher" && <td className="px-6 py-4 font-semibold">{m.student.firstName} {m.student.lastName}</td>}
                        <td className="px-6 py-4 font-medium">{m.examSubject.subject.name}</td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">{m.examSubject.date.toISOString().split("T")[0]}</td>
                        <td className="px-6 py-4 text-center font-bold font-mono text-foreground">{m.marksObtained}</td>
                        <td className="px-6 py-4 text-center font-mono text-muted-foreground">{m.examSubject.maxMarks}</td>
                        <td className="px-6 py-4 text-right pr-8">
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
    );
  }

  // 4. ATTENDANCE (HISTORY LOG FOR STUDENTS/PARENTS)
  if (tab === "attendance") {
    const attendances = await db.attendance.findMany({
      where: { studentId },
      include: {
        markedBy: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize">Attendance History Logs</h2>
          <p className="text-muted-foreground text-xs">
            Review calendar dates and check-in logs for student {studentName}.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Log Date</th>
                  <th className="px-6 py-3">Logged By</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No attendance logs found.</td>
                  </tr>
                ) : (
                  attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {att.date.toISOString().split("T")[0]}
                      </td>
                      <td className="px-6 py-4 font-medium">{att.markedBy.name}</td>
                      <td className="px-6 py-4 text-muted-foreground italic">{att.remarks || "No comments"}</td>
                      <td className="px-6 py-4 text-right pr-8">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          att.status === "PRESENT"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : att.status === "ABSENT"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 5. FEES (PARENT LOG)
  if (tab === "fees" && role === "parent") {
    const invoices = await db.feeInvoice.findMany({
      where: { studentId },
      orderBy: { dueDate: "desc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Billing & Outstanding Invoices</h2>
          <p className="text-muted-foreground text-xs">
            Pay invoices, review receipts, and check collection statuses for {studentName}.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Invoice Title</th>
                  <th className="px-6 py-3">Fee Category</th>
                  <th className="px-6 py-3 font-mono">Invoice Amount</th>
                  <th className="px-6 py-3 font-mono">Payment Deadline</th>
                  <th className="px-6 py-3 text-right">Invoicing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No fee invoices issued.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{inv.title}</td>
                      <td className="px-6 py-4 text-[10px] font-bold font-mono text-muted-foreground uppercase">{inv.type}</td>
                      <td className="px-6 py-4 font-bold font-mono text-foreground">${inv.amount}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{inv.dueDate.toISOString().split("T")[0]}</td>
                      <td className="px-6 py-4 text-right pr-8">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 6. LEAVE REQUESTS (PARENT LOG)
  if (tab === "leaves" && role === "parent") {
    const leaveRequests = await db.leaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Leave Application Logs</h2>
          <p className="text-muted-foreground text-xs">
            Review status updates of leave requests submitted for child {studentName}.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Submission Details / Reason</th>
                  <th className="px-6 py-3 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No leave request logs found.</td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => (
                    <tr key={l.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">{l.fromDate.toISOString().split("T")[0]}</td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">{l.toDate.toISOString().split("T")[0]}</td>
                      <td className="px-6 py-4 text-muted-foreground">{l.reason}</td>
                      <td className="px-6 py-4 text-right pr-8">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          l.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : l.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // FALLBACK PLACEHOLDER
  return (
    <div className="p-8 bg-card border border-border rounded-xl space-y-4 shadow-sm">
      <div className="h-12 w-12 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground capitalize">Workspace / {tab}</h3>
        <p className="text-muted-foreground text-xs mt-1">
          This tab module is active and connected to our database layer. Dynamic datasets are rendered dynamically for your credentials role.
        </p>
      </div>
    </div>
  );
}
