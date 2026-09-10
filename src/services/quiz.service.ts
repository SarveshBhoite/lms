import prisma from "@/lib/prisma";
import { QuizCreateInput, QuizUpdateInput } from "@/validations/quiz.schema";
import { verifyTrainerCourseAccess } from "@/lib/rbac";

export class QuizService {
  static async getTrainerQuizzes(trainerId: string, isAdmin = false) {
    return prisma.quiz.findMany({
      where: {
        lessonId: null, // standalone quizzes
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
        course: { select: { id: true, title: true } },
        questions: {
          include: { options: true },
        },
        quizAttempts: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getQuizById(trainerId: string, quizId: string, isAdmin = false) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
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
            user: { select: { id: true, name: true, email: true, profile: true } },
            answers: {
              include: {
                question: { select: { id: true, question: true, marks: true, type: true } },
              },
            },
          },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!quiz) return null;

    const hasAccess = await verifyTrainerCourseAccess(trainerId, quiz.courseId, isAdmin);
    if (!hasAccess) {
      throw new Error("Forbidden: You do not have access to this quiz's course");
    }

    return quiz;
  }

  static async createQuiz(trainerId: string, data: QuizCreateInput, isAdmin = false) {
    const hasAccess = await verifyTrainerCourseAccess(trainerId, data.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You are not assigned to teach this course");

    return prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          courseId: data.courseId,
          batchIds: data.batchIds || [],
          title: data.title,
          description: data.description,
          timeLimitMinutes: data.timeLimitMinutes,
          passingMarks: data.passingMarks,
          maxAttempts: data.maxAttempts,
          status: data.status,
          questions: {
            create: data.questions.map((q, idx) => ({
              question: q.question,
              type: q.type,
              difficulty: q.difficulty,
              marks: q.marks,
              explanation: q.explanation,
              correctAnswerText: q.correctAnswerText,
              orderIndex: idx + 1,
              options: {
                create: (q.options || []).map((opt, optIdx) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  orderIndex: optIdx + 1,
                })),
              },
            })),
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "QUIZ_CREATED",
          resource: `Quiz:${quiz.id}`,
          details: { title: quiz.title, courseId: quiz.courseId, batchIds: quiz.batchIds },
        },
      });

      return quiz;
    });
  }

  static async updateQuiz(trainerId: string, quizId: string, data: QuizUpdateInput, isAdmin = false) {
    const existing = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { courseId: true, title: true },
    });

    if (!existing) throw new Error("Quiz not found");

    const hasAccess = await verifyTrainerCourseAccess(trainerId, existing.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You do not have access to this quiz's course");

    return prisma.$transaction(async (tx) => {
      // If questions are provided, we replace/update questions atomically
      if (data.questions !== undefined) {
        // Delete previous questions (cascade will remove options & answers if any, but lets be clean)
        await tx.questionOption.deleteMany({
          where: { question: { quizId } },
        });
        await tx.question.deleteMany({
          where: { quizId },
        });

        // Re-create questions
        for (let idx = 0; idx < data.questions.length; idx++) {
          const q = data.questions[idx];
          await tx.question.create({
            data: {
              quizId,
              question: q.question,
              type: q.type,
              difficulty: q.difficulty,
              marks: q.marks,
              explanation: q.explanation,
              correctAnswerText: q.correctAnswerText,
              orderIndex: idx + 1,
              options: {
                create: (q.options || []).map((opt, optIdx) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  orderIndex: optIdx + 1,
                })),
              },
            },
          });
        }
      }

      // Update quiz metadata
      const updatedQuiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.timeLimitMinutes !== undefined ? { timeLimitMinutes: data.timeLimitMinutes } : {}),
          ...(data.passingMarks !== undefined ? { passingMarks: data.passingMarks } : {}),
          ...(data.maxAttempts !== undefined ? { maxAttempts: data.maxAttempts } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.batchIds !== undefined ? { batchIds: data.batchIds } : {}),
        },
        include: {
          questions: {
            include: { options: { orderBy: { orderIndex: "asc" } } },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "QUIZ_UPDATED",
          resource: `Quiz:${quizId}`,
          details: { title: updatedQuiz.title, batchIds: updatedQuiz.batchIds },
        },
      });

      return updatedQuiz;
    });
  }

  static async deleteQuiz(trainerId: string, quizId: string, isAdmin = false) {
    const existing = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { courseId: true, title: true },
    });

    if (!existing) throw new Error("Quiz not found");

    const hasAccess = await verifyTrainerCourseAccess(trainerId, existing.courseId, isAdmin);
    if (!hasAccess) throw new Error("Forbidden: You do not have access to this quiz's course");

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.quiz.delete({
        where: { id: quizId },
      });

      await tx.activityLog.create({
        data: {
          userId: trainerId,
          action: "QUIZ_DELETED",
          resource: `Quiz:${quizId}`,
          details: { title: existing.title },
        },
      });

      return deleted;
    });
  }
}
