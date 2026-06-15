"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCheck, AlertTriangle, Clock, Check, Loader2, Sparkles,
  MessageCircle, Copy, ExternalLink, X, Settings, Send
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AttendanceMarkingClientProps {
  classes: Array<{
    id: string;
    grade: { name: string };
    section: { name: string };
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  schoolCode: string;
  teacherId?: string;
}

interface StudentRecord {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
}

interface AttendanceState {
  [studentId: string]: {
    status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE";
    remarks: string;
  };
}

export default function AttendanceMarkingClient({ classes, subjects, schoolCode, teacherId }: AttendanceMarkingClientProps) {
  const router = useRouter();

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState("2026-06-15");

  // Students and attendance records
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});

  // UI state
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // WhatsApp state
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [whatsappTab, setWhatsappTab] = useState<"group" | "individual">("group");

  // Get selected class label
  const getClassLabel = useCallback(() => {
    const cls = classes.find((c) => c.id === selectedClassId);
    return cls ? `${cls.grade.name} - ${cls.section.name}` : "Unknown Class";
  }, [classes, selectedClassId]);

  // Fetch WhatsApp config when class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchWhatsAppConfig = async () => {
      setIsLoadingWhatsApp(true);
      try {
        const res = await fetch(`/api/schools/${schoolCode}/whatsapp-config?classId=${selectedClassId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setWhatsappGroupLink(data.data.groupLink || "");
          setWhatsappInput(data.data.groupLink || "");
        } else {
          setWhatsappGroupLink("");
          setWhatsappInput("");
        }
      } catch {
        setWhatsappGroupLink("");
        setWhatsappInput("");
      } finally {
        setIsLoadingWhatsApp(false);
      }
    };

    fetchWhatsAppConfig();
  }, [selectedClassId, schoolCode]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      setNotification(null);
      setIsSubmitted(false);
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students?classId=${selectedClassId}&limit=100`);
        const data = await res.json();
        if (data.success && data.data.students) {
          const list = data.data.students;
          setStudents(list);
          const defaultState: AttendanceState = {};
          list.forEach((std: StudentRecord) => {
            defaultState[std.id] = { status: "PRESENT", remarks: "" };
          });
          setAttendance(defaultState);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedClassId, schoolCode]);

  // Bulk status update
  const handleBulkUpdate = (status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE") => {
    const updatedState = { ...attendance };
    students.forEach((std) => {
      updatedState[std.id] = { ...updatedState[std.id], status };
    });
    setAttendance(updatedState);
  };

  // Single student status update
  const handleStatusUpdate = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE") => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  // Single student remarks update
  const handleRemarksUpdate = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  // Form submission
  const handleSaveAttendance = async () => {
    setIsSubmitting(true);
    setNotification(null);

    const recordsPayload = Object.entries(attendance).map(([studentId, val]) => ({
      studentId,
      status: val.status,
      remarks: val.remarks || null,
    }));

    try {
      const response = await fetch(`/api/schools/${schoolCode}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          date: selectedDate,
          records: recordsPayload,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNotification({ type: "success", message: "Class attendance records saved successfully!" });
        setIsSubmitted(true);
        router.refresh();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to submit attendance." });
      }
    } catch (e) {
      setNotification({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save WhatsApp group link
  const handleSaveWhatsApp = async () => {
    if (!whatsappInput.trim()) return;
    setIsSavingWhatsApp(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/whatsapp-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          groupLink: whatsappInput.trim(),
          teacherId: teacherId || "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWhatsappGroupLink(whatsappInput.trim());
        setIsWhatsAppModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to save WhatsApp config:", e);
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  // Remove WhatsApp group link
  const handleRemoveWhatsApp = async () => {
    try {
      await fetch(`/api/schools/${schoolCode}/whatsapp-config?classId=${selectedClassId}`, { method: "DELETE" });
      setWhatsappGroupLink("");
      setWhatsappInput("");
      setIsWhatsAppModalOpen(false);
    } catch (e) {
      console.error("Failed to remove WhatsApp config:", e);
    }
  };

  // Build the WhatsApp notification message
  const buildWhatsAppMessage = () => {
    const classLabel = getClassLabel();
    const absentStudents = students.filter((s) => attendance[s.id]?.status === "ABSENT");
    const lateStudents = students.filter((s) => attendance[s.id]?.status === "LATE");

    if (absentStudents.length === 0 && lateStudents.length === 0) {
      return `✅ *ATTENDANCE REPORT*\n📅 Date: ${selectedDate}\n🏫 Class: ${classLabel}\n\n🎉 All students are present today! Great attendance!`;
    }

    let message = `📋 *ATTENDANCE REPORT*\n📅 Date: ${selectedDate}\n🏫 Class: ${classLabel}\n`;

    if (absentStudents.length > 0) {
      message += `\n❌ *ABSENT STUDENTS (${absentStudents.length}):*\n`;
      absentStudents.forEach((s, i) => {
        const remarks = attendance[s.id]?.remarks;
        message += `${i + 1}. ${s.firstName} ${s.lastName} (Roll: ${s.rollNumber})`;
        if (remarks) message += ` — _${remarks}_`;
        message += `\n`;
      });
    }

    if (lateStudents.length > 0) {
      message += `\n⏰ *LATE ARRIVALS (${lateStudents.length}):*\n`;
      lateStudents.forEach((s, i) => {
        const remarks = attendance[s.id]?.remarks;
        message += `${i + 1}. ${s.firstName} ${s.lastName} (Roll: ${s.rollNumber})`;
        if (remarks) message += ` — _${remarks}_`;
        message += `\n`;
      });
    }

    const presentCount = students.filter((s) => attendance[s.id]?.status === "PRESENT" || attendance[s.id]?.status === "LATE").length;
    message += `\n📊 *Summary:* ${presentCount}/${students.length} present`;
    message += `\n\n_Sent via Aether ERP_`;

    return message;
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(buildWhatsAppMessage());
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  // Open WhatsApp with pre-filled text (generic share — user picks group)
  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  // Clean phone number for WhatsApp wa.me link
  const cleanPhoneNumber = (num?: string) => {
    if (!num) return "";
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return "91" + cleaned; // Assume Indian phone number if 10 digits
    }
    return cleaned;
  };

  // Build the personalized WhatsApp message for a single student's parent
  const buildIndividualWhatsAppMessage = (student: StudentRecord) => {
    const status = attendance[student.id]?.status || "ABSENT";
    const classLabel = getClassLabel();
    const remarks = attendance[student.id]?.remarks;
    let message = `Dear Parent, this is to inform you that your child *${student.firstName} ${student.lastName}* (Roll No: ${student.rollNumber}) was marked *${status}* for the class *${classLabel}* on *${selectedDate}*.`;
    if (remarks) {
      message += `\nRemarks: _${remarks}_`;
    }
    message += `\n\n_Sent via Aether ERP_`;
    return message;
  };

  // Open WhatsApp with pre-filled text for a specific parent
  const handleOpenIndividualWhatsApp = (student: StudentRecord) => {
    const message = encodeURIComponent(buildIndividualWhatsAppMessage(student));
    const phone = cleanPhoneNumber(student.contactNumber);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, "_blank");
  };

  // Get absent/late counts for badges
  const absentCount = students.filter((s) => attendance[s.id]?.status === "ABSENT").length;
  const lateCount = students.filter((s) => attendance[s.id]?.status === "LATE").length;

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>Select Academic Parameters</span>
          </h3>

          {/* WhatsApp Config Button */}
          <button
            onClick={() => {
              setWhatsappInput(whatsappGroupLink);
              setIsWhatsAppModalOpen(true);
            }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              whatsappGroupLink
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{whatsappGroupLink ? "WhatsApp Linked" : "Link WhatsApp Group"}</span>
            {whatsappGroupLink && <Check className="h-3 w-3" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class & Section</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade.name} - {cls.section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div className="pt-4 border-t border-border flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkUpdate("PRESENT")}
              className="py-1 px-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleBulkUpdate("ABSENT")}
              className="py-1 px-3 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs transition cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold font-mono">
            Class Capacity: {students.length} students enrolled
          </p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          notification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {notification.message}
        </div>
      )}

      {/* WhatsApp Alert Panel — shown after successful submission when there are absent/late students */}
      {isSubmitted && (absentCount > 0 || lateCount > 0) && (
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span>WhatsApp Absence Alerts</span>
            </h3>
            <div className="flex items-center gap-2 text-xs">
              {absentCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-[10px]">
                  {absentCount} Absent
                </span>
              )}
              {lateCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px]">
                  {lateCount} Late
                </span>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => setWhatsappTab("group")}
              className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                whatsappTab === "group"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Group Summary Message
            </button>
            <button
              onClick={() => setWhatsappTab("individual")}
              className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                whatsappTab === "individual"
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Direct Parent Messages ({students.filter((s) => attendance[s.id]?.status === "ABSENT" || attendance[s.id]?.status === "LATE").length})
            </button>
          </div>

          {whatsappTab === "group" ? (
            <div className="space-y-4">
              {/* Message preview */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs whitespace-pre-line font-mono leading-relaxed text-muted-foreground max-h-60 overflow-y-auto custom-scrollbar">
                {buildWhatsAppMessage()}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenWhatsApp}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs transition-all cursor-pointer"
                >
                  {messageCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{messageCopied ? "Copied!" : "Copy Message"}</span>
                </button>

                {whatsappGroupLink && (
                  <a
                    href={whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-all cursor-pointer hover:bg-emerald-500/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Group</span>
                  </a>
                )}
              </div>

              {!whatsappGroupLink && (
                <p className="text-[10px] text-muted-foreground">
                  💡 <strong>Tip:</strong> Link a WhatsApp group to this class using the "Link WhatsApp Group" button above for quick access.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Click any student below to open their parent's personal WhatsApp chat with a pre-filled absence/lateness notification message.
              </p>
              <div className="border border-border rounded-xl overflow-hidden bg-secondary/15 divide-y divide-border">
                {students
                  .filter((s) => attendance[s.id]?.status === "ABSENT" || attendance[s.id]?.status === "LATE")
                  .map((student) => {
                    const status = attendance[student.id]?.status;
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 text-xs hover:bg-secondary/30">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{student.firstName} {student.lastName}</span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                              status === "ABSENT"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {status}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Roll No: {student.rollNumber} | Parent Contact: {student.contactNumber || "Not Provided"}
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenIndividualWhatsApp(student)}
                          disabled={!student.contactNumber}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold text-[10px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                        >
                          <Send className="h-3 w-3" />
                          <span>Send Alert</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student List Register Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Class Student Register</h3>
        </div>

        {isLoadingStudents ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading class students register...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            No students enrolled in the selected class section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 w-16 text-center">Roll No</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3 text-center w-96">Attendance Status</th>
                  <th className="px-6 py-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground">
                {students.map((student) => {
                  const record = attendance[student.id] || { status: "PRESENT", remarks: "" };
                  return (
                    <tr key={student.id} className="hover:bg-secondary/10">
                      <td className="px-6 py-3 text-center font-semibold font-mono text-muted-foreground">
                        {student.rollNumber}
                      </td>
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-3 font-mono text-muted-foreground">
                        {student.admissionNumber}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(student.id, "PRESENT")}
                            className={`flex-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              record.status === "PRESENT"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-extrabold shadow-sm scale-[1.03]"
                                : "border-border text-muted-foreground hover:bg-secondary/50"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(student.id, "ABSENT")}
                            className={`flex-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              record.status === "ABSENT"
                                ? "bg-red-500/10 border-red-500/30 text-red-500 font-extrabold shadow-sm scale-[1.03]"
                                : "border-border text-muted-foreground hover:bg-secondary/50"
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(student.id, "LATE")}
                            className={`flex-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              record.status === "LATE"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-extrabold shadow-sm scale-[1.03]"
                                : "border-border text-muted-foreground hover:bg-secondary/50"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(student.id, "LEAVE")}
                            className={`flex-1 py-1 px-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              record.status === "LEAVE"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-500 font-extrabold shadow-sm scale-[1.03]"
                                : "border-border text-muted-foreground hover:bg-secondary/50"
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          placeholder="e.g. sick leave, late bus"
                          value={record.remarks}
                          onChange={(e) => handleRemarksUpdate(student.id, e.target.value)}
                          className="w-full px-2.5 py-1 rounded bg-background border border-input text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit Actions Bar */}
        {!isLoadingStudents && students.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-end gap-3">
            <span className="text-[10px] text-muted-foreground">Verify all markings before submitting.</span>
            <button
              onClick={handleSaveAttendance}
              className="py-2.5 px-5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Submit Attendance</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Group Link Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                <span>WhatsApp Group — {getClassLabel()}</span>
              </h3>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Paste your WhatsApp group invite link below. After marking attendance, you'll be able to share absent/late student details directly to this group.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  WhatsApp Group Link
                </label>
                <input
                  type="url"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground">
                  Open your WhatsApp group → Group Info → Invite via Link → Copy Link
                </p>
              </div>

              {whatsappGroupLink && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>Currently linked group:</span>
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1 truncate">{whatsappGroupLink}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              {whatsappGroupLink ? (
                <button
                  onClick={handleRemoveWhatsApp}
                  className="text-xs text-red-500 font-semibold hover:underline cursor-pointer"
                >
                  Remove Link
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWhatsApp}
                  disabled={isSavingWhatsApp || !whatsappInput.trim()}
                  className="py-2 px-4 rounded-lg bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSavingWhatsApp ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Save Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
