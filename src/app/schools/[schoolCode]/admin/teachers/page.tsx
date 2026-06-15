import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AddTeacherModal from "@/components/admin/add-teacher-modal";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const teachers = await db.teacher.findMany({
    where: { user: { schoolId: school.id } },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Teachers Directory</h2>
          <p className="text-muted-foreground text-xs">
            View all teachers registered at {school.name}.
          </p>
        </div>
        <AddTeacherModal schoolCode={schoolCode} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Teacher Directory ({teachers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Instructor Name</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Qualification</th>
                <th className="px-6 py-3">Experience</th>
                <th className="px-6 py-3">Contact Email</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No teachers registered yet.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-xs">
                          {teacher.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{teacher.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{teacher.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-muted-foreground">
                      {teacher.employeeId}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {teacher.department}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {teacher.qualification}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {teacher.experience}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {teacher.user.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        teacher.isActive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${teacher.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {teacher.isActive ? "Active" : "Inactive"}
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
