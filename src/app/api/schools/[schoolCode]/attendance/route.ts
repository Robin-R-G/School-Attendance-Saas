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
  const dateStr = url.searchParams.get("date");
  const classId = url.searchParams.get("classId");

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  const where: any = {
    student: {
      user: {
        schoolId: school.id,
      },
    },
  };

  if (dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  if (classId) {
    where.classId = classId;
  }

  try {
    const records = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
            rollNumber: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return apiResponse(true, records, "Attendance records fetched");
  } catch (e: any) {
    return apiError(e.message);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode } = await params;
  const body = await request.json();
  const { classId, date, records } = body;

  if (!classId || !date || !records || !Array.isArray(records)) {
    return apiError("Missing required fields", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const dateObj = new Date(date);
    dateObj.setHours(12, 0, 0, 0);

    const markedRecords = await Promise.all(
      records.map(async (rec: any) => {
        const existing = await db.attendance.findFirst({
          where: {
            studentId: rec.studentId,
            classId,
            date: {
              gte: new Date(dateObj.getTime() - 12 * 60 * 60 * 1000),
              lte: new Date(dateObj.getTime() + 12 * 60 * 60 * 1000),
            },
          },
        });

        if (existing) {
          return db.attendance.update({
            where: { id: existing.id },
            data: {
              status: rec.status,
              remarks: rec.remarks,
              markedById: session.user.id,
            },
          });
        } else {
          return db.attendance.create({
            data: {
              studentId: rec.studentId,
              classId,
              date: dateObj,
              status: rec.status,
              remarks: rec.remarks,
              markedById: session.user.id,
            },
          });
        }
      })
    );

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ATTENDANCE_MARK",
        details: JSON.stringify({ classId, date, count: records.length }),
      },
    });

    return apiResponse(true, markedRecords, "Attendance marked successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
