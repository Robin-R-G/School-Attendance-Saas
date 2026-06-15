"use client";

import { useState, useEffect } from "react";
import { FileCheck, Search, Info, Loader2, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaughtSlot {
  classId: string;
  class: {
    id: string;
    grade: { name: string };
    section: { name: string };
  };
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface Exam {
  id: string;
  name: string;
  term: string;
}

interface ExamSubject {
  id: string;
  maxMarks: number;
  passingMarks: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

interface ExamMark {
  id: string;
  studentId: string;
  marksObtained: number;
  isAbsent: boolean;
  remarks: string | null;
}

interface GradesManagerClientProps {
  schoolCode: string;
}

export default function GradesManagerClient({ schoolCode }: GradesManagerClientProps) {
  const router = useRouter();

  // Filters State
  const [taughtSlots, setTaughtSlots] = useState<TaughtSlot[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  // Sheet Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [marksSheet, setMarksSheet] = useState<{ [studentId: string]: { marksObtained: string; isAbsent: boolean; remarks: string } }>({});
  
  // Sheet Config State
  const [maxMarks, setMaxMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("40");

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingSheet, setSavingSheet] = useState(false);
  
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch initial filters data
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true);
        const res = await fetch(`/api/schools/${schoolCode}/grades`);
        const data = await res.json();
        if (res.ok && data.success) {
          setTaughtSlots(data.data.taughtSlots);
          setExams(data.data.exams);
          
          // Set initial filter selection
          const uniqueClasses = Array.from(new Map(data.data.taughtSlots.map((item: any) => [item.classId, item.class])).values()) as any[];
          if (uniqueClasses.length > 0) {
            setSelectedClassId(uniqueClasses[0].id);
          }
          if (data.data.exams.length > 0) {
            setSelectedExamId(data.data.exams[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load filter metadata", err);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, [schoolCode]);

  // Derived classes
  const uniqueClasses = Array.from(
    new Map(taughtSlots.map((item) => [item.classId, item.class])).values()
  );

  // Derived subjects for selected class
  const classSubjects = taughtSlots.filter((slot) => slot.classId === selectedClassId);

  // Handle class change to update subject list automatically
  useEffect(() => {
    if (selectedClassId && classSubjects.length > 0) {
      // Keep existing subject if valid, else pick first
      const isValid = classSubjects.some((s) => s.subjectId === selectedSubjectId);
      if (!isValid) {
        setSelectedSubjectId(classSubjects[0].subjectId);
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedClassId, taughtSlots]);

  // Fetch grades sheet when filters change
  useEffect(() => {
    const fetchGradesSheet = async () => {
      if (!selectedClassId || !selectedSubjectId || !selectedExamId) return;

      try {
        setLoadingSheet(true);
        setNotification(null);
        const res = await fetch(
          `/api/schools/${schoolCode}/grades?classId=${selectedClassId}&subjectId=${selectedSubjectId}&examId=${selectedExamId}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const { examSubject, students: dbStudents, marks: dbMarks } = data.data;
          
          // Configure max/passing marks
          if (examSubject) {
            setMaxMarks(examSubject.maxMarks.toString());
            setPassingMarks(examSubject.passingMarks.toString());
          } else {
            setMaxMarks("100");
            setPassingMarks("40");
          }

          setStudents(dbStudents);

          // Populate local forms state mapping
          const initialFormState: typeof marksSheet = {};
          dbStudents.forEach((std: Student) => {
            const existingMark = dbMarks.find((m: ExamMark) => m.studentId === std.id);
            initialFormState[std.id] = {
              marksObtained: existingMark ? existingMark.marksObtained.toString() : "0",
              isAbsent: existingMark ? existingMark.isAbsent : false,
              remarks: existingMark && existingMark.remarks ? existingMark.remarks : "",
            };
          });
          setMarksSheet(initialFormState);
        }
      } catch (err) {
        console.error("Failed to load grades sheet", err);
      } finally {
        setLoadingSheet(false);
      }
    };
    
    fetchGradesSheet();
  }, [selectedClassId, selectedSubjectId, selectedExamId, schoolCode]);

  // Handle grade change inline
  const handleMarkChange = (studentId: string, field: "marksObtained" | "remarks", value: string) => {
    setMarksSheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleAbsentToggle = (studentId: string, isChecked: boolean) => {
    setMarksSheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: isChecked,
        marksObtained: isChecked ? "0" : prev[studentId].marksObtained,
      },
    }));
  };

  // Submit and save grades
  const handleSaveGrades = async () => {
    const maxVal = parseFloat(maxMarks);
    const passVal = parseFloat(passingMarks);

    if (isNaN(maxVal) || maxVal <= 0 || isNaN(passVal) || passVal < 0 || passVal > maxVal) {
      setNotification({
        type: "error",
        message: "Invalid configuration: Ensure Max Marks > 0 and Passing Marks is between 0 and Max Marks.",
      });
      return;
    }

    // Prepare list of marks
    const marksList = Object.entries(marksSheet).map(([studentId, data]) => {
      const marksObtained = parseFloat(data.marksObtained) || 0;
      return {
        studentId,
        marksObtained: data.isAbsent ? 0 : marksObtained,
        isAbsent: data.isAbsent,
        remarks: data.remarks.trim() || null,
      };
    });

    // Client-side range validation
    for (const item of marksList) {
      if (!item.isAbsent && (item.marksObtained < 0 || item.marksObtained > maxVal)) {
        const studentName = students.find((s) => s.id === item.studentId);
        setNotification({
          type: "error",
          message: `Validation Error: ${studentName ? `${studentName.firstName} ${studentName.lastName}` : "Student"} score (${item.marksObtained}) must be between 0 and ${maxVal}.`,
        });
        return;
      }
    }

    try {
      setSavingSheet(true);
      setNotification(null);
      const res = await fetch(`/api/schools/${schoolCode}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          examId: selectedExamId,
          maxMarks: maxVal,
          passingMarks: passVal,
          marksList,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setNotification({ type: "success", message: "Gradebook updated successfully!" });
        router.refresh();
      } else {
        setNotification({ type: "error", message: resData.message || "Failed to save grades." });
      }
    } catch (err) {
      setNotification({ type: "error", message: "An unexpected error occurred while saving." });
    } finally {
      setSavingSheet(false);
    }
  };

  // Filtered student list
  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Enter Grades</h2>
        <p className="text-muted-foreground text-xs">Record, edit, and review academic test scores for your class rosters.</p>
      </div>

      {/* Selectors Panel */}
      <div className="p-5 bg-card border border-border rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Class Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Room</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={loadingFilters || loadingSheet || savingSheet}
          >
            {loadingFilters ? (
              <option>Loading...</option>
            ) : uniqueClasses.length === 0 ? (
              <option>No classes assigned</option>
            ) : (
              uniqueClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade.name} - {cls.section.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Subject Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={loadingFilters || loadingSheet || savingSheet || !selectedClassId}
          >
            {loadingFilters ? (
              <option>Loading...</option>
            ) : classSubjects.length === 0 ? (
              <option>Select a class first</option>
            ) : (
              classSubjects.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId}>
                  {sub.subject.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Exam Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exam Title</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={loadingFilters || loadingSheet || savingSheet}
          >
            {loadingFilters ? (
              <option>Loading...</option>
            ) : exams.length === 0 ? (
              <option>No exams scheduled</option>
            ) : (
              exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.term})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Grade Sheet Render */}
      {!selectedClassId || !selectedSubjectId || !selectedExamId ? (
        <div className="p-16 text-center bg-card border border-border rounded-xl text-muted-foreground text-xs">
          Select class, subject, and exam from the filters above to load the gradebook sheet.
        </div>
      ) : loadingSheet ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Notifications */}
          {notification && (
            <div className={`p-4 rounded-lg flex items-start gap-3 border text-xs font-semibold ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
              {notification.type === "success" ? (
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Configuration Settings Row */}
          <div className="p-5 bg-card border border-border rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-muted-foreground text-xs">
              <Info className="h-4.5 w-4.5 text-primary shrink-0" />
              <span>Configure exam criteria settings before logging marks. Threshold applies dynamically below.</span>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground shrink-0">Max Marks</span>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-input bg-background text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={savingSheet}
                  min="1"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground shrink-0">Passing Marks</span>
                <input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-input bg-background text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={savingSheet}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Student Marks Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Table Search Header */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleSaveGrades}
                disabled={savingSheet}
                className="flex items-center gap-1.5 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingSheet ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Gradebook...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Gradebook</span>
                  </>
                )}
              </button>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 w-20">Roll No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3 w-32 text-center">Absent</th>
                    <th className="px-6 py-3 w-40 text-center">Score Obtained</th>
                    <th className="px-6 py-3 w-32 text-center">Result Status</th>
                    <th className="px-6 py-3">Remarks / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-foreground">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No students matched.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const sheetRow = marksSheet[std.id] || { marksObtained: "0", isAbsent: false, remarks: "" };
                      const scoreNum = parseFloat(sheetRow.marksObtained) || 0;
                      const maxNum = parseFloat(maxMarks) || 100;
                      const passNum = parseFloat(passingMarks) || 40;
                      
                      const isPassing = scoreNum >= passNum;

                      return (
                        <tr key={std.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-muted-foreground">{std.rollNumber}</td>
                          <td className="px-6 py-4 font-semibold">{std.firstName} {std.lastName}</td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={sheetRow.isAbsent}
                              onChange={(e) => handleAbsentToggle(std.id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                              disabled={savingSheet}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                value={sheetRow.marksObtained}
                                onChange={(e) => handleMarkChange(std.id, "marksObtained", e.target.value)}
                                className="w-20 px-2 py-1 rounded-lg border border-input bg-background font-mono text-center font-bold text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={savingSheet || sheetRow.isAbsent}
                                min="0"
                                max={maxMarks}
                                step="0.5"
                              />
                              <span className="text-[10px] text-muted-foreground">/ {maxMarks}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {sheetRow.isAbsent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500">
                                Absent
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isPassing ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                              }`}>
                                {isPassing ? "Pass" : "Fail"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 pr-6">
                            <input
                              type="text"
                              value={sheetRow.remarks}
                              onChange={(e) => handleMarkChange(std.id, "remarks", e.target.value)}
                              placeholder="e.g. Excellent logic skills"
                              className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              disabled={savingSheet}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Actions */}
            <div className="p-4 border-t border-border flex items-center justify-end bg-secondary/10">
              <button
                onClick={handleSaveGrades}
                disabled={savingSheet}
                className="flex items-center gap-1.5 py-2 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingSheet ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Gradebook Sheet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
