"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronRight,
} from "lucide-react";

interface StudentNavProps {
  unreadCount: number;
}

export default function StudentSidebarNav({ unreadCount }: StudentNavProps) {
  const pathname = usePathname();

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
    <nav className="p-4 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/student/dashboard" && pathname.startsWith(item.href));

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
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-slate-500 group-hover:text-purple-600 transition"
                }`}
              />
              <span>{item.name}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                {item.badge}
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
  );
}
