"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ArrowRight, Check } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

export default function StudentNotificationsClient({
  initialNotifications,
  currentUserId,
}: {
  initialNotifications: NotificationItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[#7C248C]" /> Notifications & Updates
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time updates on live sessions, quiz results, assignments, and class recordings.
          </p>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-3xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                n.isRead
                  ? "glass-card bg-white border-slate-200"
                  : "bg-purple-50/50 border-purple-200/80 shadow-xs"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{n.title}</h3>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#E01E6A] inline-block shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.actionUrl && (
                  <Link
                    href={n.actionUrl}
                    className="px-3.5 py-1.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1 shadow-xs transition hover:scale-[1.02]"
                  >
                    <span>View Item</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Bell className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No notifications logged for your account.</p>
        </div>
      )}
    </div>
  );
}
