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

  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");
  const subjectId = url.searchParams.get("subjectId");
  const examId = url.searchParams.get("examId");

  try {
    // If we're missing query filters, return initial metadata (Taught classes/subjects and active exams)
    if (!classId || !subjectId || !examId) {
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

      const exams = await db.exam.findMany({
        where: { schoolId: school.id },
        orderBy: { startDate: "desc" },
      });

      return apiResponse(
        true,
        { taughtSlots, exams },
        "Grades filter options fetched successfully"
      );
    }

    // Otherwise, fetch students and existing marks for this combo
    const examSubject = await db.examSubject.findFirst({
      where: {
        examId,
        classId,
        subjectId,
      },
    });

    const students = await db.student.findMany({
      where: { classId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
      },
      orderBy: { rollNumber: "asc" },
    });

    const marks = examSubject
      ? await db.examMark.findMany({
          where: { examSubjectId: examSubject.id },
        })
      : [];

    return apiResponse(
      true,
      { examSubject, students, marks },
      "Grades sheet details fetched successfully"
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
    const { classId, subjectId, examId, maxMarks, passingMarks, marksList } = body;

    if (!classId || !subjectId || !examId || !maxMarks || !passingMarks || !Array.isArray(marksList)) {
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

    // Find or create ExamSubject record (the sheet definition)
    let examSubject = await db.examSubject.findFirst({
      where: { examId, classId, subjectId },
    });

    if (examSubject) {
      examSubject = await db.examSubject.update({
        where: { id: examSubject.id },
        data: {
          maxMarks: parseFloat(maxMarks),
          passingMarks: parseFloat(passingMarks),
        },
      });
    } else {
      examSubject = await db.examSubject.create({
        data: {
          examId,
          classId,
          subjectId,
          maxMarks: parseFloat(maxMarks),
          passingMarks: parseFloat(passingMarks),
          date: new Date(), // default to today
        },
      });
    }

    // Save individual student marks in bulk
    const savedMarks = [];
    for (const record of marksList) {
      const existingMark = await db.examMark.findFirst({
        where: {
          examSubjectId: examSubject.id,
          studentId: record.studentId,
        },
      });

      if (existingMark) {
        const updated = await db.examMark.update({
          where: { id: existingMark.id },
          data: {
            marksObtained: parseFloat(record.marksObtained) || 0,
            isAbsent: record.isAbsent || false,
            remarks: record.remarks || null,
          },
        });
        savedMarks.push(updated);
      } else {
        const created = await db.examMark.create({
          data: {
            examSubjectId: examSubject.id,
            studentId: record.studentId,
            marksObtained: parseFloat(record.marksObtained) || 0,
            isAbsent: record.isAbsent || false,
            remarks: record.remarks || null,
          },
        });
        savedMarks.push(created);
      }
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EXAM_MARKS_UPDATE",
        details: JSON.stringify({ examSubjectId: examSubject.id, count: marksList.length }),
      },
    });

    return apiResponse(true, { examSubject, savedMarks }, "Grades saved successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
