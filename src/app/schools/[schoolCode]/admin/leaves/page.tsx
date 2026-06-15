import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLeavesPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const leaves = await db.leaveRequest.findMany({
    where: {
      student: {
        user: { schoolId: school.id },
      },
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          class: {
            include: {
              grade: true,
              section: true,
            },
          },
        },
      },
      parent: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Leave Requests Approval</h2>
        <p className="text-muted-foreground text-xs">
          Review and update student leave applications submitted by parents.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Leave Requests Register ({leaves.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Class Section</th>
                <th className="px-6 py-3">Parent / Contact</th>
                <th className="px-6 py-3">Date Range</th>
                <th className="px-6 py-3">Leave Reason</th>
                <th className="px-6 py-3 text-right">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No leave requests submitted yet.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      {l.student.firstName} {l.student.lastName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-muted-foreground">
                      {l.student.class.grade.name} - {l.student.class.section.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{l.parent.firstName} {l.parent.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{l.parent.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-muted-foreground">
                      {l.fromDate.toISOString().split("T")[0]} to {l.toDate.toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4 max-w-xs text-zinc-600 dark:text-zinc-300">
                      {l.reason}
                    </td>
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
