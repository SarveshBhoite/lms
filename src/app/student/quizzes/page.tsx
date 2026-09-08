import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HelpCircle } from "lucide-react";
import StudentQuizzesClient from "./StudentQuizzesClient";

export default async function StudentQuizzesPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const [batchStudents, userEnrollments] = await Promise.all([
    prisma.batchStudent.findMany({
      where: { userId: studentId },
      select: { batchId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
      select: { batchId: true, courseId: true },
    }),
  ]);

  const enrolledCourseIds = userEnrollments.map((e) => e.courseId);
  const enrolledBatchIds = Array.from(
    new Set([
      ...batchStudents.map((b) => b.batchId),
      ...userEnrollments.map((e) => e.batchId).filter(Boolean) as string[],
    ])
  );

  const quizzes = await prisma.quiz.findMany({
    where: {
      courseId: { in: enrolledCourseIds },
      lessonId: null, // ONLY standalone quizzes
      status: "PUBLISHED",
      OR: [
        { batchIds: { isEmpty: true } },
        { batchIds: { hasSome: enrolledBatchIds } },
      ],
    },
    include: {
      course: { select: { id: true, title: true } },
      questions: { select: { id: true } },
      quizAttempts: {
        where: { userId: studentId },
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = quizzes.map((qz) => {
    const latestAttempt = qz.quizAttempts[0];
    return {
      id: qz.id,
      title: qz.title,
      description: qz.description,
      timeLimitMinutes: qz.timeLimitMinutes,
      passingMarks: qz.passingMarks,
      course: qz.course,
      questionCount: qz.questions.length,
      latestAttempt: latestAttempt
        ? {
            score: latestAttempt.score,
            isPassed: latestAttempt.isPassed,
            startedAt: latestAttempt.startedAt.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-[#7C248C]" /> Course Assessments & Quizzes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Test your knowledge with timed quizzes, view automatic scores, and inspect attempt history.
          </p>
        </div>
      </div>

      <StudentQuizzesClient initialQuizzes={serialized} />
    </div>
  );
}

