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
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const trainerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/trainer/courses", icon: BookOpen },
  { label: "My Batches", href: "/trainer/batches", icon: Layers },
  { label: "Students", href: "/trainer/students", icon: Users },
  { label: "Quizzes", href: "/trainer/quizzes", icon: HelpCircle },
  { label: "Assignments", href: "/trainer/assignments", icon: FileCheck },
  { label: "Live Classes", href: "/trainer/live-classes", icon: Video },
  { label: "Attendance", href: "/trainer/attendance", icon: Calendar },
  { label: "Reports", href: "/trainer/reports", icon: BarChart3 },
  { label: "Notifications", href: "/trainer/notifications", icon: Bell },
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
        if (data.user && (data.user.role === "TRAINER" || data.user.role === "ADMIN")) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img src="/jvm_logo-bg.png" alt="JVM Institute" className="h-8 w-auto object-contain" />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">Trainer Studio</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Drawer Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 shadow-xs ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Portal Header */}
        <div className="h-20 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-10 w-auto object-contain" />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#7C248C]">
              Faculty
            </span>
          </div>
        </div>

        {/* Flat Ordered Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {trainerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20 font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="overflow-hidden mr-2">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.name || "Faculty Member"}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{user?.email || "trainer@institute.edu"}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Faculty Content Surface */}
      <main className="flex-1 min-w-0 flex flex-col bg-slate-50 overflow-x-hidden">{children}</main>
    </div>
  );
}
