import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookOpen, Clock, Layers, Play, CheckCircle2, Award, User, ArrowLeft } from "lucide-react";

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      trainer: {
        include: { profile: true },
      },
      modules: {
        include: { lessons: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
      {/* Back Button */}
      <Link href="/student/courses" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-80 h-48 rounded-xl bg-slate-800 overflow-hidden relative shrink-0">
            {course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-indigo-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              Level: {course.level}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{course.title}</h1>
            <p className="text-slate-400 text-sm">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {course.durationHours} Total Hours</span>
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-400" /> {totalLessons} Lessons</span>
              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-400" /> Lead: {course.trainer.name}</span>
            </div>

            {firstLesson && (
              <div className="pt-3">
                <Link
                  href={`/student/lessons/${firstLesson.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition"
                >
                  <Play className="w-4 h-4 fill-white" /> Start Learning Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Syllabus / Modules Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> Course Syllabus & Modules
        </h2>

        <div className="space-y-4">
          {course.modules.map((mod, idx) => (
            <div key={mod.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">Module {idx + 1}: {mod.title}</h3>
                  {mod.description && <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>}
                </div>
                <span className="text-xs text-indigo-400 font-semibold">{mod.lessons.length} Lessons</span>
              </div>

              <div className="divide-y divide-slate-800/60 pt-2">
                {mod.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/student/lessons/${lesson.id}`}
                    className="py-2.5 px-3 rounded-lg hover:bg-slate-800/50 flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <Play className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-200 group-hover:text-white">{lesson.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{lesson.durationMinutes} mins</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
