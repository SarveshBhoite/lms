import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookOpen, Play, CheckCircle2, Clock } from "lucide-react";

export default async function StudentCoursesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId, status: "ACTIVE" },
    include: {
      course: {
        include: {
          trainer: { select: { name: true, email: true } },
          modules: {
            select: { id: true, lessons: { select: { id: true } } },
          },
        },
      },
      batch: { select: { id: true, name: true } },
    },
  });

  const courseProgresses = await prisma.courseProgress.findMany({
    where: { userId: studentId },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Enrolled Courses</h1>
          <p className="text-slate-600 text-sm mt-1">
            Access curriculum modules, video lessons, resources, quizzes, and assignments for your active cohorts.
          </p>
        </div>
      </div>

      {enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((en) => {
            const cp = courseProgresses.find((p) => p.courseId === en.courseId);
            const progPct = cp ? cp.progressPercent : 0;
            const completedCount = cp ? cp.completedLessonsCount : 0;
            const totalLessons = en.course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0);

            return (
              <div
                key={en.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                    {en.batch?.name || "Enrolled Cohort"}
                  </span>

                  <h3 className="font-extrabold text-slate-900 text-lg">{en.course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{en.course.description}</p>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <strong className="text-[#7C248C]">{en.course.trainer.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <strong className="text-slate-900">{completedCount} / {totalLessons} Lessons</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-600">
                      <span>Progress:</span>
                      <strong className="text-slate-900">{progPct.toFixed(1)}%</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="jvm-gradient-bg h-2 rounded-full" style={{ width: `${Math.min(progPct, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/student/courses/${en.courseId}`}
                  className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-white" /> Open Course Studio
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">You have no active course enrollments right now.</p>
        </div>
      )}
    </div>
  );
}
