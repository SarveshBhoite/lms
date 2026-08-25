import { Bell, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export default function StudentNotificationsPage() {
  const notifications = [
    {
      id: "1",
      title: "Live Class Scheduled",
      message: "Your instructor Prof. Marcus Thorne scheduled a Live Q&A on Google Meet.",
      time: "2 hours ago",
      type: "info",
    },
    {
      id: "2",
      title: "New Assignment Released",
      message: "Capstone Milestone 1: Secure Auth & RBAC Architecture is now available for submission.",
      time: "1 day ago",
      type: "alert",
    },
    {
      id: "3",
      title: "Welcome to Next.js Cohort Alpha",
      message: "You have been enrolled into Spring 2026 academic batch.",
      time: "3 days ago",
      type: "success",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Notifications & Broadcasts</h1>
        <p className="text-slate-400 text-sm mt-1">Stay updated with classroom announcements, assignments, and grades.</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <span className="text-[11px] text-slate-400">{n.time}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
