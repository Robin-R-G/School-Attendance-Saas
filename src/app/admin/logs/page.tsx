import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await db.auditLog.findMany({
    include: {
      user: {
        select: {
          name: true,
          role: true,
          school: {
            select: { name: true }
          }
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Global System Audit Logs</h2>
        <p className="text-muted-foreground text-xs">
          Monitor all cross-tenant configurations and administrative activities.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Global Activity Log (Last 50 Entries)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Operator Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">School Tenant</th>
                <th className="px-6 py-3 font-mono">Action Keyword</th>
                <th className="px-6 py-3">Action Details</th>
                <th className="px-6 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {logs.map((log) => {
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
                    <td className="px-6 py-4 font-medium text-foreground">
                      {log.user.school?.name || <span className="italic text-muted-foreground">System Global</span>}
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
