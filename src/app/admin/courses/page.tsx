import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen, Plus, Clock, Users, Layers } from "lucide-react";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      trainer: { select: { name: true } },
      modules: true,
      enrollments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">System Course Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">Audit, moderate, and manage all published and draft courses across the institute.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {c.status}
              </span>
              <span className="text-xs text-slate-400">{c.level}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{c.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Instructor:</span>
                <span className="font-semibold text-white">{c.trainer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enrolled:</span>
                <span className="font-semibold text-indigo-400">{c.enrollments.length} Students</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
