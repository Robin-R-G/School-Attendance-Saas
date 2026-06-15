"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Plus, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().min(2, "Employee ID must be at least 2 characters"),
  phone: z.string().min(6, "Phone number is too short"),
  qualification: z.string().min(2, "Qualification is too short"),
  experience: z.string().min(1, "Experience is required"),
  department: z.string().min(2, "Department must be at least 2 characters"),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

interface AddTeacherModalProps {
  schoolCode: string;
}

export default function AddTeacherModal({ schoolCode }: AddTeacherModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      employeeId: "",
      phone: "",
      qualification: "",
      experience: "",
      department: "",
    },
  });

  // Pre-fill temporary password when modal opens
  useEffect(() => {
    if (isOpen) {
      setValue("password", generatePassword());
      setCreatedCredentials(null);
      setErrorMsg(null);
    }
  }, [isOpen, setValue]);

  const onSubmit = async (data: TeacherFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setErrorMsg(resData.message || "Failed to add teacher");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setCreatedCredentials({ email: data.email, pass: data.password });
        reset();
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Add Teacher</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Add New Teacher</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  reset();
                  setErrorMsg(null);
                  setCreatedCredentials(null);
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            {createdCredentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold space-y-1">
                  <p className="font-bold text-sm">Teacher Added Successfully!</p>
                  <p className="text-muted-foreground">Copy the temporary credentials below to share with the teacher.</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary border border-border space-y-3 font-mono text-sm relative">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Email</span>
                    <span className="text-foreground select-all">{createdCredentials.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Temporary Password</span>
                    <span className="text-foreground select-all">{createdCredentials.pass}</span>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground cursor-pointer hover:shadow-sm transition-all"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setCreatedCredentials(null);
                    }}
                    className="py-2 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input
                      {...register("name")}
                      type="text"
                      placeholder="e.g. John Smith"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="e.g. john.smith@academy.com"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  {/* Employee ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee ID</label>
                    <input
                      {...register("employeeId")}
                      type="text"
                      placeholder="e.g. EMP1004"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department</label>
                    <input
                      {...register("department")}
                      type="text"
                      placeholder="e.g. Mathematics"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <input
                      {...register("phone")}
                      type="text"
                      placeholder="+1 555-0199"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qualification</label>
                    <input
                      {...register("qualification")}
                      type="text"
                      placeholder="e.g. M.Sc. Mathematics"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Experience (Years)</label>
                    <input
                      {...register("experience")}
                      type="text"
                      placeholder="e.g. 5 Years"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.experience && <p className="text-xs text-destructive">{errors.experience.message}</p>}
                  </div>

                  {/* Password */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Temporary Password</span>
                      <button
                        type="button"
                        onClick={() => setValue("password", generatePassword())}
                        className="text-[9px] lowercase font-semibold text-primary hover:underline"
                      >
                        Regenerate
                      </button>
                    </label>
                    <input
                      {...register("password")}
                      type="text"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
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
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add Teacher</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
