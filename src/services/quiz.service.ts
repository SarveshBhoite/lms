import prisma from "@/lib/prisma";
import { QuizCreateInput } from "@/validations/quiz.schema";

export class QuizService {
  static async getTrainerQuizzes(trainerId: string) {
    return prisma.quiz.findMany({
      where: {
        course: { trainerId },
      },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          include: { options: true },
        },
        quizAttempts: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createQuiz(trainerId: string, data: QuizCreateInput, isAdmin = false) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) throw new Error("Course not found");
    if (!isAdmin && course.trainerId !== trainerId) throw new Error("Forbidden");

    return prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          courseId: data.courseId,
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
              orderIndex: idx + 1,
              options: {
                create: q.options.map((opt, optIdx) => ({
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
          details: { title: quiz.title, courseId: quiz.courseId },
        },
      });

      return quiz;
    });
  }
}
