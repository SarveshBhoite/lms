import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Play, Video, FileText } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerLessonsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const lessons = await prisma.lesson.findMany({
    where: isAdmin
      ? {}
      : {
          module: {
            course: {
              OR: [
                { trainerId },
                { batches: { some: { trainers: { some: { trainerId } } } } },
              ],
            },
          },
        },
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
        <p className="text-slate-400 text-sm mt-1">Review educational video streams, notes, slides, and learning resources across your assigned scope.</p>
      </div>

      {lessons.length > 0 ? (
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
                Module: <span className="text-slate-300 font-medium">{les.module.title}</span> ({les.module.course.title})
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">No lessons found in your assigned scope.</p>
        </div>
      )}
    </div>
  );
}
