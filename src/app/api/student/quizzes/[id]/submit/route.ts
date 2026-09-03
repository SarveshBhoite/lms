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

    // answers format:
    // {
    //   [questionId]: string | string[] (single option ID, multiple option IDs, or typed string for fill-in-the-blank)
    // }
    const { answers } = body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    let correctCount = 0;
    let earnedMarks = 0;
    let maxMarks = 0;
    const answersToCreate: any[] = [];

    quiz.questions.forEach((q) => {
      maxMarks += q.marks;
      const studentAnswer = answers ? answers[q.id] : null;
      let isCorrect = false;
      let selectedOptionIds: string[] = [];
      let textAnswer: string | null = null;

      if (q.type === "FILL_IN_BLANK") {
        textAnswer = typeof studentAnswer === "string" ? studentAnswer.trim() : "";
        const expected = (q.correctAnswerText || "").trim();
        
        // Case-insensitive, whitespace-trimmed, punctuation-flexible match
        if (textAnswer && expected) {
          const normalize = (str: string) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").trim();
          isCorrect = normalize(textAnswer) === normalize(expected);
        }
      } else if (q.type === "MULTIPLE_ANSWER") {
        // Multiple answers (checkboxes)
        const selectedArr: string[] = Array.isArray(studentAnswer)
          ? studentAnswer
          : typeof studentAnswer === "string" && studentAnswer
          ? [studentAnswer]
          : [];
        selectedOptionIds = selectedArr;

        const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);

        // Student must choose all correct options and no incorrect options
        const allCorrectSelected = correctOptionIds.every((id) => selectedArr.includes(id));
        const noIncorrectSelected = selectedArr.every((id) => correctOptionIds.includes(id));
        isCorrect = allCorrectSelected && noIncorrectSelected && correctOptionIds.length > 0;
      } else {
        // MCQ or TRUE_FALSE (Single option ID)
        const selectedId = typeof studentAnswer === "string" ? studentAnswer : Array.isArray(studentAnswer) ? studentAnswer[0] : null;
        if (selectedId) {
          selectedOptionIds = [selectedId];
          const chosen = q.options.find((o) => o.id === selectedId);
          isCorrect = Boolean(chosen && chosen.isCorrect);
        }
      }

      if (isCorrect) {
        correctCount++;
        earnedMarks += q.marks;
      }

      answersToCreate.push({
        questionId: q.id,
        selectedOptionIds,
        textAnswer,
        isCorrect,
        marksAwarded: isCorrect ? q.marks : 0,
      });
    });

    const totalQuestions = quiz.questions.length;
    // Score percentage based on marks or questions
    const scorePercent = maxMarks > 0 ? (earnedMarks / maxMarks) * 100 : totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const finalScore = Number(scorePercent.toFixed(1));
    const isPassed = finalScore >= quiz.passingMarks;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: studentId,
        startedAt: new Date(Date.now() - 1000 * 60 * 5),
        submittedAt: new Date(),
        score: finalScore,
        totalMarks: maxMarks,
        isPassed,
        answers: {
          create: answersToCreate,
        },
      },
      include: {
        quiz: { select: { title: true, lessonId: true, courseId: true } },
      },
    });

    // If quiz is attached to a lesson and student passed, update lesson progress automatically!
    if (quiz.lessonId && isPassed) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: studentId,
            lessonId: quiz.lessonId,
          },
        },
        create: {
          userId: studentId,
          lessonId: quiz.lessonId,
          isCompleted: true,
          completionPercent: 100,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          completionPercent: 100,
          completedAt: new Date(),
        },
      });
    }

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: `Quiz Result: ${quiz.title}`,
        message: `You scored ${finalScore}% on "${quiz.title}". Status: ${isPassed ? "PASSED" : "FAILED"}.`,
        type: "QUIZ_PUBLISHED",
        actionUrl: `/student/quizzes/${quizId}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: finalScore,
        isPassed,
        correctCount,
        totalQuestions,
        earnedMarks,
        maxMarks,
        lessonId: quiz.lessonId,
      },
    });
  } catch (error: any) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit quiz" }, { status: 500 });
  }
}
