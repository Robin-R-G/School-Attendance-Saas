import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, schoolCode } = session.user;

  if (role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (schoolCode) {
    const roleLower = role.toLowerCase().replace("school_", ""); // admin, teacher, student, parent
    redirect(`/schools/${schoolCode}/${roleLower}`);
  }

  // Fallback if no school code and not super admin
  redirect("/login");
}
