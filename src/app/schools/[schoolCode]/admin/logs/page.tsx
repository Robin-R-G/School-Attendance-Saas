import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const logs = await db.auditLog.findMany({
    where: {
      user: { schoolId: school.id },
    },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Audit Logs</h2>
        <p className="text-muted-foreground text-xs">
          Track administrator operations, attendance overrides, and profile configurations.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Operational History Logs (Last 50 Entries)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Operator Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 font-mono">Action Keyword</th>
                <th className="px-6 py-3">Action Details</th>
                <th className="px-6 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No system log entries recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let parsedDetails = log.details;
                  try {
                    const obj = JSON.parse(log.details);
                    parsedDetails = obj.message || JSON.stringify(obj);
                  } catch (e) {}

                  return (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground">
                        {log.timestamp.toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {log.user.name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-muted-foreground text-[10px] uppercase font-mono">
                        {log.user.role.replace("SCHOOL_", "")}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-violet-600 dark:text-violet-400">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 max-w-sm truncate text-zinc-600 dark:text-zinc-300">
                        {parsedDetails}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground pr-8">
                        {log.ipAddress || "System"}
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
