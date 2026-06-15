"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const leaveSchema = z.object({
  studentId: z.string().min(1, "Please select a child"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
});

type LeaveFormValues = z.infer<typeof leaveSchema>;

interface SubmitLeaveModalProps {
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  schoolCode: string;
}

export default function SubmitLeaveModal({ students, schoolCode }: SubmitLeaveModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      studentId: students[0]?.id || "",
      reason: "",
      fromDate: "",
      toDate: "",
    },
  });

  const onSubmit = async (data: LeaveFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    // Simple submission to Server Action or API
    // Let's implement dynamic post to local API
    try {
      const response = await fetch(`/api/schools/${schoolCode}/leave-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setErrorMsg(resData.message || "Failed to submit leave request");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setIsOpen(false);
        reset();
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <Calendar className="h-4 w-4" />
        <span>Request Leave</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Submit Leave Request</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  reset();
                  setErrorMsg(null);
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Student/Child Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Student</label>
                <select
                  {...register("studentId")}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={isLoading}
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.firstName} {std.lastName}
                    </option>
                  ))}
                </select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start Date</label>
                  <input
                    {...register("fromDate")}
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.fromDate && <p className="text-xs text-destructive">{errors.fromDate.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End Date</label>
                  <input
                    {...register("toDate")}
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.toDate && <p className="text-xs text-destructive">{errors.toDate.message}</p>}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reason for Leave</label>
                <textarea
                  {...register("reason")}
                  rows={3}
                  placeholder="e.g. Dental checkup or family event"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  disabled={isLoading}
                />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    reset();
                    setErrorMsg(null);
                  }}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
