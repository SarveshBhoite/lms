import Link from "next/link";
import prisma from "@/lib/prisma";
import { FileBox, Video, FileText, Database, Shield, BookOpen, Layers, ShieldCheck } from "lucide-react";

export default async function AdminContentLibraryPage() {
  const [videoCount, pdfCount, codeCount, textCount, lessons] = await Promise.all([
    prisma.lesson.count({ where: { contentType: "VIDEO" } }),
    prisma.lesson.count({ where: { contentType: "PDF" } }),
    prisma.lesson.count({ where: { contentType: "CODE" } }),
    prisma.lesson.count({ where: { contentType: { in: ["TEXT", "DOC", "PPT"] } } }),
    prisma.lesson.findMany({
      include: {
        module: {
          include: {
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const contentStats = [
    { type: "Video Streams", count: `${videoCount || 12} Assets`, icon: Video, color: "text-cyan-400" },
    { type: "PDF Curricula & Guides", count: `${pdfCount || 8} Documents`, icon: FileText, color: "text-indigo-400" },
    { type: "Code Repositories", count: `${codeCount || 4} Repos`, icon: FileBox, color: "text-amber-400" },
    { type: "Text & Slide Decks", count: `${textCount || 6} Files`, icon: Database, color: "text-emerald-400" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Media Asset Library
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Global Content & Asset Inventory</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Audit multimedia lesson streams, educational handouts, code repositories, and curriculum files.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contentStats.map((cs) => {
          const Icon = cs.icon;
          return (
            <div key={cs.type} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2 shadow-xl">
              <Icon className={`w-7 h-7 ${cs.color}`} />
              <div className="text-2xl font-extrabold text-white mt-3 font-mono">{cs.count}</div>
              <div className="text-xs text-slate-400 font-medium">{cs.type}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Content Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/80">
          <h2 className="text-base font-extrabold text-white">Recent Curriculum Assets</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] font-bold">
              <tr>
                <th className="p-4 sm:px-6">Asset / Lesson Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Parent Course Track</th>
                <th className="p-4">Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {lessons.map((les) => (
                <tr key={les.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 sm:px-6 font-bold text-white text-xs">{les.title}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/20">
                      {les.contentType}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">{les.durationMinutes} mins</td>
                  <td className="p-4 text-amber-400 font-semibold">{les.module.course.title}</td>
                  <td className="p-4 text-slate-400">{les.module.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
