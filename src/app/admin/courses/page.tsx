import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen, Plus, Clock, Users, Layers, ShieldCheck, Globe, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  let courses: any[] = [];

  try {
    courses = await prisma.course.findMany({
      include: {
        modules: { include: { lessons: true } },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    courses = [
      {
        id: "c1",
        title: "Full-Stack Next.js 15 & Enterprise Architecture",
        description: "Master App Router, Server Actions, RBAC auth, Prisma ORM, and high-concurrency cloud scaling.",
        durationHours: 42,
        level: "INTERMEDIATE",
        status: "PUBLISHED",
        modules: [{ lessons: [{ id: "l1" }] }],
        enrollments: [{ id: "e1" }],
      },
    ];
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Institutional Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Enterprise Course Oversight</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Audit curriculum tracks, review course syllabi, and monitor student enrollment loads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => {
          const isPublished = c.status === "PUBLISHED";
          const totalLessons = c.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;

          return (
            <div
              key={c.id}
              className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-xl"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border font-mono ${
                      isPublished
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{c.level}</span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">Enrollments:</span>
                  <span className="font-bold text-indigo-400 font-mono">{c.enrollments?.length || 0} Students</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">Curriculum:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {c.modules?.length || 0} Modules ({totalLessons} Lessons)
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/student/courses/${c.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold text-center border border-slate-700 block transition"
                  >
                    Inspect Curriculum Structure
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
