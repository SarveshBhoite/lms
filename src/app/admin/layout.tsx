"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  FileBox,
  Bell,
  BarChart3,
  Activity,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Trainers & Faculty", href: "/admin/trainers", icon: GraduationCap },
  { label: "Course Catalog", href: "/admin/courses", icon: BookOpen },
  { label: "Content Library", href: "/admin/content", icon: FileBox },
  { label: "Batches & Cohorts", href: "/admin/batches", icon: Layers },
  { label: "Attendance Control", href: "/admin/attendance", icon: CheckSquare },
  { label: "Enrollments", href: "/admin/enrollments", icon: Users },
  { label: "Certificates Registry", href: "/admin/certificates", icon: Award },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
  { label: "System Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img src="/jvm_logo-bg.png" alt="JVM Institute" className="h-8 w-auto object-contain" />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">Admin Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 shadow-xs ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="h-20 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-10 w-auto object-contain" />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#7C248C]">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
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
          <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="overflow-hidden mr-2">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Raj Bhoite"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {user?.email || "rajb81008@gmail.com"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-slate-50">{children}</main>
    </div>
  );
}
