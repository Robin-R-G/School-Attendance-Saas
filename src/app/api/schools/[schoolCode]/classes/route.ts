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

  try {
    const classes = await db.class.findMany({
      where: { schoolId: school.id },
      include: {
        grade: true,
        section: true,
        classTeacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { grade: { level: "asc" } },
    });

    return apiResponse(true, classes, "Classes fetched successfully");
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

  const { gradeId, sectionId, classTeacherId, capacity } = body;

  if (!gradeId || !sectionId || !capacity) {
    return apiError("Missing required fields", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const existing = await db.class.findFirst({
      where: {
        gradeId,
        sectionId,
        schoolId: school.id,
      },
    });

    if (existing) return apiError("Class with this grade and section already exists", 400);

    const newClass = await db.class.create({
      data: {
        schoolId: school.id,
        gradeId,
        sectionId,
        classTeacherId: classTeacherId || null,
        capacity: parseInt(capacity),
      },
    });

    return apiResponse(true, newClass, "Class created successfully", 201);
  } catch (e: any) {
    return apiError(e.message);
  }
}
