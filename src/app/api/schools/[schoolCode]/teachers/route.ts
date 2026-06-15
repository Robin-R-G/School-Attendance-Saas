import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode } = await params;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const department = url.searchParams.get("department") || "";

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  const where: any = {
    user: {
      schoolId: school.id,
    },
  };

  if (department) {
    where.department = department;
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { employeeId: { contains: search } },
    ];
  }

  try {
    const teachers = await db.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return apiResponse(true, teachers, "Teachers fetched successfully");
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

  const {
    email,
    password,
    name,
    employeeId,
    phone,
    qualification,
    experience,
    department,
  } = body;

  if (!email || !password || !name || !employeeId || !phone || !qualification || !experience || !department) {
    return apiError("Missing required fields", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return apiError("Email already in use", 400);

    const existingEmployee = await db.teacher.findFirst({
      where: {
        employeeId,
        user: {
          schoolId: school.id,
        },
      },
    });
    if (existingEmployee) return apiError("Employee ID already exists in this school", 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const newTeacher = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: Role.TEACHER,
          schoolId: school.id,
        },
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          phone,
          qualification,
          experience,
          department,
        },
      });
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TEACHER_CREATE",
        details: JSON.stringify({ employeeId, name }),
      },
    });

    return apiResponse(true, newTeacher, "Teacher created successfully", 201);
  } catch (e: any) {
    return apiError(e.message);
  }
}
