import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentQuizPlayerClient from "./StudentQuizPlayerClient";

export default async function StudentQuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id: quizId } = await params;
  const studentId = session.userId;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, status: "PUBLISHED" },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            select: { id: true, text: true, orderIndex: true },
          },
        },
      },
      quizAttempts: {
        where: { userId: studentId },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  return <StudentQuizPlayerClient initialQuiz={quiz as any} currentUserId={session.userId} />;
}
