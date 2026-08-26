import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await params;
    const studentId = session.userId;
    const body = await req.json();

    const { answers } = body; // Record<questionId, optionId>

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    let correctCount = 0;
    const answersToCreate: any[] = [];

    quiz.questions.forEach((q) => {
      const selectedOptionId = answers ? answers[q.id] : null;
      const correctOption = q.options.find((o) => o.isCorrect);

      const isCorrect = Boolean(selectedOptionId && correctOption && selectedOptionId === correctOption.id);
      if (isCorrect) correctCount++;

      if (selectedOptionId) {
        answersToCreate.push({
          questionId: q.id,
          selectedOptionIds: [selectedOptionId],
          isCorrect,
          marksAwarded: isCorrect ? q.marks : 0,
        });
      }
    });

    const totalQuestions = quiz.questions.length;
    const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const isPassed = scorePercent >= quiz.passingMarks;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: studentId,
        startedAt: new Date(Date.now() - 1000 * 60 * 5),
        submittedAt: new Date(),
        score: Number(scorePercent.toFixed(1)),
        isPassed,
        answers: {
          create: answersToCreate,
        },
      },
      include: {
        quiz: { select: { title: true } },
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: `Quiz Result: ${quiz.title}`,
        message: `You scored ${scorePercent.toFixed(1)}% on "${quiz.title}". Status: ${isPassed ? "PASSED" : "FAILED"}.`,
        type: "QUIZ_PUBLISHED",
        actionUrl: `/student/quizzes/${quizId}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: Number(scorePercent.toFixed(1)),
        isPassed,
        correctCount,
        totalQuestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to submit quiz" }, { status: 500 });
  }
}
