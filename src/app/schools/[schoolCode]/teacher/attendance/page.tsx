import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AttendanceMarkingClient from "@/components/teacher/attendance-marking-client";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage({
  params,
}: {
  params: Promise<{ schoolCode: string }>;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const { schoolCode } = await params;

  // Resolve school record
  const school = await db.school.findUnique({
    where: { code: schoolCode },
  });

  if (!school) {
    redirect("/login");
  }

  // Find teacher profile for passing teacherId
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });

  // Fetch classes for the dropdown picker
  const classes = await db.class.findMany({
    where: { schoolId: school.id },
    include: {
      grade: true,
      section: true,
    },
    orderBy: { grade: { level: "asc" } },
  });

  // Fetch subjects for the subject picker
  const subjects = await db.subject.findMany({
    where: { schoolId: school.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Class Attendance Workspace</h2>
        <p className="text-muted-foreground text-xs">
          Select class, subject, and date. Use toggles to mark students and click Submit.
        </p>
      </div>

      {/* Main client component */}
      <AttendanceMarkingClient
        classes={classes}
        subjects={subjects}
        schoolCode={schoolCode}
        teacherId={teacher?.id}
      />
    </div>
  );
}
