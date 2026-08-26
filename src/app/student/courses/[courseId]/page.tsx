import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  BookOpen,
  Clock,
  Layers,
  Play,
  CheckCircle2,
  Award,
  User,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await getSession();

  const [course, enrollment, progress, lessonProgresses] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainer: {
          include: { profile: true },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    }),
    session?.userId
      ? prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.userId,
              courseId,
            },
          },
        })
      : null,
    session?.userId
      ? prisma.courseProgress.findUnique({
          where: {
            userId_courseId: {
              userId: session.userId,
              courseId,
            },
          },
        })
      : null,
    session?.userId
      ? prisma.lessonProgress.findMany({
          where: {
            userId: session.userId,
            isCompleted: true,
          },
        })
      : [],
  ]);

  if (!course) {
    notFound();
  }

  const completedLessonIdSet = new Set(lessonProgresses.map((lp) => lp.lessonId));
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const firstLesson = course.modules[0]?.lessons[0];
  const percent = progress?.progressPercent || 0;

  // Find next uncompleted lesson or first lesson
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const nextLesson = allLessons.find((l) => !completedLessonIdSet.has(l.id)) || firstLesson;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
      {/* Back Button */}
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course Catalog
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-full md:w-80 h-52 rounded-2xl bg-slate-900 overflow-hidden relative shrink-0 border border-slate-800 shadow-xl">
            {course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-950 to-slate-900">
                <BookOpen className="w-14 h-14 text-indigo-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20 uppercase font-mono">
                Level: {course.level}
              </span>
              {enrollment && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Enrolled Student
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {course.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-indigo-400" /> {course.durationHours} Total Hours
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Layers className="w-4 h-4 text-indigo-400" /> {totalLessons} Lessons
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" /> Faculty Lead: {course.trainer.name}
              </span>
            </div>

            {/* Progress Bar if Enrolled */}
            {enrollment && (
              <div className="space-y-1.5 pt-2 max-w-md">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Track Completion</span>
                  <span className="text-indigo-300 font-bold">{percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3">
              {nextLesson && (
                <Link
                  href={`/student/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {enrollment ? (percent > 0 ? "Resume Next Lesson" : "Start Learning") : "Start Course Curriculum"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus / Modules Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Layers className="w-5 h-5 text-indigo-400" /> Curriculum Syllabus & Lessons
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {course.modules.length} Modules • {totalLessons} Total Lessons
          </span>
        </div>

        <div className="space-y-4">
          {course.modules.map((mod, idx) => (
            <div key={mod.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white">
                    Module {idx + 1}: {mod.title}
                  </h3>
                  {mod.description && <p className="text-xs text-slate-400 mt-1">{mod.description}</p>}
                </div>
                <span className="text-xs text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  {mod.lessons.length} Lessons
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 pt-1">
                {mod.lessons.map((lesson) => {
                  const isCompleted = completedLessonIdSet.has(lesson.id);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/student/lessons/${lesson.id}`}
                      className="py-3 px-3.5 rounded-xl hover:bg-slate-800/60 flex items-center justify-between group transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white block">
                            {lesson.title}
                          </span>
                          {lesson.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">{lesson.description}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">{lesson.durationMinutes} mins</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
