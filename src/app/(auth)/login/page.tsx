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
  const [selectedRole, setSelectedRole] = useState<LoginRole>("ADMIN");
  const [email, setEmail] = useState("sulagadleaishwarya@gmail.com");
  const [password, setPassword] = useState("123");
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
    <div className="min-h-screen bg-[#06080F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Subtle Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200 tracking-tight">
            JVM LMS
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
          Institute Sign In Portal
        </h2>
        <p className="mt-2 text-xs text-slate-400 font-medium">
          Select your institutional role to access your dedicated workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Role Selector Tabs */}
        <div className="p-1.5 rounded-2xl glass-panel border border-slate-800 grid grid-cols-3 gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => handleRoleTabChange("ADMIN")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "ADMIN"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange("TRAINER")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "TRAINER"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Faculty
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange("STUDENT")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === "STUDENT"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Student
          </button>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800/80">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                {selectedRole === "ADMIN" ? "Administrator Email" : selectedRole === "TRAINER" ? "Faculty Email" : "Student Email"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institute.edu"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 ${
                selectedRole === "ADMIN"
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-600/30 hover:from-rose-500 hover:to-pink-500"
                  : selectedRole === "TRAINER"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500"
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
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Active Credentials: <strong className="text-white font-mono">{email}</strong> (Pass: <strong className="text-white font-mono">{password}</strong>)
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Need a new student account?{" "}
          <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition">
            Create Student Profile
          </Link>
        </p>
      </div>
    </div>
  );
}
