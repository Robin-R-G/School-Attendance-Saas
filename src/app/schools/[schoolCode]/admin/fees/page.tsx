import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import FeesInvoicesClient from "@/components/admin/fees-invoices-client";

export const dynamic = "force-dynamic";

export default async function AdminFeesPage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const { schoolCode } = await params;

  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) redirect("/login");

  const invoices = await db.feeInvoice.findMany({
    where: { schoolId: school.id },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNumber: true,
          class: {
            include: {
              grade: true,
              section: true,
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Billing & Invoices</h2>
        <p className="text-muted-foreground text-xs">
          Issue fee invoices, track payments, and review outstanding accounts.
        </p>
      </div>

      <FeesInvoicesClient invoices={invoices as any} school={school} />
    </div>
  );
}
