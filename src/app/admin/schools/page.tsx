import { db } from "@/lib/db";
import OnboardSchoolModal from "@/components/admin/onboard-school-modal";
import EditBrandingModal from "@/components/admin/edit-branding-modal";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsListPage() {
  const schools = await db.school.findMany({
    include: {
      _count: {
        select: {
          users: true,
          grades: true,
          classes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Onboarded Schools Directory</h2>
          <p className="text-muted-foreground text-xs">
            Review and onboard institutional tenants inside Aether ERP.
          </p>
        </div>
        <OnboardSchoolModal />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">School Name</th>
                <th className="px-6 py-3">Code (Slug)</th>
                <th className="px-6 py-3">Principal</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Grades / Classes</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Users</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{school.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-xs">{school.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-0.5 rounded bg-secondary text-[11px] font-semibold text-muted-foreground border border-border">
                      {school.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 font-medium">{school.principalName}</td>
                  <td className="px-6 py-4">
                    <p>{school.email}</p>
                    <p className="text-[10px] text-muted-foreground">{school.phone}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">
                    {school._count.grades} G / {school._count.classes} C
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      school.isActive
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${school.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold font-mono">
                    {school._count.users}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditBrandingModal school={school} />
                      <a
                        href={`/schools/${school.code}/admin`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Enter Workspace</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
