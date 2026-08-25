import Link from "next/link";
import prisma from "@/lib/prisma";
import { Layers, Calendar, Users, BookOpen } from "lucide-react";

export default async function AdminBatchesPage() {
  const batches = await prisma.batch.findMany({
    include: {
      course: { select: { title: true } },
      students: true,
      trainers: { include: { trainer: true } },
      liveClasses: true,
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Batches & Cohort Allocation</h1>
        <p className="text-slate-400 text-sm mt-1">Structure student cohorts, map trainers, and manage batch lifecycles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((b) => (
          <div key={b.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {b.status}
              </span>
              <span className="text-xs text-slate-400">{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{b.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Course: <span className="text-white font-medium">{b.course.title}</span></p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" /> {b.students.length} Students</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-cyan-400" /> {b.liveClasses.length} Scheduled Classes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
