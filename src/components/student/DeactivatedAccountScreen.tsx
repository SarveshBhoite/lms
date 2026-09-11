"use client";

import Link from "next/link";
import { ShieldAlert, Mail, LogOut, Lock, AlertTriangle } from "lucide-react";

export default function DeactivatedAccountScreen({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-800/80 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-rose-950/40 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Brand Header */}
        <div className="flex justify-center">
          <img
            src="/jvm_logo-bg.png"
            alt="JVM Institute Logo"
            className="h-12 w-auto object-contain drop-shadow-md brightness-110"
          />
        </div>

        {/* Warning Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Heading & Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Portal Access Suspended
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account Deactivated
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            Hello <strong className="text-white">{userName}</strong> ({userEmail}), your student account has been deactivated by the JVM LMS administration.
          </p>
        </div>

        {/* Explanation Card */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Why am I seeing this screen?</span>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Your enrolled courses, live lecture sessions, assignments, quizzes, and certificates are currently locked. You cannot browse the portal until an administrator reactivates your account.
          </p>
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-300">
            <Mail className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Support: </span>
            <a
              href="mailto:jmgrouponline@gmail.com"
              className="text-purple-300 font-medium hover:underline truncate"
            >
              jmgrouponline@gmail.com
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-700/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              Sign Out from Portal
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            JVM Institute LMS &bull; Student Account Governance
          </p>
        </div>
      </div>
    </div>
  );
}
