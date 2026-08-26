import Link from "next/link";
import prisma from "@/lib/prisma";
import { Layers, Calendar, Users, BookOpen, ShieldCheck, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  let batches: any[] = [];

  try {
    batches = await prisma.batch.findMany({
      include: {
        course: { select: { title: true } },
        students: true,
        liveClasses: true,
      },
      orderBy: { startDate: "asc" },
    });
  } catch {
    batches = [
      {
        id: "b1",
        name: "Next.js Alpha Cohort 2026",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        status: "ONGOING",
        course: { title: "Full-Stack Next.js 15 & Enterprise Architecture" },
        students: [{ id: "s1" }, { id: "s2" }],
        liveClasses: [{ id: "lc1" }],
      },
    ];
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Institutional Allocation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Batches & Cohort Allocation
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Structure student cohorts, monitor enrollment loads, and govern academic capacity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((b) => {
          const studentCount = b.students?.length || 0;
          const maxCapacity = 30;
          const capPercent = Math.min(100, Math.round((studentCount / maxCapacity) * 100));

          return (
            <div
              key={b.id}
              className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 hover:border-slate-700 transition shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {b.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{b.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Course Track: <span className="text-indigo-400 font-semibold">{b.course?.title}</span>
                  </p>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Cohort Load</span>
                    <span className="text-white font-bold">
                      {studentCount} / {maxCapacity} Students ({capPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${capPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" /> {studentCount} Enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" /> {b.liveClasses?.length || 0} Scheduled Classes
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
