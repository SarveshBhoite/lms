import Link from "next/link";
import prisma from "@/lib/prisma";
import { Play, Video, FileText, Plus } from "lucide-react";

export default async function TrainerLessonsPage() {
  const lessons = await prisma.lesson.findMany({
    include: {
      module: {
        include: { course: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Lesson Content & Video Assets</h1>
        <p className="text-slate-400 text-sm mt-1">Upload educational video streams, notes, slides, and learning resources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((les) => (
          <div key={les.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {les.contentType}
              </span>
              <span className="text-xs text-slate-400 font-mono">{les.durationMinutes} mins</span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-white">{les.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{les.description || "Video lecture and source code breakdown."}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Module: <span className="text-slate-300 font-medium">{les.module.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
