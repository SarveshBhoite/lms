import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookOpen, Layers, Plus, Edit, Play, ArrowLeft } from "lucide-react";

export default async function TrainerCourseCurriculumPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
      <Link href="/trainer/courses" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {course.status}
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2">{course.title}</h1>
          <p className="text-xs text-slate-400 mt-1">{course.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/trainer/courses/${course.id}/edit`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Edit Settings
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" /> Syllabus Modules & Lessons
          </h2>
        </div>

        <div className="space-y-4">
          {course.modules.map((mod, idx) => (
            <div key={mod.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Module {idx + 1}: {mod.title}</h3>
                <span className="text-xs text-amber-400 font-semibold">{mod.lessons.length} Lessons</span>
              </div>

              <div className="divide-y divide-slate-800/60 pt-1">
                {mod.lessons.map((les) => (
                  <div key={les.id} className="py-2.5 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-200">{les.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{les.durationMinutes} mins</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
