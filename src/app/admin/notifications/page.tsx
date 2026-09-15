import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const pageSize = 10;

  // 1. Fetch total count of all notifications in system (students and trainers)
  // and load the first 10 items for immediate rendering
  const [totalCount, notifications] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
    }),
  ]);

  const serialized = notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    actionUrl: n.actionUrl,
    createdAt: n.createdAt.toISOString(),
    user: n.user,
  }));

  const initialPagination = {
    page: 1,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasMore: totalCount > pageSize,
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh, exactly matching trainer and student notification pages) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Bell className="w-3 h-3 text-[#7C248C]" /> Feed & Real-Time Alerts
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications & <span className="jvm-gradient-text">Updates</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Stay updated with student submissions, live class schedules, faculty evaluations, and cohort updates.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {totalCount} {totalCount === 1 ? "Alert" : "Alerts"} Total
          </span>
        </div>
      </div>

      <AdminNotificationsClient
        initialNotifications={serialized as any}
        initialPagination={initialPagination}
      />
    </div>
  );
}
