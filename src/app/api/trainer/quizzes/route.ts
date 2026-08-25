import { NextRequest, NextResponse } from "next/server";
import { QuizCreateSchema } from "@/validations/quiz.schema";
import { QuizService } from "@/services/quiz.service";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = QuizCreateSchema.parse(body);

    const quiz = await QuizService.createQuiz(session.userId, validated, session.role === "ADMIN");
    return NextResponse.json({ success: true, data: quiz }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
