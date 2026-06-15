import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return apiError("Unauthorized", 401);
  }

  try {
    const schools = await db.school.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(true, schools, "Schools fetched successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return apiError("Unauthorized", 401);
  }

  const body = await request.json();
  const {
    name,
    code,
    address,
    email,
    phone,
    logoUrl,
    principalName,
    adminName,
    adminEmail,
    adminPassword,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
  } = body;

  if (
    !name ||
    !code ||
    !address ||
    !email ||
    !phone ||
    !principalName ||
    !adminName ||
    !adminEmail ||
    !adminPassword
  ) {
    return apiError("Missing required fields", 400);
  }

  try {
    const existingSchool = await db.school.findUnique({ where: { code } });
    if (existingSchool) {
      return apiError("School code already in use", 400);
    }

    const existingUser = await db.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return apiError("Admin email already in use", 400);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await db.$transaction(async (tx) => {
      const newSchool = await tx.school.create({
        data: {
          name,
          code,
          address,
          email,
          phone,
          logoUrl: logoUrl || null,
          principalName,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          accentColor: accentColor || null,
          backgroundColor: backgroundColor || null,
          textColor: textColor || null,
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "SCHOOL_ADMIN",
          name: adminName,
          schoolId: newSchool.id,
        },
      });

      return { school: newSchool, user: newUser };
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SCHOOL_CREATE",
        details: JSON.stringify({ code: result.school.code, name: result.school.name, adminEmail }),
      },
    });

    return apiResponse(true, result.school, "School and admin onboarded successfully", 201);
  } catch (e: any) {
    return apiError(e.message);
  }
}

