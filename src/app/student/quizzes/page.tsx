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
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3 h-3 text-[#7C248C]" /> Academic Evaluations
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Course Assessments & <span className="jvm-gradient-text">Quizzes</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Timed knowledge evaluations, real-time auto scoring, question explanations, and attempt records.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {serialized.length} {serialized.length === 1 ? "Assessment" : "Assessments"}
          </span>
        </div>
      </div>

      <StudentQuizzesClient initialQuizzes={serialized} />
    </div>
  );
}

