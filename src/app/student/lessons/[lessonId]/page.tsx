import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Play, CheckCircle2, FileText, ArrowLeft, ArrowRight, BookOpen, Download } from "lucide-react";

export default async function StudentLessonViewPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: true,
      module: {
        include: {
          course: {
            include: {
              modules: {
                include: { lessons: true },
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const course = lesson.module.course;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href={`/student/courses/${course.id}`} className="hover:text-white flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> {course.title}
        </Link>
        <span>/</span>
        <span className="text-slate-200">{lesson.module.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lesson Player Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-2xl relative">
            {lesson.contentUrl ? (
              <video
                controls
                className="w-full h-full object-cover"
                src={lesson.contentUrl}
                poster="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&auto=format&fit=crop&q=80"
              >
                Your browser does not support HTML video.
              </video>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Play className="w-12 h-12 mb-2 text-indigo-400" />
                <span>Text / Resource Lesson</span>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{lesson.title}</h1>
              <span className="text-xs text-indigo-400 font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                {lesson.durationMinutes} Minutes
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lesson.description || "In this session, learn essential design patterns and best practices for building scalable applications."}
            </p>
          </div>
        </div>

        {/* Course Syllabus Sidebar */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Course Outline
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {course.modules.map((mod) => (
                <div key={mod.id} className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">{mod.title}</div>
                  <div className="space-y-1">
                    {mod.lessons.map((les) => {
                      const isCurrent = les.id === lesson.id;
                      return (
                        <Link
                          key={les.id}
                          href={`/student/lessons/${les.id}`}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                            isCurrent
                              ? "bg-indigo-600 text-white font-semibold"
                              : "bg-slate-900/60 hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Play className={`w-3 h-3 ${isCurrent ? "text-white" : "text-indigo-400"}`} />
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span className="text-[10px] opacity-70 shrink-0 ml-2 font-mono">{les.durationMinutes}m</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
