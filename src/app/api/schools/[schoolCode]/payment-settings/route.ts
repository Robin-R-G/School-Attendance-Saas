import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  // Check role authorization: Only school admin can update configuration
  if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return apiError("Forbidden: Access restricted to administrators", 403);
  }

  const { schoolCode } = await params;
  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const body = await request.json();
    const { bankName, bankAccountName, bankAccountNumber, bankIfscCode, upiId } = body;

    const updatedSchool = await db.school.update({
      where: { id: school.id },
      data: {
        bankName: bankName || null,
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankIfscCode: bankIfscCode || null,
        upiId: upiId || null,
      },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SCHOOL_PAYMENT_SETTINGS_UPDATE",
        details: JSON.stringify({
          bankName,
          upiId,
        }),
      },
    });

    return apiResponse(true, updatedSchool, "Payment settings updated successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
