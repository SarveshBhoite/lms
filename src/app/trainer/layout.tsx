"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  FileCode2,
  Users,
  HelpCircle,
  FileCheck,
  Calendar,
  Video,
  BarChart3,
  User,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const facultyNavGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Teaching",
    items: [
      { label: "My Courses", href: "/trainer/courses", icon: BookOpen },
      { label: "Modules", href: "/trainer/modules", icon: Layers },
      { label: "Lessons", href: "/trainer/lessons", icon: FileCode2 },
      { label: "Students", href: "/trainer/students", icon: Users },
    ],
  },
  {
    group: "Assessment",
    items: [
      { label: "Quizzes", href: "/trainer/quizzes", icon: HelpCircle },
      { label: "Assignments", href: "/trainer/assignments", icon: FileCheck },
    ],
  },
  {
    group: "Batches",
    items: [
      { label: "My Batches", href: "/trainer/batches", icon: Layers },
      { label: "Attendance", href: "/trainer/attendance", icon: Calendar },
    ],
  },
  {
    group: "Live & Reports",
    items: [
      { label: "Live Classes", href: "/trainer/live-classes", icon: Video },
      { label: "Reports", href: "/trainer/reports", icon: BarChart3 },
      { label: "Profile", href: "/trainer/profile", icon: User },
    ],
  },
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
      <div className="md:hidden h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">JVM LMS</div>
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Faculty Portal</div>
          </div>
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
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 shadow-sm ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Portal Header */}
        <div className="h-20 px-6 border-b border-slate-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25 border border-amber-400/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900 tracking-tight">JVM LMS</div>
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest font-mono flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Faculty Studio
            </div>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {facultyNavGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
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
