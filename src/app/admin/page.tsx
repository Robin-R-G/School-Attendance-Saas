import { db } from "@/lib/db";
import OnboardSchoolModal from "@/components/admin/onboard-school-modal";
import { GraduationCap, Users, ShieldAlert, Building, ShieldCheck, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch system statistics
  const totalSchools = await db.school.count();
  const totalUsers = await db.user.count();
  const activeSchools = await db.school.count({ where: { isActive: true } });
  const totalStudents = await db.student.count();
  const totalTeachers = await db.teacher.count();

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

  const stats = [
    { label: "Total Schools", value: totalSchools, icon: Building, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Schools", value: activeSchools, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Registered Users", value: totalUsers, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Students & Teachers", value: `${totalStudents} / ${totalTeachers}`, icon: GraduationCap, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Super Admin Dashboard</h2>
          <p className="text-muted-foreground text-xs">
            Manage registered schools, oversee subscriptions, and view system metrics.
          </p>
        </div>
        <OnboardSchoolModal />
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-5 bg-card rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboarded Schools List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Registered Schools</h3>
        </div>
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
                <th className="px-6 py-3 text-center">Registered Users</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No schools onboarded yet. Click "Onboard School" to get started.
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold">
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            school.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{school.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-xs">{school.address}</p>
                        </div>
                      </div>
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
                      {school._count.grades} Grades / {school._count.classes} Classes
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        school.isActive
                           ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                           : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${school.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                        {school.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold font-mono">
                      {school._count.users}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/schools/${school.code}/admin`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Enter Workspace</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
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
