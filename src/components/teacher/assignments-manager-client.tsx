"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar, Clock, Plus, Search, Trash2, Edit2, X, Loader2 } from "lucide-react";
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

interface Assignment {
  id: string;
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
  };
  title: string;
  description: string;
  dueDate: string;
}

interface AssignmentsManagerClientProps {
  schoolCode: string;
}

export default function AssignmentsManagerClient({ schoolCode }: AssignmentsManagerClientProps) {
  const router = useRouter();
  
  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [taughtSlots, setTaughtSlots] = useState<TaughtSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schools/${schoolCode}/assignments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(data.data.assignments);
        setTaughtSlots(data.data.taughtSlots);
      }
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolCode]);

  // Derived states for form options
  // Distinct classes
  const uniqueClasses = Array.from(
    new Map(taughtSlots.map((item) => [item.classId, item.class])).values()
  );

  // Available subjects based on selected class in form
  const availableSubjects = taughtSlots
    .filter((slot) => slot.classId === formClassId)
    .map((slot) => slot.subject);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingAssignmentId(null);
    setFormClassId(uniqueClasses[0]?.id || "");
    setFormTitle("");
    setFormDescription("");
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7); // Default due date = 7 days from now
    setFormDueDate(defaultDate.toISOString().split("T")[0]);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Pre-fill subject when class changes in form
  useEffect(() => {
    if (formClassId) {
      const classSubjects = taughtSlots.filter((slot) => slot.classId === formClassId);
      if (classSubjects.length > 0) {
        // Keep current subject if it exists in new subjects, otherwise pick first
        const exists = classSubjects.some((s) => s.subjectId === formSubjectId);
        if (!exists) {
          setFormSubjectId(classSubjects[0].subjectId);
        }
      } else {
        setFormSubjectId("");
      }
    }
  }, [formClassId, taughtSlots]);

  // Handle open modal for edit
  const handleOpenEdit = (asm: Assignment) => {
    setEditingAssignmentId(asm.id);
    setFormClassId(asm.classId);
    setFormSubjectId(asm.subjectId);
    setFormTitle(asm.title);
    setFormDescription(asm.description);
    setFormDueDate(new Date(asm.dueDate).toISOString().split("T")[0]);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Handle form submit (create/edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formSubjectId || !formTitle || !formDescription || !formDueDate) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    setModalLoading(true);
    setErrorMessage(null);

    const payload = {
      classId: formClassId,
      subjectId: formSubjectId,
      title: formTitle,
      description: formDescription,
      dueDate: formDueDate,
    };

    try {
      const url = editingAssignmentId
        ? `/api/schools/${schoolCode}/assignments/${editingAssignmentId}`
        : `/api/schools/${schoolCode}/assignments`;
      const method = editingAssignmentId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setErrorMessage(resData.message || "Failed to save assignment");
      } else {
        setIsModalOpen(false);
        fetchData();
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete assignment
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this homework assignment?")) return;
    
    try {
      const res = await fetch(`/api/schools/${schoolCode}/assignments/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchData();
        router.refresh();
      } else {
        alert(resData.message || "Failed to delete assignment");
      }
    } catch (err) {
      alert("Failed to delete assignment");
    }
  };

  // Filtered list
  const filteredAssignments = assignments.filter((asm) => {
    const matchesSearch =
      asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asm.subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = selectedClassFilter === "all" || asm.classId === selectedClassFilter;
    
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Homework Assignments</h2>
          <p className="text-muted-foreground text-xs">Publish, modify, and manage student homework sheets.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Homework</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search homework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {/* Class Filter */}
        <div className="w-full sm:max-w-xs">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.grade.name} - {cls.section.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-xl text-muted-foreground text-xs">
          No homework assignments found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((asm) => {
            const isOverdue = new Date(asm.dueDate) < new Date() && new Date(asm.dueDate).toDateString() !== new Date().toDateString();
            return (
              <div
                key={asm.id}
                className="p-5 bg-card border border-border rounded-xl shadow-sm space-y-4 hover:border-primary/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                      {asm.subject.name}
                    </span>
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isOverdue ? "text-red-500" : "text-amber-500"
                    }`}>
                      <Clock className="h-3 w-3" />
                      Due: {new Date(asm.dueDate).toISOString().split("T")[0]} {isOverdue && "(Overdue)"}
                    </span>
                  </div>
                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground line-clamp-1">{asm.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 whitespace-pre-wrap">{asm.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Class: {asm.class.grade.name} - {asm.class.section.name}
                  </span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(asm)}
                      className="p-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                      title="Edit Assignment"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asm.id)}
                      className="p-1.5 rounded-lg border border-border bg-red-500/10 text-red-500 hover:text-white hover:bg-red-500 cursor-pointer transition-all"
                      title="Delete Assignment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">
                {editingAssignmentId ? "Edit Homework Assignment" : "Publish Homework Assignment"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Class Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Room</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={modalLoading}
                  >
                    {uniqueClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.grade.name} - {cls.section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={modalLoading || !formClassId}
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignment Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Fractions Worksheet"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={modalLoading}
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description / Instructions</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide detailing steps or reference pages..."
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    disabled={modalLoading}
                  />
                </div>

                {/* Due Date */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={modalLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAssignmentId ? "Save Changes" : "Publish Homework"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
