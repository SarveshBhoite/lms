"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface TrainerDrawerProps {
  user: {
    name: string;
    email: string;
    role: string;
    designation?: string | null;
    avatarUrl?: string | null;
  };
  unreadNotificationsCount: number;
  liveClassesCount: number;
  pendingAssignmentsCount: number;
  children: React.ReactNode;
}

export default function TrainerDrawerLayout({
  user,
  unreadNotificationsCount,
  liveClassesCount,
  pendingAssignmentsCount,
  children,
}: TrainerDrawerProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever route changes on mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Total aggregated badges count for mobile hamburger button
  const totalBadgesCount =
    unreadNotificationsCount + liveClassesCount + pendingAssignmentsCount;

  const navigation = [
    { name: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/trainer/courses", icon: BookOpen },
    { name: "Content Library", href: "/trainer/content", icon: Layers },
    { name: "My Batches", href: "/trainer/batches", icon: Layers },
    { name: "Students", href: "/trainer/students", icon: Users },
    { name: "Quizzes", href: "/trainer/quizzes", icon: HelpCircle },
    {
      name: "Assignments",
      href: "/trainer/assignments",
      icon: FileCheck,
      badge: pendingAssignmentsCount,
      badgeTooltip: "Pending evaluation",
    },
    {
      name: "Live Classes",
      href: "/trainer/live-classes",
      icon: Video,
      badge: liveClassesCount,
      badgeTooltip: "Upcoming sessions",
    },
    { name: "Attendance", href: "/trainer/attendance", icon: Calendar },
    { name: "Reports", href: "/trainer/reports", icon: BarChart3 },
    {
      name: "Notifications",
      href: "/trainer/notifications",
      icon: Bell,
      badge: unreadNotificationsCount,
      badgeTooltip: "Unread alerts",
    },
    { name: "Profile", href: "/trainer/profile", icon: User },
  ];

  return (
    <div className="min-h-screen h-screen portal-bg-mesh flex flex-col md:flex-row selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Gentle ambient background glows */}
      <div className="fixed top-0 right-0 w-[450px] h-[450px] bg-purple-200/15 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-indigo-200/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* MOBILE TOP BAR (visible on screens < md) */}
      <header className="md:hidden h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-xs">
        <Link href="/trainer/dashboard" className="flex items-center gap-2.5">
          <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-8 w-auto object-contain" />
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100/90 text-[#7C248C] border border-purple-200/60 shadow-2xs">
            Faculty
          </span>
        </Link>

        {/* Mobile Hamburger button with total badges count */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition active:scale-95 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}

          {/* Badges count pill attached directly to the hamburger button */}
          {totalBadgesCount > 0 && !mobileOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black font-mono text-white shadow-md ring-2 ring-white animate-pulse">
              {totalBadgesCount > 99 ? "99+" : totalBadgesCount}
            </span>
          )}
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR / DRAWER:
          - Desktop (md:): stationary, sticky, pinned, w-64, translate-x-0
          - Mobile: fixed drawer sliding in from the left (w-72) with high z-index
      */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 md:w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-xl md:shadow-xs transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Header inside drawer / desktop sidebar */}
          <div className="h-16 md:h-20 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <Link
              href="/trainer/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5"
            >
              <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-9 md:h-10 w-auto object-contain" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100/90 text-[#7C248C] border border-purple-200/60 shadow-2xs">
                Faculty
              </span>
            </Link>

            {/* Mobile close button inside drawer header */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Navigation Links with individual page badges */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all group ${
                      isActive
                        ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20 font-black"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600 transition"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {/* Individual page count badge */}
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span
                        title={item.badgeTooltip}
                        className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold shadow-xs"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-white/80" : "text-slate-300 group-hover:text-purple-400"
                        } transition`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Stationary User Info & Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/70 shrink-0">
          <Link
            href="/trainer/profile"
            onClick={() => setMobileOpen(false)}
            className="p-3 rounded-2xl bg-white/95 border border-slate-200/80 flex items-center gap-3 shadow-xs hover:border-purple-300 transition group block"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-purple-200/80 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl jvm-gradient-bg text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <div className="font-bold text-slate-900 text-xs truncate group-hover:text-[#7C248C] transition">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {user.designation || user.email}
              </div>
            </div>
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 hover:border-rose-200 shadow-2xs"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area - Independently Scrollable */}
      <main className="flex-1 h-[calc(100vh-4rem)] md:h-screen overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
