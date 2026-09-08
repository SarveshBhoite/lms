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
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#1E2B88]" /> My Enrolled Programs
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Access curriculum modules, video lessons, resources, quizzes, and assignments for your active cohorts.
          </p>
        </div>
      </div>

      <StudentCoursesClient initialEnrollments={serialized} />
    </div>
  );
}

