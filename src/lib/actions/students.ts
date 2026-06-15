"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface StudentInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // only required for create
  admissionNumber: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  admissionDate: string;
  permanentAddress: string;
  currentAddress: string;
  fatherName: string;
  motherName: string;
  guardianName?: string;
  contactNumber: string;
  classId: string;
}

export async function createStudentAction(schoolCode: string, data: StudentInput) {
  try {
    if (!data.password) {
      return { success: false, message: "Password is required for new students" };
    }

    const school = await db.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      return { success: false, message: "School not found" };
    }

    // Check unique email
    const existingUser = await db.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return { success: false, message: "Email already in use" };
    }

    // Check unique admissionNumber
    const existingStudent = await db.student.findUnique({ where: { admissionNumber: data.admissionNumber } });
    if (existingStudent) {
      return { success: false, message: "Admission number already exists" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const fullName = `${data.firstName} ${data.lastName}`;

    const student = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "STUDENT",
          name: fullName,
          schoolId: school.id,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          admissionNumber: data.admissionNumber,
          rollNumber: data.rollNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          admissionDate: new Date(data.admissionDate),
          permanentAddress: data.permanentAddress,
          currentAddress: data.currentAddress,
          fatherName: data.fatherName,
          motherName: data.motherName,
          guardianName: data.guardianName || null,
          contactNumber: data.contactNumber,
          email: data.email,
          classId: data.classId,
        },
      });
    });

    revalidatePath(`/schools/${schoolCode}/admin/students`);
    revalidatePath(`/schools/${schoolCode}/teacher/students`);

    return { success: true, data: student };
  } catch (e: any) {
    return { success: false, message: e.message || "An error occurred while creating student" };
  }
}

export async function updateStudentAction(
  schoolCode: string,
  studentId: string,
  data: Omit<StudentInput, "password">
) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return { success: false, message: "Student not found" };
    }

    // Check unique email if it changed
    if (data.email !== student.email) {
      const existingUser = await db.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        return { success: false, message: "Email already in use" };
      }
    }

    // Check unique admissionNumber if it changed
    if (data.admissionNumber !== student.admissionNumber) {
      const existingStudent = await db.student.findUnique({ where: { admissionNumber: data.admissionNumber } });
      if (existingStudent) {
        return { success: false, message: "Admission number already exists" };
      }
    }

    const fullName = `${data.firstName} ${data.lastName}`;

    const updatedStudent = await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: {
          email: data.email,
          name: fullName,
        },
      });

      return tx.student.update({
        where: { id: studentId },
        data: {
          admissionNumber: data.admissionNumber,
          rollNumber: data.rollNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          admissionDate: new Date(data.admissionDate),
          permanentAddress: data.permanentAddress,
          currentAddress: data.currentAddress,
          fatherName: data.fatherName,
          motherName: data.motherName,
          guardianName: data.guardianName || null,
          contactNumber: data.contactNumber,
          email: data.email,
          classId: data.classId,
        },
      });
    });

    revalidatePath(`/schools/${schoolCode}/admin/students`);
    revalidatePath(`/schools/${schoolCode}/teacher/students`);

    return { success: true, data: updatedStudent };
  } catch (e: any) {
    return { success: false, message: e.message || "An error occurred while updating student" };
  }
}

export async function archiveStudentAction(schoolCode: string, studentId: string, isArchived: boolean) {
  try {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return { success: false, message: "Student not found" };
    }

    await db.student.update({
      where: { id: studentId },
      data: { isArchived },
    });

    revalidatePath(`/schools/${schoolCode}/admin/students`);
    revalidatePath(`/schools/${schoolCode}/teacher/students`);

    return { success: true, message: `Student profile ${isArchived ? "archived" : "unarchived"} successfully` };
  } catch (e: any) {
    return { success: false, message: e.message || "An error occurred while archiving student" };
  }
}
