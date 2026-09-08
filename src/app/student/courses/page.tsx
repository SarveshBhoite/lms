import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import StudentCoursesClient from "./StudentCoursesClient";

export default async function StudentCoursesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const [enrollments, courseProgresses] = await Promise.all([
    prisma.enrollment.findMany({
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
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.courseProgress.findMany({
      where: { userId: studentId },
    }),
  ]);

  const serialized = enrollments.map((en) => {
    const cp = courseProgresses.find((p) => p.courseId === en.courseId);
    const progPct = cp ? cp.progressPercent : 0;
    const completedCount = cp ? cp.completedLessonsCount : 0;
    const totalLessons = en.course.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);

    return {
      id: en.id,
      courseId: en.courseId,
      enrolledAt: en.enrolledAt.toISOString(),
      batch: en.batch,
      course: {
        id: en.course.id,
        title: en.course.title,
        description: en.course.description,
        level: en.course.level,
        durationHours: en.course.durationHours,
        trainer: en.course.trainer,
        totalLessons,
      },
      progressPercent: progPct,
      completedLessonsCount: completedCount,
    };
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex items-center justify-between">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-3 h-3 text-[#7C248C]" /> Academic Programs
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Enrolled <span className="jvm-gradient-text">Courses</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Access curriculum modules, video lessons, resources, quizzes, and live classes for your cohorts.
          </p>
        </div>
      </div>

      <StudentCoursesClient initialEnrollments={serialized} />
    </div>
  );
}

