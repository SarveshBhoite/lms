"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Play,
  Award,
  Calendar,
  LogOut,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  Video,
} from "lucide-react";

interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
        Loading Student Space...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              EduPulse <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Student Portal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{user?.name || "Sophia Martinez"}</div>
            <div className="text-[11px] text-slate-400 font-mono">{user?.email || "sophia.student@institute.edu"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome & Continue Learning Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              Active Cohort: Next.js Cohort Alpha
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name?.split(" ")[0] || "Sophia"}! 🚀
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              You are currently 33% through <span className="text-indigo-300 font-medium">Full-Stack Next.js 15 & TypeScript Mastery</span>.
            </p>
          </div>
          <a
            href="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center gap-2 transition shrink-0"
          >
            <Play className="w-4 h-4 fill-white" /> Continue Learning
          </a>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enrolled Course Card */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enrolled Course</span>
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Full-Stack Next.js 15 & TypeScript Mastery</h3>
            <p className="text-xs text-slate-400">Trainer: Prof. Marcus Thorne</p>
            
            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Course Progress</span>
                <span className="text-indigo-400">33.3% (1 / 3 Lessons)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: "33.3%" }} />
              </div>
            </div>
          </div>

          {/* Upcoming Live Class */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Session</span>
              <Video className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Q&A & Code Review</h3>
            <p className="text-xs text-slate-400">Date: Scheduled this week</p>
            <a
              href="https://meet.google.com/abc-defg-hij"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block w-full text-center py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              Join Google Meet
            </a>
          </div>

          {/* Quizzes & Assignments */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Tasks</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>Next.js Core Concepts Quiz</span>
                <span className="text-amber-400 font-semibold">Ready</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span>Auth & RBAC Milestone 1</span>
                <span className="text-indigo-400 font-semibold">14 Days left</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
