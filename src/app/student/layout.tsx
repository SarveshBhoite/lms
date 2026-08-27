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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Logo Header */}
          <div className="h-20 px-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-2.5">
              <img src="/jvm_logo-bg.png" alt="JVM Institute Logo" className="h-10 w-auto object-contain" />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#7C248C]">
                Student
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all group ${
                    isActive
                      ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20 font-black"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600 transition"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-slate-300 group-hover:text-purple-400"} transition`} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-xs truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{user.email}</div>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
