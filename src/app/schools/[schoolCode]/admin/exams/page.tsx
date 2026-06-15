import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const exams = await db.exam.findMany({
    where: { schoolId: school.id },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Examinations & Grading</h2>
        <p className="text-muted-foreground text-xs">
          Schedule academic terms, track test subjects, and oversee final grade points.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Active Exams ({exams.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Exam Title</th>
                <th className="px-6 py-3">Term Identifier</th>
                <th className="px-6 py-3 font-mono">Start Date</th>
                <th className="px-6 py-3 font-mono">End Date</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    No examinations scheduled yet.
                  </td>
                </tr>
              ) : (
                exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {ex.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground uppercase text-[10px] font-mono">
                      {ex.term}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {ex.startDate.toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {ex.endDate.toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4 text-right pr-8">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Published
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
