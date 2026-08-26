"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  HelpCircle,
  FileCheck,
  Video,
  Calendar,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

const trainerNavItems = [
  { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/trainer/courses", icon: BookOpen },
  { label: "My Batches", href: "/trainer/batches", icon: Layers },
  { label: "Students", href: "/trainer/students", icon: Users },
  { label: "Quizzes", href: "/trainer/quizzes", icon: HelpCircle },
  { label: "Assignments", href: "/trainer/assignments", icon: FileCheck },
  { label: "Live Classes", href: "/trainer/live-classes", icon: Video },
  { label: "Attendance", href: "/trainer/attendance", icon: Calendar },
  { label: "Reports", href: "/trainer/reports", icon: BarChart3 },
  { label: "Profile", href: "/trainer/profile", icon: User },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">{INSTITUTE_CONFIG.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold uppercase border border-amber-500/20">
            Trainer
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900/95 md:bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-5 flex flex-col justify-between z-40 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-600/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight leading-none">
                {INSTITUTE_CONFIG.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Faculty Studio
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {trainerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/trainer/dashboard"
                  ? pathname === "/trainer/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
              {user?.name ? user.name[0].toUpperCase() : "T"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Faculty Member"}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{user?.email || "trainer@institute.edu"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Page Content Area */}
      <main className="flex-1 min-w-0 bg-slate-950 overflow-y-auto">{children}</main>
    </div>
  );
}
