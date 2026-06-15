import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode, assignmentId } = await params;

  // Retrieve teacher profile
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });
  if (!teacher) return apiError("Teacher profile not found", 404);

  try {
    const existing = await db.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) return apiError("Assignment not found", 404);
    if (existing.teacherId !== teacher.id) {
      return apiError("You do not have permission to modify this assignment", 403);
    }

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

    const updated = await db.assignment.update({
      where: { id: assignmentId },
      data: {
        classId,
        subjectId,
        title,
        description,
        dueDate: new Date(dueDate),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_UPDATE",
        details: JSON.stringify({ assignmentId, title, classId }),
      },
    });

    return apiResponse(true, updated, "Assignment updated successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string; assignmentId: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode, assignmentId } = await params;

  // Retrieve teacher profile
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });
  if (!teacher) return apiError("Teacher profile not found", 404);

  try {
    const existing = await db.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) return apiError("Assignment not found", 404);
    if (existing.teacherId !== teacher.id) {
      return apiError("You do not have permission to delete this assignment", 403);
    }

    await db.assignment.delete({
      where: { id: assignmentId },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_DELETE",
        details: JSON.stringify({ assignmentId, title: existing.title }),
      },
    });

    return apiResponse(true, null, "Assignment deleted successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
