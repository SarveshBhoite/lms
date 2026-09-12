"use client";

import Link from "next/link";
import { ShieldAlert, Mail, LogOut, Lock, AlertTriangle, HelpCircle, Phone } from "lucide-react";

export default function DeactivatedAccountScreen({
  userName,
  userEmail,
  role = "STUDENT",
}: {
  userName: string;
  userEmail: string;
  role?: "STUDENT" | "TRAINER" | "USER";
}) {
  const isTrainer = role === "TRAINER";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 portal-bg-mesh selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* JVM Institute Gentle Ambient Mesh Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[550px] h-[550px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/25 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main Container Card */}
      <div className="relative z-10 max-w-lg w-full bg-white/95 backdrop-blur-xl border border-purple-100 rounded-3xl p-7 sm:p-10 shadow-xl shadow-purple-950/5 text-center space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <img
              src="/jvm_logo-bg.png"
              alt="JVM Institute Logo"
              className="h-14 w-auto object-contain drop-shadow-xs"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold font-mono uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-rose-600" />{" "}
            {isTrainer ? "Faculty Portal Suspended" : "Account Access Suspended"}
          </div>
        </div>

        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="mx-auto w-18 h-18 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Portal Access <span className="text-rose-600">Locked</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Hello <strong className="text-slate-900">{userName}</strong> (
              <span className="font-mono text-slate-500">{userEmail}</span>
              ), your {isTrainer ? "faculty/trainer" : "student"} account has been marked as deactivated in the JVM LMS registry.
            </p>
          </div>
        </div>

        {/* Information Callout Card */}
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-left space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>What does this mean for your account?</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isTrainer
              ? "Your assigned courses, cohort batches, live classroom hosting tools, and assignment evaluation privileges are currently paused. You will not be able to access the faculty dashboard until an administrator reactivates your account."
              : "Your enrolled courses, live classroom sessions, recorded lectures, quizzes, and digital certificates are currently paused. You will not be able to navigate portal tools until an administrator reactivates your account."}
          </p>

          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-[#7C248C] shrink-0" />
              <span>Need this resolved? Contact Administration:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <a
                href="mailto:jmgrouponline@gmail.com"
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 text-purple-700 hover:text-purple-900 hover:border-purple-300 transition shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">jmgrouponline@gmail.com</span>
              </a>

              <a
                href="tel:+919876543210"
                className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 text-indigo-700 hover:text-indigo-900 hover:border-indigo-300 transition shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">+91 Helpdesk Line</span>
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-1">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-950/15 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from Portal</span>
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>JVM Institute</span>
            <span>&bull;</span>
            <span>{isTrainer ? "Faculty Portal Governance" : "Student Portal Governance"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
