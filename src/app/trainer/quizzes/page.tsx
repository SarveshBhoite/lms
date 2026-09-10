import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerQuizzesClient, { SerializedQuizItem } from "./TrainerQuizzesClient";

export default async function TrainerQuizzesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  // Fetch courses assigned to trainer for filter selection
  const courses = await prisma.course.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { trainerId },
            { batches: { some: { trainers: { some: { trainerId } } } } },
          ],
        },
    select: {
      id: true,
      title: true,
      batches: {
        select: { id: true, name: true },
      },
    },
    orderBy: { title: "asc" },
  });

  // Fetch quizzes
  const quizzes = await prisma.quiz.findMany({
    where: {
      lessonId: null, // ONLY standalone course/batch quizzes
      ...(isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          }),
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          batches: { select: { id: true, name: true } },
        },
      },
      questions: { select: { id: true, marks: true } },
      quizAttempts: {
        select: { id: true, isPassed: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map batch names for each quiz
  const serializedQuizzes: SerializedQuizItem[] = quizzes.map((qz) => {
    const courseBatches = qz.course.batches || [];
    const batchNames = (qz.batchIds || []).map((bId) => {
      const match = courseBatches.find((b) => b.id === bId);
      return match ? match.name : bId;
    });

    const passedAttemptsCount = qz.quizAttempts.filter((a) => a.isPassed).length;

    const totalMarks = qz.questions.reduce((acc, q) => acc + (q.marks || 0), 0);

    return {
      id: qz.id,
      courseId: qz.course.id,
      courseTitle: qz.course.title,
      batchIds: qz.batchIds,
      batchNames,
      title: qz.title,
      description: qz.description,
      timeLimitMinutes: qz.timeLimitMinutes,
      passingMarks: qz.passingMarks,
      maxAttempts: qz.maxAttempts,
      status: qz.status,
      questionsCount: qz.questions.length,
      totalMarks,
      attemptsCount: qz.quizAttempts.length,
      passedAttemptsCount,
      createdAt: qz.createdAt.toISOString(),
    };
  });

  const filterCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <TrainerQuizzesClient
        initialQuizzes={serializedQuizzes}
        courses={filterCourses}
      />
    </div>
  );
}
