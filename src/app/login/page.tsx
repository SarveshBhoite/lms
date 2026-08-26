"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  User,
  Sparkles,
} from "lucide-react";

type LoginRole = "ADMIN" | "TRAINER" | "STUDENT";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("STUDENT");
  const [email, setEmail] = useState("sophia.student@institute.edu");
  const [password, setPassword] = useState("Password123!");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleTabChange = (role: LoginRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === "ADMIN") {
      setEmail("sulagadleaishwarya@gmail.com");
      setPassword("123");
    } else if (role === "TRAINER") {
      setEmail("trainer@institute.edu");
      setPassword("Password123!");
    } else {
      setEmail("sophia.student@institute.edu");
      setPassword("Password123!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid login credentials");
      }

      // Redirect based on user role
      if (data.data.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (data.data.role === "TRAINER") {
        router.push("/trainer/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Soft Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 border border-indigo-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            JVM LMS
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
          Institutional Login Portal
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Select your institutional role to access your workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Role Selector Tabs */}
        <div className="p-1.5 rounded-2xl bg-slate-200/70 border border-slate-300 grid grid-cols-3 gap-1.5 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => handleRoleTabChange("STUDENT")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "STUDENT"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Student
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange("TRAINER")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "TRAINER"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Faculty
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange("ADMIN")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "ADMIN"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
                {selectedRole === "ADMIN" ? "Administrator Email" : selectedRole === "TRAINER" ? "Faculty Email" : "Student Email"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institute.edu"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs font-medium transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs font-mono transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 ${
                selectedRole === "ADMIN"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  : selectedRole === "TRAINER"
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In as {selectedRole === "ADMIN" ? "Super Admin" : selectedRole === "TRAINER" ? "Faculty" : "Student"} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Instant Preset Details */}
          <div className="pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Active Preset Credentials: <strong className="text-slate-900 font-mono">{email}</strong> (Pass: <strong className="text-slate-900 font-mono">{password}</strong>)
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need a new student account?{" "}
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
            Create Student Profile
          </Link>
        </p>
      </div>
    </div>
  );
}
