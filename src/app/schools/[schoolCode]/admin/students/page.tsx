import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, GraduationCap, Calendar, ShieldCheck } from "lucide-react";
import AddStudentModal from "@/components/admin/add-student-modal";
import StudentRowActions from "@/components/admin/student-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const students = await db.student.findMany({
    where: { user: { schoolId: school.id } },
    include: {
      class: {
        include: {
          grade: true,
          section: true,
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  const classes = await db.class.findMany({
    where: { schoolId: school.id },
    include: {
      grade: true,
      section: true,
    },
    orderBy: { grade: { level: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Students Directory</h2>
          <p className="text-muted-foreground text-xs">
            View and manage students enrolled at {school.name}.
          </p>
        </div>
        <AddStudentModal schoolCode={schoolCode} classes={classes} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Student Registry ({students.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Admission No</th>
                <th className="px-6 py-3">Class / Section</th>
                <th className="px-6 py-3">Roll No</th>
                <th className="px-6 py-3">Parent Info</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-xs">
                          {student.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">DOB: {student.dateOfBirth.toISOString().split("T")[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-muted-foreground">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {student.class.grade.name} - {student.class.section.name}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-muted-foreground">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{student.fatherName || student.motherName}</p>
                      <p className="text-[10px] text-muted-foreground">Guardian</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.contactNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        !student.isArchived
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${!student.isArchived ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {!student.isArchived ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <StudentRowActions
                        schoolCode={schoolCode}
                        classes={classes}
                        student={student}
                      />
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
