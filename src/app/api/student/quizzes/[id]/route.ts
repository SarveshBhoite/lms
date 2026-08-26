import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Quiz not found or not published" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: quiz });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch quiz detail" }, { status: 500 });
  }
}
