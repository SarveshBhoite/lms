import { NextRequest, NextResponse } from "next/server";
import { QuizCreateSchema } from "@/validations/quiz.schema";
import { QuizService } from "@/services/quiz.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireTrainerOrAdmin();

    const quizzes = await prisma.quiz.findMany({
      include: {
        course: { select: { id: true, title: true } },
        questions: { include: { options: true } },
        quizAttempts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = QuizCreateSchema.parse(body);

    const quiz = await QuizService.createQuiz(session.userId, validated);
    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const quizId = searchParams.get("quizId") || searchParams.get("id");

    if (!quizId) {
      return NextResponse.json({ success: false, error: "Quiz ID is required" }, { status: 400 });
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
