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

  const classId = url.searchParams.get("classId");
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  const where: any = {
    user: {
      schoolId: school.id,
    },
    isArchived: false,
  };

  if (classId) {
    where.classId = classId;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { admissionNumber: { contains: search } },
    ];
  }

  try {
    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class: {
            include: {
              grade: true,
              section: true,
            },
          },
        },
        orderBy: { firstName: "asc" },
        skip,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return apiResponse(
      true,
      {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Students fetched successfully"
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
  const body = await request.json();

  const {
    email,
    password,
    name,
    admissionNumber,
    rollNumber,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodGroup,
    photoUrl,
    admissionDate,
    permanentAddress,
    currentAddress,
    fatherName,
    motherName,
    guardianName,
    contactNumber,
    classId,
  } = body;

  if (
    !email ||
    !password ||
    !name ||
    !admissionNumber ||
    !firstName ||
    !lastName ||
    !dateOfBirth ||
    !gender ||
    !admissionDate ||
    !permanentAddress ||
    !currentAddress ||
    !contactNumber ||
    !classId
  ) {
    return apiError("Missing required fields", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return apiError("Email already in use", 400);

    const existingAdmission = await db.student.findUnique({ where: { admissionNumber } });
    if (existingAdmission) return apiError("Admission number already exists", 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const newStudent = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: Role.STUDENT,
          schoolId: school.id,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          admissionNumber,
          rollNumber: rollNumber || "",
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodGroup,
          photoUrl,
          admissionDate: new Date(admissionDate),
          permanentAddress,
          currentAddress,
          fatherName,
          motherName,
          guardianName,
          contactNumber,
          email,
          classId,
        },
      });
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "STUDENT_CREATE",
        details: JSON.stringify({ admissionNumber, name: `${firstName} ${lastName}` }),
      },
    });

    return apiResponse(true, newStudent, "Student created successfully", 201);
  } catch (e: any) {
    return apiError(e.message);
  }
}
