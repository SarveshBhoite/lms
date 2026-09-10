import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import TrainerQuizDetailClient from "./TrainerQuizDetailClient";

export default async function TrainerQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          batches: {
            select: { id: true, name: true, status: true },
          },
        },
      },
      questions: {
        include: {
          options: {
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
      quizAttempts: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true, phone: true } },
            },
          },
          answers: {
            include: {
              question: {
                select: { id: true, question: true, marks: true, type: true },
              },
            },
          },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  const hasAccess = await verifyTrainerCourseAccess(
    session.userId,
    quiz.courseId,
    isAdmin
  );
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  // Serialize dates for Client Component
  const serializedQuiz = {
    id: quiz.id,
    courseId: quiz.courseId,
    batchIds: quiz.batchIds || [],
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    passingMarks: quiz.passingMarks,
    maxAttempts: quiz.maxAttempts,
    status: quiz.status,
    course: quiz.course,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type as any,
      difficulty: q.difficulty as any,
      marks: q.marks,
      explanation: q.explanation,
      correctAnswerText: q.correctAnswerText,
      orderIndex: q.orderIndex,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        orderIndex: opt.orderIndex,
      })),
    })),
    quizAttempts: quiz.quizAttempts.map((qa) => ({
      id: qa.id,
      score: qa.score,
      totalMarks: qa.totalMarks,
      isPassed: qa.isPassed,
      startedAt: qa.startedAt.toISOString(),
      submittedAt: qa.submittedAt ? qa.submittedAt.toISOString() : null,
      timeTakenSec: qa.timeTakenSec,
      user: {
        id: qa.user.id,
        name: qa.user.name,
        email: qa.user.email,
        profile: qa.user.profile,
      },
      answers: qa.answers.map((ans) => ({
        id: ans.id,
        questionId: ans.questionId,
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer,
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        question: ans.question,
      })),
    })),
  };

  return <TrainerQuizDetailClient initialQuiz={serializedQuiz as any} />;
}
