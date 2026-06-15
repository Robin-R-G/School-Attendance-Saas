import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const subjects = await db.subject.findMany({
    where: { schoolId: school.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Subject Management</h2>
        <p className="text-muted-foreground text-xs">
          View all academic subjects registered at {school.name}.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Subjects List ({subjects.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Subject Name</th>
                <th className="px-6 py-3">Subject Code</th>
                <th className="px-6 py-3">School Identifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground">
                    No subjects registered yet.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-violet-600 dark:text-violet-400">
                      {sub.code}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {school.name}
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
