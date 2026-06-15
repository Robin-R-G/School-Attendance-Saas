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

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  // Retrieve teacher profile
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });
  if (!teacher) return apiError("Teacher profile not found", 404);

  try {
    // Taught subjects & classes
    const taughtSlots = await db.classSubjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            grade: true,
            section: true,
          },
        },
        subject: true,
      },
    });

    // Assignments published by this teacher
    const assignments = await db.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            grade: true,
            section: true,
          },
        },
        subject: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return apiResponse(
      true,
      { taughtSlots, assignments },
      "Teacher assignment data fetched successfully"
    );
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
  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  // Retrieve teacher profile
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });
  if (!teacher) return apiError("Teacher profile not found", 404);

  try {
    const body = await request.json();
    const { classId, subjectId, title, description, dueDate } = body;

    if (!classId || !subjectId || !title || !description || !dueDate) {
      return apiError("Missing required fields", 400);
    }

    // Verify teacher teaches this class and subject combination
    const isTaught = await db.classSubjectTeacher.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        subjectId,
      },
    });
    if (!isTaught) {
      return apiError("You do not teach this subject/class combination", 403);
    }

    const assignment = await db.assignment.create({
      data: {
        classId,
        subjectId,
        teacherId: teacher.id,
        title,
        description,
        dueDate: new Date(dueDate),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_CREATE",
        details: JSON.stringify({ assignmentId: assignment.id, title, classId }),
      },
    });

    return apiResponse(true, assignment, "Assignment created successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
