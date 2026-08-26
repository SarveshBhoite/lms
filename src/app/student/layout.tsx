"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  FileText,
  Video,
  Award,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/student/courses", icon: BookOpen },
  { label: "Quizzes", href: "/student/quizzes", icon: HelpCircle },
  { label: "Assignments", href: "/student/assignments", icon: FileText },
  { label: "Live Classes", href: "/student/live-classes", icon: Video },
  { label: "Certificates", href: "/student/certificates", icon: Award },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
  { label: "My Profile", href: "/student/profile", icon: User },
];

const mobileBottomNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Courses", href: "/student/courses", icon: BookOpen },
  { label: "Live", href: "/student/live-classes", icon: Video },
  { label: "Quizzes", href: "/student/quizzes", icon: HelpCircle },
  { label: "Profile", href: "/student/profile", icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
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
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden h-16 border-b border-slate-800/80 bg-[#06080F]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight">{INSTITUTE_CONFIG.shortName}</span>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
              {INSTITUTE_CONFIG.portals.student.badge}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/notifications"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay (Tap to Dismiss) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Desktop Fixed / Mobile Slide-Over) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-[#090D1A]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Institute Brand Header */}
        <div className="h-20 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="font-extrabold text-base text-white tracking-tight">{INSTITUTE_CONFIG.shortName}</div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> {INSTITUTE_CONFIG.portals.student.badge}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Navigation Track
          </div>
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <div className="text-xs font-bold text-white truncate">{user?.name || "Student Learner"}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {user?.email || "student@institute.edu"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Bottom Padding on Mobile for Bottom Bar */}
      <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Smartphone Bottom Quick Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090D1A]/95 backdrop-blur-xl border-t border-slate-800/90 z-30 px-3 flex items-center justify-around">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition ${
                isActive ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

