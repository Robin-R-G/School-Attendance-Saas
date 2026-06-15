import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode } = await params;
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  const where: any = {};
  if (studentId) {
    where.studentId = studentId;
  } else if (session.user.role === "PARENT") {
    const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
    if (parent) {
      where.parentId = parent.id;
    }
  } else if (session.user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: { classes: true },
    });
    if (teacher) {
      where.student = {
        classId: { in: teacher.classes.map((c) => c.id) },
      };
    }
  }

  try {
    const leaves = await db.leaveRequest.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(true, leaves, "Leave requests fetched successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") {
    return apiError("Unauthorized - Only parents can submit leave requests", 403);
  }

  const { schoolCode } = await params;
  const body = await request.json();
  const { studentId, reason, fromDate, toDate } = body;

  if (!studentId || !reason || !fromDate || !toDate) {
    return apiError("Missing required fields", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const parent = await db.parent.findUnique({ where: { userId: session.user.id } });
    if (!parent) return apiError("Parent profile not found", 404);

    const leave = await db.leaveRequest.create({
      data: {
        studentId,
        parentId: parent.id,
        reason,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        status: "PENDING",
      },
    });

    return apiResponse(true, leave, "Leave request submitted successfully", 201);
  } catch (e: any) {
    return apiError(e.message);
  }
}
