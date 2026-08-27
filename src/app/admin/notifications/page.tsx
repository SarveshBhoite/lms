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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">System Broadcasts & Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">Send institute-wide notifications, schedule reminders, and urgent alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {broadcasts.map((b) => (
          <div key={b.id} className="glass-card p-5 rounded-3xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Target: <strong className="text-slate-800">{b.target}</strong> • {b.date}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
