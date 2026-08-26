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
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Eye,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Course Catalog", href: "/admin/courses", icon: BookOpen },
  { label: "Batches & Cohorts", href: "/admin/batches", icon: Layers },
  { label: "Enrollments", href: "/admin/enrollments", icon: Users },
  { label: "Certificates Registry", href: "/admin/certificates", icon: Award },
  { label: "Content Library", href: "/admin/content", icon: FileBox },
  { label: "Broadcasts", href: "/admin/notifications", icon: Bell },
  { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Logs", href: "/admin/activity-logs", icon: Activity },
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
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-rose-500 selection:text-white">
      {/* Mobile Top Nav */}
      <div className="md:hidden h-16 border-b border-slate-800/80 bg-[#06080F]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-tight">{INSTITUTE_CONFIG.shortName}</div>
            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider font-mono">
              {INSTITUTE_CONFIG.portals.admin.badge}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-[#090D1A]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo & Institute Header */}
        <div className="h-20 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 border border-rose-400/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="font-extrabold text-base text-white tracking-tight">{INSTITUTE_CONFIG.shortName}</div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {INSTITUTE_CONFIG.portals.admin.badge}
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

        {/* Multi-Role Quick Switcher / Portal Preview */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1">
            <Eye className="w-3 h-3 text-rose-400" /> Student Space Preview
          </div>
          <div>
            <Link
              href="/student/dashboard"
              className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
              title="Switch to Student Dashboard View"
            >
              <GraduationCap className="w-3.5 h-3.5" /> View as Student
            </Link>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/25 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-200" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <div className="text-xs font-bold text-white truncate">{user?.name || "Administrator"}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email || "admin@institute.edu"}</div>
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

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">{children}</main>
    </div>
  );
}
