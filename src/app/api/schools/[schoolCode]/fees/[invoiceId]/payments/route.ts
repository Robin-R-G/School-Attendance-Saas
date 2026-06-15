import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string; invoiceId: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  // Check role authorization: Only school admin can record payments
  if (session.user.role !== "SCHOOL_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return apiError("Forbidden: Access restricted to administrators", 403);
  }

  const { schoolCode, invoiceId } = await params;
  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const body = await request.json();
    const { amount, paymentMethod, transactionId, receiptNumber, paidAt } = body;

    if (amount === undefined || !paymentMethod || !receiptNumber) {
      return apiError("Missing required fields", 400);
    }

    // Verify invoice exists and belongs to this school
    const invoice = await db.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        schoolId: school.id,
      },
      include: {
        student: true,
      },
    });

    if (!invoice) {
      return apiError("Invoice not found in this school", 404);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return apiError("Payment amount must be a positive number", 400);
    }

    // Generate unique receipt number check
    const existingPayment = await db.feePayment.findUnique({
      where: { receiptNumber },
    });
    if (existingPayment) {
      return apiError(`Receipt number ${receiptNumber} already exists. Please use a unique value.`, 400);
    }

    // Run in transaction: create payment and update invoice status
    const [payment] = await db.$transaction([
      db.feePayment.create({
        data: {
          invoiceId,
          amount: parsedAmount,
          paymentMethod,
          transactionId: transactionId || null,
          receiptNumber,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      }),
      db.feeInvoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      }),
    ]);

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "FEE_PAYMENT_RECORD",
        details: JSON.stringify({
          paymentId: payment.id,
          invoiceId,
          studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
          amount: parsedAmount,
          receiptNumber,
        }),
      },
    });

    return apiResponse(true, payment, "Payment recorded and invoice marked as PAID successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
