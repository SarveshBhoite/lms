import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookOpen, ArrowRight, Layers, FileCode2, Users, ShieldAlert, Clock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerCoursesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { trainerId },
            { batches: { some: { trainers: { some: { trainerId } } } } },
          ],
        },
    include: {
      modules: { include: { lessons: true } },
      enrollments: true,
      batches: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Assigned Courses</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage course curriculum, modules, lessons, learning resources, and view enrolled students.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Core Creation Admin-Controlled
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between overflow-hidden hover:shadow-md transition">
                <div>
                  {/* Thumbnail */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-emerald-700 border border-emerald-200 shadow-xs">
                        {course.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="font-bold text-slate-700">{course.level}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-600" /> {course.durationHours} Hours</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono border-t border-b border-slate-100 py-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{course.modules.length}</div>
                      <div className="text-[10px] text-slate-500">Modules</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{totalLessons}</div>
                      <div className="text-[10px] text-slate-500">Lessons</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-600">{course.enrollments.length}</div>
                      <div className="text-[10px] text-slate-500">Students</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyan-600">{course.batches.length}</div>
                      <div className="text-[10px] text-slate-500">Batches</div>
                    </div>
                  </div>

                  <Link
                    href={`/trainer/courses/${course.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    Open Course Studio <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No courses currently assigned to your faculty profile.</p>
        </div>
      )}
    </div>
  );
}
