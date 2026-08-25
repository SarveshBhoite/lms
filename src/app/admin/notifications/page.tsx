import { Bell, Plus, Send } from "lucide-react";

export default function AdminNotificationsPage() {
  const broadcasts = [
    {
      id: "1",
      title: "Spring 2026 Academic Cohort Launch",
      target: "All Students & Trainers",
      date: "August 24, 2026",
      status: "SENT",
    },
    {
      id: "2",
      title: "System Maintenance Window Completed",
      target: "All Users",
      date: "August 23, 2026",
      status: "SENT",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">System Broadcasts & Announcements</h1>
          <p className="text-slate-400 text-sm mt-1">Send institute-wide notifications, schedule reminders, and urgent alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {broadcasts.map((b) => (
          <div key={b.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{b.title}</h3>
                <p className="text-xs text-slate-400">Target: <strong className="text-slate-300">{b.target}</strong> • {b.date}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
