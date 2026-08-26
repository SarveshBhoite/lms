"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";
import { Suspense } from "react";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required") || "Authorized Role";
  const fromPath = searchParams.get("from") || "";

  return (
    <div className="max-w-lg w-full glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl relative">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold font-mono uppercase tracking-wider">
          403 Forbidden • RBAC Protected
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Restricted Portal Access
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          The requested route {fromPath ? <code className="text-rose-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded">{fromPath}</code> : "portal"} requires <strong className="text-white">{requiredRole}</strong> academic permissions.
        </p>
      </div>

      {/* Role Navigation Quick Access */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Available Authorized Workspaces
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            href="/student/dashboard"
            className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 text-xs font-bold flex items-center gap-2 transition"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" /> Student Space
          </Link>
          <Link
            href="/trainer/dashboard"
            className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 hover:border-amber-500 text-amber-300 text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Faculty Space
          </Link>
          <Link
            href="/admin/dashboard"
            className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/20 hover:border-rose-500 text-rose-300 text-xs font-bold flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-rose-400" /> Admin Control
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Switch Account
        </Link>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-500 selection:text-white relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-rose-500/10 blur-[130px] rounded-full pointer-events-none" />
      <Suspense fallback={<div className="text-white text-xs">Loading...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
