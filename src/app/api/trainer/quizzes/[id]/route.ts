import { NextRequest, NextResponse } from "next/server";
import { QuizService } from "@/services/quiz.service";
import { QuizUpdateSchema } from "@/validations/quiz.schema";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    const quiz = await QuizService.getQuizById(
      session.userId,
      id,
      session.role === "ADMIN"
    );

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: quiz });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();

    const validated = QuizUpdateSchema.parse(body);

    const updated = await QuizService.updateQuiz(
      session.userId,
      id,
      validated,
      session.role === "ADMIN"
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    await QuizService.deleteQuiz(
      session.userId,
      id,
      session.role === "ADMIN"
    );

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
