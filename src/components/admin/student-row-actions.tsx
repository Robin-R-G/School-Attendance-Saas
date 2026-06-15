"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { archiveStudentAction } from "@/lib/actions/students";
import AddStudentModal from "./add-student-modal";

interface StudentRowActionsProps {
  schoolCode: string;
  classes: Array<{
    id: string;
    grade: { name: string };
    section: { name: string };
  }>;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    admissionNumber: string;
    rollNumber: string;
    dateOfBirth: Date;
    gender: string;
    bloodGroup: string | null;
    admissionDate: Date;
    permanentAddress: string;
    currentAddress: string;
    fatherName: string;
    motherName: string;
    guardianName: string | null;
    contactNumber: string;
    classId: string;
    isArchived: boolean;
  };
}

export default function StudentRowActions({
  schoolCode,
  classes,
  student,
}: StudentRowActionsProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveToggle = async () => {
    if (!confirm(`Are you sure you want to ${student.isArchived ? "restore" : "archive"} this student?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const res = await archiveStudentAction(schoolCode, student.id, !student.isArchived);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message || "Failed to update archive status");
      }
    } catch (e) {
      alert("An unexpected error occurred");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Edit Student Modal */}
      <AddStudentModal
        schoolCode={schoolCode}
        classes={classes}
        student={student}
        triggerBtnClassName="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer hover:shadow-sm transition-all"
      />

      {/* Archive/Restore Action Button */}
      <button
        onClick={handleArchiveToggle}
        disabled={isArchiving}
        className={`p-1.5 rounded-lg border border-border cursor-pointer transition-all hover:shadow-sm ${
          student.isArchived
            ? "text-emerald-600 hover:text-emerald-700 bg-emerald-50/25 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900"
            : "text-amber-600 hover:text-amber-700 bg-amber-50/25 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900"
        }`}
        title={student.isArchived ? "Restore Student Profile" : "Archive Student Profile"}
      >
        {isArchiving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : student.isArchived ? (
          <ArchiveRestore className="h-3.5 w-3.5" />
        ) : (
          <Archive className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
