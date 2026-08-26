import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { quizId, answers, timeTakenSec } = await req.json();

    if (!quizId) {
      return NextResponse.json({ success: false, error: "Quiz ID is required" }, { status: 400 });
    }

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

    let earnedScore = 0;
    const totalMarks = quiz.questions.reduce((acc, q) => acc + q.marks, 0);
    const answersToCreate: Array<{
      questionId: string;
      selectedOptionIds: string[];
      isCorrect: boolean;
      marksAwarded: number;
    }> = [];

    quiz.questions.forEach((q) => {
      const selectedOptionId = answers?.[q.id];
      const correctOption = q.options.find((o) => o.isCorrect);

      const isCorrect = Boolean(selectedOptionId && correctOption && selectedOptionId === correctOption.id);
      const marksAwarded = isCorrect ? q.marks : 0;

      if (isCorrect) {
        earnedScore += q.marks;
      }

      answersToCreate.push({
        questionId: q.id,
        selectedOptionIds: selectedOptionId ? [selectedOptionId] : [],
        isCorrect,
        marksAwarded,
      });
    });

    const percent = totalMarks > 0 ? (earnedScore / totalMarks) * 100 : 0;
    const isPassed = percent >= quiz.passingMarks;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: session.userId,
        score: earnedScore,
        totalMarks,
        isPassed,
        timeTakenSec: timeTakenSec || 0,
        submittedAt: new Date(),
        answers: {
          create: answersToCreate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        attemptId: attempt.id,
        score: earnedScore,
        totalMarks,
        percentage: Math.round(percent),
        isPassed,
        passingMarks: quiz.passingMarks,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
