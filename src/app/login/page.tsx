"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        // Redirect will be handled by the middleware, or we can force routing
        router.refresh();
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground transition-colors duration-300">
      {/* Brand Side (Left) */}
      <div className="hidden lg:flex lg:col-span-7 relative bg-neutral-950 flex-col justify-between p-12 text-white overflow-hidden">
        {/* Floating gradient glow elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px]" />
        
        {/* Top brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
            <GraduationCap className="h-6 w-6 text-violet-400" />
          </div>
          <span className="font-semibold text-lg tracking-wider bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
            AETHER ERP
          </span>
        </div>

        {/* Core Tagline / Visual */}
        <div className="my-auto relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-violet-300 text-xs font-medium mb-6 backdrop-blur-md animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Attendance & Academics</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight mb-4">
            Simplify school management from a single premium portal.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Onboard schools, track student and teacher attendance, generate PDF report cards, process fee invoices, and manage class schedules seamlessly with our multi-tenant SaaS workspace.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 Aether ERP Systems Inc.</span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </button>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center p-8 sm:p-12 xl:p-16 bg-card">
        <div className="w-full max-w-md mx-auto">
          {/* Brand header for mobile */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="p-2 bg-violet-600 rounded-lg text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-wider text-xl">AETHER ERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your portal.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 mb-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@school.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <a
                  href="#forgot-password"
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center">
              <input
                {...register("rememberMe")}
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 rounded border-input text-violet-600 focus:ring-violet-500"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-muted-foreground font-medium select-none">
                Remember me on this device
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Quick links for demo testing */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Sign In (Demo Accounts)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  (document.querySelector('input[type="email"]') as HTMLInputElement).value = "superadmin@schoolerp.com";
                  (document.querySelector('input[type="password"]') as HTMLInputElement).value = "password123";
                }}
                className="p-2 border border-border rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition text-left cursor-pointer"
              >
                <strong>Super Admin</strong>
                <span className="block text-[10px] text-muted-foreground">System Controller</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  (document.querySelector('input[type="email"]') as HTMLInputElement).value = "admin@grandacademy.edu";
                  (document.querySelector('input[type="password"]') as HTMLInputElement).value = "password123";
                }}
                className="p-2 border border-border rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition text-left cursor-pointer"
              >
                <strong>School Admin</strong>
                <span className="block text-[10px] text-muted-foreground">Grand Academy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  (document.querySelector('input[type="email"]') as HTMLInputElement).value = "john.doe@grandacademy.edu";
                  (document.querySelector('input[type="password"]') as HTMLInputElement).value = "password123";
                }}
                className="p-2 border border-border rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition text-left cursor-pointer"
              >
                <strong>Teacher</strong>
                <span className="block text-[10px] text-muted-foreground">John Doe (Math)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  (document.querySelector('input[type="email"]') as HTMLInputElement).value = "sam.miller@grandacademy.edu";
                  (document.querySelector('input[type="password"]') as HTMLInputElement).value = "password123";
                }}
                className="p-2 border border-border rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition text-left cursor-pointer"
              >
                <strong>Student</strong>
                <span className="block text-[10px] text-muted-foreground">Sam Miller (Grade 10)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
