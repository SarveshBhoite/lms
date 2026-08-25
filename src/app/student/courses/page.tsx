import Link from "next/link";
import { BookOpen, Search, Clock, ArrowRight, Play, Award, Layers } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function StudentCoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      trainer: { select: { name: true } },
      modules: {
        include: { lessons: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Course Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Explore all curriculum programs and continue your learning track.</p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

          return (
            <div key={course.id} className="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col group hover:border-indigo-500/40 transition">
              <div className="h-44 bg-slate-800 relative overflow-hidden">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-slate-900 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-indigo-400/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] uppercase font-bold text-indigo-300 border border-slate-700">
                  {course.level}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition">{course.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{course.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.durationHours} Hours</span>
                    <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {totalLessons} Lessons</span>
                  </div>

                  <Link
                    href={`/student/courses/${course.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    View Curriculum <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
