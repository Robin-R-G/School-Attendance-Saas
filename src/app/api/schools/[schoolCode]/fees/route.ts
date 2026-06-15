import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";
import { FeeType } from "@/generated/prisma/enums";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  // Check role authorization: Only school admin can issue invoices
  if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return apiError("Forbidden: Access restricted to administrators", 403);
  }

  const { schoolCode } = await params;
  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const body = await request.json();
    const { studentId, type, title, amount, dueDate } = body;

    if (!studentId || !type || !title || amount === undefined || !dueDate) {
      return apiError("Missing required fields", 400);
    }

    // Verify student exists and belongs to this school
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        class: { schoolId: school.id },
      },
    });

    if (!student) {
      return apiError("Student not found in this school", 404);
    }

    // Validate type is a member of FeeType enum
    if (!Object.values(FeeType).includes(type as FeeType)) {
      return apiError(`Invalid fee type: ${type}`, 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return apiError("Amount must be a positive number", 400);
    }

    const invoice = await db.feeInvoice.create({
      data: {
        studentId,
        schoolId: school.id,
        title,
        type: type as FeeType,
        amount: parsedAmount,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "FEE_INVOICE_CREATE",
        details: JSON.stringify({
          invoiceId: invoice.id,
          studentName: `${student.firstName} ${student.lastName}`,
          title,
          amount: parsedAmount,
        }),
      },
    });

    return apiResponse(true, invoice, "Fee invoice issued successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
