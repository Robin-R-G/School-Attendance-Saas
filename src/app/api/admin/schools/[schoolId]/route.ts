import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-helper";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return apiError("Unauthorized", 401);
  }

  const { schoolId } = await params;
  const body = await request.json();
  
  const {
    name,
    code,
    address,
    email,
    phone,
    logoUrl,
    principalName,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    textColor,
    isActive,
  } = body;

  try {
    const existingSchool = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return apiError("School not found", 404);
    }

    // Check code uniqueness if code is changed
    if (code && code !== existingSchool.code) {
      const codeDuplicate = await db.school.findUnique({ where: { code } });
      if (codeDuplicate) {
        return apiError("School code already in use", 400);
      }
    }

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        name: name !== undefined ? name : undefined,
        code: code !== undefined ? code : undefined,
        address: address !== undefined ? address : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        principalName: principalName !== undefined ? principalName : undefined,
        primaryColor: primaryColor !== undefined ? primaryColor : undefined,
        secondaryColor: secondaryColor !== undefined ? secondaryColor : undefined,
        accentColor: accentColor !== undefined ? accentColor : undefined,
        backgroundColor: backgroundColor !== undefined ? backgroundColor : undefined,
        textColor: textColor !== undefined ? textColor : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SCHOOL_UPDATE",
        details: JSON.stringify({ id: schoolId, name: updatedSchool.name, changes: Object.keys(body) }),
      },
    });

    return apiResponse(true, updatedSchool, "School branding updated successfully");
  } catch (e: any) {
    return apiError(e.message);
  }
}
