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
  const classId = url.searchParams.get("classId");

  if (!classId) return apiError("classId is required", 400);

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    const config = await db.classWhatsAppConfig.findUnique({
      where: { classId },
    });

    return apiResponse(true, config, "WhatsApp config fetched");
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
  const { classId, groupLink, teacherId } = body;

  if (!classId || !groupLink || !teacherId) {
    return apiError("classId, groupLink, and teacherId are required", 400);
  }

  const school = await db.school.findUnique({ where: { code: schoolCode } });
  if (!school) return apiError("School not found", 404);

  try {
    // Upsert: create or update the config for this class
    const config = await db.classWhatsAppConfig.upsert({
      where: { classId },
      create: { classId, groupLink, teacherId },
      update: { groupLink, teacherId },
    });

    return apiResponse(true, config, "WhatsApp config saved", 200);
  } catch (e: any) {
    return apiError(e.message);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ schoolCode: string }> }
) {
  const session = await auth();
  if (!session) return apiError("Unauthorized", 401);

  const { schoolCode } = await params;
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");

  if (!classId) return apiError("classId is required", 400);

  try {
    await db.classWhatsAppConfig.deleteMany({
      where: { classId },
    });

    return apiResponse(true, null, "WhatsApp config removed");
  } catch (e: any) {
    return apiError(e.message);
  }
}
