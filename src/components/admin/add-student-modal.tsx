"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Plus, Edit, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createStudentAction, updateStudentAction } from "@/lib/actions/students";

const studentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  admissionNumber: z.string().min(2, "Admission number is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth"),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().optional(),
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid admission date"),
  permanentAddress: z.string().min(5, "Permanent address must be at least 5 characters"),
  currentAddress: z.string().min(5, "Current address must be at least 5 characters"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  guardianName: z.string().optional(),
  contactNumber: z.string().min(6, "Contact number is too short"),
  classId: z.string().min(1, "Class is required"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface AddStudentModalProps {
  schoolCode: string;
  classes: Array<{
    id: string;
    grade: { name: string };
    section: { name: string };
  }>;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    admissionNumber: string;
    rollNumber: string;
    dateOfBirth: Date | string;
    gender: string;
    bloodGroup: string | null;
    admissionDate: Date | string;
    permanentAddress: string;
    currentAddress: string;
    fatherName: string;
    motherName: string;
    guardianName: string | null;
    contactNumber: string;
    classId: string;
  };
  triggerBtnClassName?: string;
}

export default function AddStudentModal({
  schoolCode,
  classes,
  student,
  triggerBtnClassName,
}: AddStudentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const isEditMode = !!student;

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const formatDateForInput = (dateVal: Date | string | undefined) => {
    if (!dateVal) return "";
    const date = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(
      isEditMode
        ? studentSchema.extend({ password: z.string().optional() })
        : studentSchema.extend({ password: z.string().min(6, "Password must be at least 6 characters") })
    ),
    defaultValues: {
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      email: student?.email || "",
      password: "",
      admissionNumber: student?.admissionNumber || "",
      rollNumber: student?.rollNumber || "",
      dateOfBirth: formatDateForInput(student?.dateOfBirth),
      gender: student?.gender || "Male",
      bloodGroup: student?.bloodGroup || "",
      admissionDate: formatDateForInput(student?.admissionDate) || formatDateForInput(new Date()),
      permanentAddress: student?.permanentAddress || "",
      currentAddress: student?.currentAddress || "",
      fatherName: student?.fatherName || "",
      motherName: student?.motherName || "",
      guardianName: student?.guardianName || "",
      contactNumber: student?.contactNumber || "",
      classId: student?.classId || "",
    },
  });

  // Handle open state and field initialization
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCreatedCredentials(null);
      if (isEditMode && student) {
        setValue("firstName", student.firstName);
        setValue("lastName", student.lastName);
        setValue("email", student.email);
        setValue("admissionNumber", student.admissionNumber);
        setValue("rollNumber", student.rollNumber);
        setValue("dateOfBirth", formatDateForInput(student.dateOfBirth));
        setValue("gender", student.gender);
        setValue("bloodGroup", student.bloodGroup || "");
        setValue("admissionDate", formatDateForInput(student.admissionDate));
        setValue("permanentAddress", student.permanentAddress);
        setValue("currentAddress", student.currentAddress);
        setValue("fatherName", student.fatherName);
        setValue("motherName", student.motherName);
        setValue("guardianName", student.guardianName || "");
        setValue("contactNumber", student.contactNumber);
        setValue("classId", student.classId);
        setValue("password", "");
      } else {
        reset({
          firstName: "",
          lastName: "",
          email: "",
          password: generatePassword(),
          admissionNumber: "",
          rollNumber: "",
          dateOfBirth: "",
          gender: "Male",
          bloodGroup: "",
          admissionDate: formatDateForInput(new Date()),
          permanentAddress: "",
          currentAddress: "",
          fatherName: "",
          motherName: "",
          guardianName: "",
          contactNumber: "",
          classId: "",
        });
      }
    }
  }, [isOpen, student, isEditMode, setValue, reset]);

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isEditMode && student) {
        const res = await updateStudentAction(schoolCode, student.id, data);
        if (!res.success) {
          setErrorMsg(res.message);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setIsOpen(false);
          router.refresh();
        }
      } else {
        const res = await createStudentAction(schoolCode, data);
        if (!res.success) {
          setErrorMsg(res.message);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setCreatedCredentials({ email: data.email, pass: data.password || "" });
          router.refresh();
        }
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
      {isEditMode ? (
        <button
          onClick={() => setIsOpen(true)}
          className={
            triggerBtnClassName ||
            "flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-card text-foreground hover:bg-secondary text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
          }
        >
          <Edit className="h-3 w-3" />
          <span>Edit Profile</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={
            triggerBtnClassName ||
            "flex items-center gap-2 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          }
        >
          <Plus className="h-4 w-4" />
          <span>Add Student</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">
                {isEditMode ? "Edit Student Profile" : "Add New Student"}
              </h3>
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
                  <p className="font-bold text-sm">Student Onboarded Successfully!</p>
                  <p className="text-muted-foreground">Copy the temporary login credentials below to share with the student/parent.</p>
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
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General Header */}
                  <div className="col-span-1 md:col-span-2 pb-1 border-b border-border">
                    <h4 className="text-xs font-bold text-foreground">Personal Details</h4>
                  </div>

                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                    <input
                      {...register("firstName")}
                      type="text"
                      placeholder="e.g. Sam"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                    <input
                      {...register("lastName")}
                      type="text"
                      placeholder="e.g. Miller"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="e.g. sam.miller@school.com"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Number</label>
                    <input
                      {...register("contactNumber")}
                      type="text"
                      placeholder="e.g. +1 555-0155"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.contactNumber && <p className="text-xs text-destructive">{errors.contactNumber.message}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                    <input
                      {...register("dateOfBirth")}
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                    <select
                      {...register("gender")}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Group (Optional)</label>
                    <input
                      {...register("bloodGroup")}
                      type="text"
                      placeholder="e.g. O+"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Academic Details Header */}
                  <div className="col-span-1 md:col-span-2 pb-1 pt-2 border-b border-border">
                    <h4 className="text-xs font-bold text-foreground">Academic Details</h4>
                  </div>

                  {/* Admission Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admission Number</label>
                    <input
                      {...register("admissionNumber")}
                      type="text"
                      placeholder="e.g. ADM2026-004"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.admissionNumber && <p className="text-xs text-destructive">{errors.admissionNumber.message}</p>}
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Roll Number</label>
                    <input
                      {...register("rollNumber")}
                      type="text"
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.rollNumber && <p className="text-xs text-destructive">{errors.rollNumber.message}</p>}
                  </div>

                  {/* Class Assignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class / Section Assignment</label>
                    <select
                      {...register("classId")}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    >
                      <option value="">Select a Class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.grade.name} - {cls.section.name}
                        </option>
                      ))}
                    </select>
                    {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
                  </div>

                  {/* Admission Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admission Date</label>
                    <input
                      {...register("admissionDate")}
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.admissionDate && <p className="text-xs text-destructive">{errors.admissionDate.message}</p>}
                  </div>

                  {/* Parents Details Header */}
                  <div className="col-span-1 md:col-span-2 pb-1 pt-2 border-b border-border">
                    <h4 className="text-xs font-bold text-foreground">Parent / Guardian Information</h4>
                  </div>

                  {/* Father's Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Father's Name</label>
                    <input
                      {...register("fatherName")}
                      type="text"
                      placeholder="e.g. Robert Miller"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.fatherName && <p className="text-xs text-destructive">{errors.fatherName.message}</p>}
                  </div>

                  {/* Mother's Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mother's Name</label>
                    <input
                      {...register("motherName")}
                      type="text"
                      placeholder="e.g. Mary Miller"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                    {errors.motherName && <p className="text-xs text-destructive">{errors.motherName.message}</p>}
                  </div>

                  {/* Guardian Name */}
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guardian Name (Optional)</label>
                    <input
                      {...register("guardianName")}
                      type="text"
                      placeholder="e.g. Guardian Name if applicable"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Address Details Header */}
                  <div className="col-span-1 md:col-span-2 pb-1 pt-2 border-b border-border">
                    <h4 className="text-xs font-bold text-foreground">Addresses</h4>
                  </div>

                  {/* Current Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Current Address</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = document.getElementById("perm_addr") as HTMLTextAreaElement;
                          if (currentVal) setValue("currentAddress", currentVal.value);
                        }}
                        className="text-[9px] lowercase font-semibold text-primary hover:underline"
                      >
                        Copy Permanent
                      </button>
                    </label>
                    <textarea
                      {...register("currentAddress")}
                      rows={2}
                      placeholder="Street, City, ZIP"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      disabled={isLoading}
                    />
                    {errors.currentAddress && <p className="text-xs text-destructive">{errors.currentAddress.message}</p>}
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permanent Address</label>
                    <textarea
                      {...register("permanentAddress")}
                      id="perm_addr"
                      rows={2}
                      placeholder="Street, City, ZIP"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      disabled={isLoading}
                    />
                    {errors.permanentAddress && <p className="text-xs text-destructive">{errors.permanentAddress.message}</p>}
                  </div>

                  {/* Password section (only visible in create mode) */}
                  {!isEditMode && (
                    <>
                      <div className="col-span-1 md:col-span-2 pb-1 pt-2 border-b border-border">
                        <h4 className="text-xs font-bold text-foreground">Credentials</h4>
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-1">
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
                    </>
                  )}
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEditMode ? "Save Changes" : "Add Student"}</span>
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
