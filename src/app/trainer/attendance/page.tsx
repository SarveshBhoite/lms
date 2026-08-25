import Link from "next/link";
import prisma from "@/lib/prisma";
import { Calendar, CheckCircle2, User, Clock } from "lucide-react";

export default async function TrainerAttendancePage() {
  const liveClasses = await prisma.liveClass.findMany({
    include: {
      batch: {
        include: {
          students: { include: { user: true } },
        },
      },
      attendances: true,
    },
    orderBy: { scheduledDate: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Class Attendance & Participation</h1>
        <p className="text-slate-400 text-sm mt-1">Review student join metrics, attendance percentages, and presence logs.</p>
      </div>

      <div className="space-y-6">
        {liveClasses.map((lc) => (
          <div key={lc.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-base text-white">{lc.title}</h3>
                <p className="text-xs text-slate-400">Cohort: {lc.batch.name} • {new Date(lc.scheduledDate).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Present
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 pt-2 text-xs">
              {lc.batch.students.map((st) => (
                <div key={st.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-200 font-medium">{st.user.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">({st.user.email})</span>
                  </div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
