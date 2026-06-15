import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const classes = await db.class.findMany({
    where: { schoolId: school.id },
    include: {
      grade: true,
      section: true,
      classTeacher: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: { grade: { level: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Classes & Sections</h2>
        <p className="text-muted-foreground text-xs">
          Manage classroom limits, assign class advisors, and track student enrollment.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Classroom Directory ({classes.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Class Section</th>
                <th className="px-6 py-3">Grade Level Weight</th>
                <th className="px-6 py-3">Class Advisor Teacher</th>
                <th className="px-6 py-3">Student Enrollment</th>
                <th className="px-6 py-3 text-right">Remaining Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    No classes registered yet.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => {
                  const studentCount = cls._count.students;
                  const remaining = Math.max(0, cls.capacity - studentCount);
                  return (
                    <tr key={cls.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        {cls.grade.name} - {cls.section.name}
                      </td>
                      <td className="px-6 py-4 font-semibold font-mono text-muted-foreground">
                        Level {cls.grade.level}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {cls.classTeacher?.user.name || (
                          <span className="text-muted-foreground font-normal italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-foreground">{studentCount}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-muted-foreground font-mono">{cls.capacity} max</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold font-mono pr-8 text-muted-foreground">
                        {remaining} seats
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
