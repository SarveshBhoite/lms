import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Award,
  Bell,
  User,
  GraduationCap,
  LogOut,
  ChevronRight,
} from "lucide-react";
import prisma from "@/lib/prisma";
import StudentSidebarNav from "./StudentSidebarNav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  // Verify student isActive
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, name: true, email: true, profile: { select: { avatarUrl: true } } },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.userId, isRead: false },
  });

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/student/courses", icon: BookOpen },
    { name: "Live Classes", href: "/student/live-classes", icon: Video },
    { name: "Quizzes", href: "/student/quizzes", icon: HelpCircle },
    { name: "Assignments", href: "/student/assignments", icon: FileCheck },
    { name: "Attendance", href: "/student/attendance", icon: CheckSquare },
    { name: "Certificates", href: "/student/certificates", icon: Award },
    { name: "Notifications", href: "/student/notifications", icon: Bell, badge: unreadCount },
    { name: "Profile", href: "/student/profile", icon: User },
  ];

  return (
    <div className="min-h-screen h-screen portal-bg-mesh flex flex-col md:flex-row selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Gentle, subtle ambient glows */}
      <div className="fixed top-0 right-0 w-[450px] h-[450px] bg-purple-200/15 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-indigo-200/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Fixed / Sticky Sidebar */}
      <aside className="w-full md:w-64 h-auto md:h-screen md:sticky top-0 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-xs z-20 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Header */}
          <div className="h-20 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <Link href="/student/dashboard" className="flex items-center gap-2.5">
              <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-10 w-auto object-contain" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100/90 text-[#7C248C] border border-purple-200/60 shadow-2xs">
                Student
              </span>
            </Link>
          </div>

          {/* Scrollable Navigation Links (if screen height is small) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <StudentSidebarNav unreadCount={unreadCount} />
          </div>
        </div>

        {/* User Info & Logout Footer - Stationary / Pinned at bottom */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/70 shrink-0">
          <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/80 flex items-center gap-3 shadow-xs">
            {user.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-purple-200/80 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl jvm-gradient-bg text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-xs truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{user.email}</div>
            </div>
          </div>

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
      <main className="flex-1 h-screen overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}

