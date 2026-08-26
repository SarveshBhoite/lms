import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { ChevronLeft, BookOpen, Layers, FileCode2, Download, Users, Video } from "lucide-react";
import { redirect, notFound } from "next/navigation";

export default async function TrainerCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              resources: true,
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
      batches: {
        where: isAdmin ? {} : { OR: [{ course: { trainerId: session.userId } }, { trainers: { some: { trainerId: session.userId } } }] },
        include: {
          students: true,
          liveClasses: true,
        },
      },
      quizzes: true,
      assignments: true,
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          Faculty View (Read-Only Structure)
        </span>
      </div>

      {/* Course Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {course.status}
          </span>
          <span className="text-xs text-slate-500 font-mono">{course.level}</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900">{course.title}</h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">{course.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">MODULES</span>
            <strong className="text-slate-900 text-base font-bold">{course.modules.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">TOTAL LESSONS</span>
            <strong className="text-slate-900 text-base font-bold">
              {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">QUIZZES</span>
            <strong className="text-slate-900 text-base font-bold">{course.quizzes.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px]">ASSIGNMENTS</span>
            <strong className="text-slate-900 text-base font-bold">{course.assignments.length}</strong>
          </div>
        </div>
      </div>

      {/* Modules & Lessons Accordion / List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600" /> Curriculum Modules & Resources
        </h2>

        {course.modules.length > 0 ? (
          <div className="space-y-4">
            {course.modules.map((mod, idx) => (
              <div key={mod.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-mono">
                      Module {idx + 1}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{mod.title}</h3>
                    {mod.description && <p className="text-xs text-slate-600 mt-1">{mod.description}</p>}
                  </div>
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    {mod.lessons.length} Lessons
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  {mod.lessons.map((les) => (
                    <div key={les.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileCode2 className="w-4 h-4 text-cyan-600" />
                          <span className="text-xs font-bold text-slate-900">{les.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">({les.contentType})</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{les.durationMinutes} mins</span>
                      </div>

                      {les.description && <p className="text-xs text-slate-600 pl-6">{les.description}</p>}

                      {les.resources.length > 0 && (
                        <div className="pl-6 pt-2 flex flex-wrap gap-2">
                          {les.resources.map((res) => (
                            <a
                              key={res.id}
                              href={res.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-amber-600 flex items-center gap-1.5 transition shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" /> {res.title} ({res.fileType})
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No modules added to this course yet.
          </div>
        )}
      </div>

      {/* Cohorts for this Course */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> My Cohorts for this Course
        </h2>

        {course.batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.batches.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 font-mono">
                  <span><Users className="w-3.5 h-3.5 inline text-indigo-600" /> {b.students.length} Students</span>
                  <span><Video className="w-3.5 h-3.5 inline text-cyan-600" /> {b.liveClasses.length} Live Classes</span>
                </div>
                <Link
                  href={`/trainer/batches/${b.id}`}
                  className="block text-center w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-xs"
                >
                  Manage Batch Roster & Live Classes
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No batches active under this course yet.
          </div>
        )}
      </div>
    </div>
  );
}
