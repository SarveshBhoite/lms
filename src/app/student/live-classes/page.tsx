import Link from "next/link";
import prisma from "@/lib/prisma";
import { Video, Calendar, Clock, User, ArrowRight } from "lucide-react";

export default async function StudentLiveClassesPage() {
  const liveClasses = await prisma.liveClass.findMany({
    include: {
      trainer: { select: { name: true } },
      batch: { select: { name: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Live Classes & Cohort Lectures</h1>
        <p className="text-slate-400 text-sm mt-1">Join interactive live video mentoring sessions and Google Meet workshops.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveClasses.map((lc) => (
          <div key={lc.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {lc.batch.name}
              </span>
              <span className="text-xs text-slate-400">{new Date(lc.scheduledDate).toLocaleDateString()}</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{lc.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{lc.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Instructor: {lc.trainer.name}</span>
              </div>

              <a
                href={lc.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition"
              >
                <Video className="w-4 h-4" /> Join Class
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
