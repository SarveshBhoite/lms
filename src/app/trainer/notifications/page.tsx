import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Bell } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerNotificationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-amber-600" /> Notifications & Alerts
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Recent announcements, assignment submission updates, live class reminders, and system alerts.
        </p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl bg-white border shadow-xs flex items-start justify-between gap-4 transition ${
                !n.isRead ? "border-amber-300 bg-amber-50/50" : "border-slate-200"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase font-bold">
                    {n.type}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                </div>
                <p className="text-xs text-slate-700 pl-0.5">{n.message}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Bell className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No new notifications in your inbox.</p>
        </div>
      )}
    </div>
  );
}
