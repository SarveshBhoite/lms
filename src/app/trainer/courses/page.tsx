import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen, Plus, Clock, Edit, Layers, Users } from "lucide-react";

export default async function TrainerCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      modules: { include: { lessons: true } },
      enrollments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Course Management</h1>
          <p className="text-slate-400 text-sm mt-1">Design curricula, structure syllabus modules, and publish courseware.</p>
        </div>
        <Link
          href="/trainer/courses/create"
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Create New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {course.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{course.level}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-3">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
            </div>

            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-amber-400" /> {course.modules.length} Modules</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-400" /> {course.enrollments.length} Enrolled</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /> {course.durationHours}h</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/trainer/courses/${course.id}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold text-center border border-slate-700 transition"
                >
                  Manage Syllabus
                </Link>
                <Link
                  href={`/trainer/courses/${course.id}/edit`}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Edit Metadata"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
