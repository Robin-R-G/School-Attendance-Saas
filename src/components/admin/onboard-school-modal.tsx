"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  code: z.string().min(3, "Code must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and dashes allowed"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone number is too short"),
  principalName: z.string().min(3, "Principal name is too short"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  adminName: z.string().min(3, "Admin name is too short"),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPassword: z.string().min(6, "Temporary password must be at least 6 characters"),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

export default function OnboardSchoolModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      email: "",
      phone: "",
      principalName: "",
      logoUrl: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const onSubmit = async (data: SchoolFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setErrorMsg(resData.message || "Failed to onboard school");
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
        <Plus className="h-4 w-4" />
        <span>Onboard School</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Onboard New School</h3>
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

              <div className="grid grid-cols-2 gap-4">
                {/* School Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">School Name</label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="e.g. Lincoln High School"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                {/* School Code */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">School Code (Slug)</label>
                  <input
                    {...register("code")}
                    type="text"
                    placeholder="e.g. lincoln-high"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                </div>

                {/* Principal Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Principal Name</label>
                  <input
                    {...register("principalName")}
                    type="text"
                    placeholder="e.g. Dr. John Carter"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.principalName && <p className="text-xs text-destructive">{errors.principalName.message}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="contact@school.edu"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                  <input
                    {...register("phone")}
                    type="text"
                    placeholder="+1 555-0100"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                {/* Logo URL */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logo URL (Optional)</label>
                  <input
                    {...register("logoUrl")}
                    type="text"
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
                </div>

                {/* Admin Account Header */}
                <div className="col-span-2 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground">School Administrator Account</h4>
                  <p className="text-[10px] text-muted-foreground">This user will be registered as the primary SCHOOL_ADMIN for the tenant.</p>
                </div>

                {/* Admin Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Full Name</label>
                  <input
                    {...register("adminName")}
                    type="text"
                    placeholder="e.g. Alice Smith"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.adminName && <p className="text-xs text-destructive">{errors.adminName.message}</p>}
                </div>

                {/* Admin Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Email</label>
                  <input
                    {...register("adminEmail")}
                    type="email"
                    placeholder="admin@school.edu"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
                </div>

                {/* Admin Password */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</label>
                  <input
                    {...register("adminPassword")}
                    type="text"
                    placeholder="Choose a temporary password"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={isLoading}
                  />
                  {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword.message}</p>}
                </div>

                {/* Address */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Physical Address</label>
                  <textarea
                    {...register("address")}
                    rows={2}
                    placeholder="123 Academic Way, City, State"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    disabled={isLoading}
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
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
                      <span>Onboarding...</span>
                    </>
                  ) : (
                    <span>Onboard School</span>
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
