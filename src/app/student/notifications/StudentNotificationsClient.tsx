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
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600" /> Notifications & Updates
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
              className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                n.isRead
                  ? "bg-white border-slate-200"
                  : "bg-indigo-50/60 border-indigo-200 shadow-xs"
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1" suppressHydrationWarning>
                  {new Date(n.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                    hour12: true,
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                  </button>
                )}

                {n.actionUrl && (
                  <Link
                    href={n.actionUrl}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    View Item <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
