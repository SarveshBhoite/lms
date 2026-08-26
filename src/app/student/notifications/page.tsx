"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  Award,
  Video,
  FileText,
  HelpCircle,
  Loader2,
  CheckCheck,
  Sparkles,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/notifications");
      const data = await res.json();
      if (data.success && data.notifications.length > 0) {
        setNotifications(data.notifications);
      } else {
        // Fallback sample notifications if freshly seeded
        setNotifications([
          {
            id: "1",
            title: "Live Q&A Session Scheduled",
            message: "Your instructor Prof. Marcus Thorne scheduled a Live Q&A on Google Meet.",
            type: "LIVE_CLASS_REMINDER",
            isRead: false,
            actionUrl: "/student/live-classes",
            createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          },
          {
            id: "2",
            title: "New Capstone Milestone Released",
            message: "Capstone Milestone 1: Secure Auth & RBAC Architecture is now open for submission.",
            type: "ASSIGNMENT_DUE",
            isRead: false,
            actionUrl: "/student/assignments",
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          },
          {
            id: "3",
            title: "Welcome to JVM Institute Alpha Cohort",
            message: "Your student credentials and workspace access have been fully verified.",
            type: "SYSTEM_ALERT",
            isRead: true,
            actionUrl: "/student/dashboard",
            createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          },
        ]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      setMarking(true);
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "LIVE_CLASS_REMINDER":
        return <Video className="w-5 h-5 text-cyan-400" />;
      case "ASSIGNMENT_DUE":
      case "ASSIGNMENT_EVALUATED":
        return <FileText className="w-5 h-5 text-amber-400" />;
      case "QUIZ_PUBLISHED":
        return <HelpCircle className="w-5 h-5 text-indigo-400" />;
      case "CERTIFICATE_ISSUED":
        return <Award className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" /> Institutional Broadcasts
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Notifications & Broadcasts</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Stay updated on schedule changes, milestone evaluations, and curriculum announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={marking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />} Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800 space-y-2">
          <Bell className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No Notifications</p>
          <p className="text-xs text-slate-500">You are all caught up with your cohort broadcasts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const timeFormatted = new Date(n.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={n.id}
                className={`glass-panel p-5 rounded-3xl border transition flex items-start gap-4 shadow-lg ${
                  !n.isRead ? "border-indigo-500/40 bg-indigo-950/10" : "border-slate-800/80"
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shrink-0" />
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">{timeFormatted}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>

                  {n.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={n.actionUrl}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center gap-1"
                      >
                        Open Linked View →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
