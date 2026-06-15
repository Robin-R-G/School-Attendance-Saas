import "dotenv/config";
import { PrismaClient, Role, AttendanceStatus, DayOfWeek, SubmissionStatus, FeeType, InvoiceStatus, LeaveStatus, NotificationChannel, NotificationType } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

console.log("DATABASE_URL from process.env:", process.env.DATABASE_URL);

const adapter = new PrismaLibSql({
  url: "file:dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // Clear existing database records
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.examMark.deleteMany({});
  await prisma.examSubject.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.classSubjectTeacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.studentParent.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@schoolerp.com",
      name: "Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log("Super Admin created:", superAdmin.email);

  // 2. Create School
  const school = await prisma.school.create({
    data: {
      name: "Grand Academy",
      code: "grand-academy",
      address: "123 Education Lane, Science City",
      email: "info@grandacademy.edu",
      phone: "+1 555-0199",
      principalName: "Dr. Arthur Vance",
      logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200",
    },
  });
  console.log("School created:", school.name);

  // 3. Create School Admin User
  const schoolAdmin = await prisma.user.create({
    data: {
      email: "admin@grandacademy.edu",
      name: "Alice Vance (Admin)",
      passwordHash,
      role: Role.SCHOOL_ADMIN,
      schoolId: school.id,
    },
  });
  console.log("School Admin created:", schoolAdmin.email);

  // 4. Create Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: "john.doe@grandacademy.edu",
      name: "John Doe",
      passwordHash,
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      employeeId: "EMP001",
      phone: "+1 555-0111",
      qualification: "M.Sc. Mathematics",
      experience: "8 Years",
      department: "Mathematics",
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: "jane.smith@grandacademy.edu",
      name: "Jane Smith",
      passwordHash,
      role: Role.TEACHER,
      schoolId: school.id,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      employeeId: "EMP002",
      phone: "+1 555-0122",
      qualification: "Ph.D. Physics",
      experience: "12 Years",
      department: "Sciences",
    },
  });
  console.log("Teachers created:", teacherUser1.email, ",", teacherUser2.email);

  // 5. Create Grade & Section
  const grade10 = await prisma.grade.create({
    data: {
      schoolId: school.id,
      name: "Grade 10",
      level: 10,
    },
  });

  const sectionA = await prisma.section.create({
    data: {
      schoolId: school.id,
      name: "A",
    },
  });

  const sectionB = await prisma.section.create({
    data: {
      schoolId: school.id,
      name: "B",
    },
  });

  // 6. Create Classes (Grade + Section combo)
  const class10A = await prisma.class.create({
    data: {
      schoolId: school.id,
      gradeId: grade10.id,
      sectionId: sectionA.id,
      classTeacherId: teacher1.id,
      capacity: 30,
    },
  });

  const class10B = await prisma.class.create({
    data: {
      schoolId: school.id,
      gradeId: grade10.id,
      sectionId: sectionB.id,
      classTeacherId: teacher2.id,
      capacity: 30,
    },
  });
  console.log("Classes created: Grade 10-A, Grade 10-B");

  // 7. Create Subjects
  const mathSubject = await prisma.subject.create({
    data: {
      schoolId: school.id,
      name: "Mathematics",
      code: "MATH10",
    },
  });

  const scienceSubject = await prisma.subject.create({
    data: {
      schoolId: school.id,
      name: "Science",
      code: "SCI10",
    },
  });

  // Link Subject, Class, and Teacher
  await prisma.classSubjectTeacher.createMany({
    data: [
      { classId: class10A.id, subjectId: mathSubject.id, teacherId: teacher1.id },
      { classId: class10A.id, subjectId: scienceSubject.id, teacherId: teacher2.id },
      { classId: class10B.id, subjectId: mathSubject.id, teacherId: teacher1.id },
      { classId: class10B.id, subjectId: scienceSubject.id, teacherId: teacher2.id },
    ],
  });

  // 8. Create Parents
  const parentUser1 = await prisma.user.create({
    data: {
      email: "robert.miller@gmail.com",
      name: "Robert Miller",
      passwordHash,
      role: Role.PARENT,
      schoolId: school.id,
    },
  });

  const parent1 = await prisma.parent.create({
    data: {
      userId: parentUser1.id,
      firstName: "Robert",
      lastName: "Miller",
      phone: "+1 555-0133",
      email: "robert.miller@gmail.com",
    },
  });

  const parentUser2 = await prisma.user.create({
    data: {
      email: "sarah.davis@gmail.com",
      name: "Sarah Davis",
      passwordHash,
      role: Role.PARENT,
      schoolId: school.id,
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      userId: parentUser2.id,
      firstName: "Sarah",
      lastName: "Davis",
      phone: "+1 555-0144",
      email: "sarah.davis@gmail.com",
    },
  });
  console.log("Parents created:", parentUser1.email, ",", parentUser2.email);

  // 9. Create Students
  const studentUser1 = await prisma.user.create({
    data: {
      email: "sam.miller@grandacademy.edu",
      name: "Sam Miller",
      passwordHash,
      role: Role.STUDENT,
      schoolId: school.id,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      admissionNumber: "ADM-2026-001",
      rollNumber: "10",
      firstName: "Sam",
      lastName: "Miller",
      dateOfBirth: new Date("2011-04-12"),
      gender: "Male",
      bloodGroup: "O+",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100",
      admissionDate: new Date("2026-01-15"),
      permanentAddress: "45 Oak St, Science City",
      currentAddress: "45 Oak St, Science City",
      fatherName: "Robert Miller",
      motherName: "Emily Miller",
      contactNumber: "+1 555-0133",
      email: "sam.miller@grandacademy.edu",
      classId: class10A.id,
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: "lisa.davis@grandacademy.edu",
      name: "Lisa Davis",
      passwordHash,
      role: Role.STUDENT,
      schoolId: school.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      admissionNumber: "ADM-2026-002",
      rollNumber: "12",
      firstName: "Lisa",
      lastName: "Davis",
      dateOfBirth: new Date("2011-08-22"),
      gender: "Female",
      bloodGroup: "A-",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      admissionDate: new Date("2026-01-15"),
      permanentAddress: "78 Pine Avenue, Science City",
      currentAddress: "78 Pine Avenue, Science City",
      fatherName: "David Davis",
      motherName: "Sarah Davis",
      contactNumber: "+1 555-0144",
      email: "lisa.davis@grandacademy.edu",
      classId: class10A.id,
    },
  });
  console.log("Students created:", studentUser1.email, ",", studentUser2.email);

  // Link Students with Parents
  await prisma.studentParent.createMany({
    data: [
      { studentId: student1.id, parentId: parent1.id },
      { studentId: student2.id, parentId: parent2.id },
    ],
  });

  // 10. Seed Attendance
  const dates = [
    new Date("2026-06-11"),
    new Date("2026-06-12"),
    new Date("2026-06-15"),
  ];

  for (const date of dates) {
    await prisma.attendance.create({
      data: {
        studentId: student1.id,
        classId: class10A.id,
        date,
        status: AttendanceStatus.PRESENT,
        markedById: teacherUser1.id,
      },
    });

    await prisma.attendance.create({
      data: {
        studentId: student2.id,
        classId: class10A.id,
        date,
        status: date.getDate() === 12 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
        remarks: date.getDate() === 12 ? "Doctor appointment" : null,
        markedById: teacherUser1.id,
      },
    });
  }
  console.log("Attendance records seeded.");

  // 11. Timetable Slots
  await prisma.timetableSlot.createMany({
    data: [
      { classId: class10A.id, subjectId: mathSubject.id, teacherId: teacher1.id, dayOfWeek: DayOfWeek.MONDAY, startTime: "08:30", endTime: "09:30", room: "Room 101" },
      { classId: class10A.id, subjectId: scienceSubject.id, teacherId: teacher2.id, dayOfWeek: DayOfWeek.MONDAY, startTime: "09:45", endTime: "10:45", room: "Lab 2" },
      { classId: class10A.id, subjectId: mathSubject.id, teacherId: teacher1.id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "08:30", endTime: "09:30", room: "Room 101" },
      { classId: class10A.id, subjectId: scienceSubject.id, teacherId: teacher2.id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "08:30", endTime: "09:30", room: "Lab 2" },
    ],
  });
  console.log("Timetable slots seeded.");

  // 12. Assignments
  const assignment = await prisma.assignment.create({
    data: {
      classId: class10A.id,
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      title: "Algebraic Equations Homework",
      description: "Complete exercises 4 to 12 on page 78 of the math textbook. Submit work in PDF or image format.",
      dueDate: new Date("2026-06-22T23:59:59"),
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment.id,
      studentId: student1.id,
      status: SubmissionStatus.SUBMITTED,
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      submittedAt: new Date("2026-06-14T18:30:00"),
    },
  });
  console.log("Assignments seeded.");

  // 13. Fee Invoices
  await prisma.feeInvoice.createMany({
    data: [
      {
        studentId: student1.id,
        schoolId: school.id,
        title: "Grade 10 Tuition Fee - Q2",
        type: FeeType.TUITION,
        amount: 1200.0,
        dueDate: new Date("2026-07-01"),
        status: InvoiceStatus.PENDING,
      },
      {
        studentId: student2.id,
        schoolId: school.id,
        title: "Grade 10 Tuition Fee - Q2",
        type: FeeType.TUITION,
        amount: 1200.0,
        dueDate: new Date("2026-07-01"),
        status: InvoiceStatus.PAID,
      },
    ],
  });

  const invoice2 = await prisma.feeInvoice.findFirst({
    where: { studentId: student2.id },
  });

  if (invoice2) {
    await prisma.feePayment.create({
      data: {
        invoiceId: invoice2.id,
        amount: 1200.0,
        paymentMethod: "CREDIT_CARD",
        transactionId: "TXN_998172651",
        receiptNumber: "REC-2026-0001",
        paidAt: new Date("2026-06-10T11:00:00"),
      },
    });
  }
  console.log("Invoices and payments seeded.");

  // 14. Exam and Marks
  const exam = await prisma.exam.create({
    data: {
      schoolId: school.id,
      name: "Mid-Term Examination",
      term: "Term 1",
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-18"),
    },
  });

  const examMath = await prisma.examSubject.create({
    data: {
      examId: exam.id,
      subjectId: mathSubject.id,
      classId: class10A.id,
      date: new Date("2026-05-11T09:00:00"),
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  await prisma.examMark.createMany({
    data: [
      { examSubjectId: examMath.id, studentId: student1.id, marksObtained: 88.5 },
      { examSubjectId: examMath.id, studentId: student2.id, marksObtained: 92.0 },
    ],
  });
  console.log("Exams and marks seeded.");

  // 15. Leave Requests
  await prisma.leaveRequest.create({
    data: {
      studentId: student1.id,
      parentId: parent1.id,
      reason: "Family wedding event in home town",
      fromDate: new Date("2026-06-25"),
      toDate: new Date("2026-06-28"),
      status: LeaveStatus.PENDING,
    },
  });
  console.log("Leave requests seeded.");

  // 16. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: schoolAdmin.id,
      action: "SCHOOL_CONFIG_UPDATE",
      details: JSON.stringify({ message: "Updated school details and academic parameters" }),
      ipAddress: "192.168.1.10",
    },
  });
  console.log("Audit logs seeded.");

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
