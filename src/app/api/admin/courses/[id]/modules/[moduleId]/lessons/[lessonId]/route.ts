import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LessonUpdateSchema } from "@/validations/course.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId, lessonId } = await params;
    const body = await req.json();
    const { quiz: attachedQuiz, assignment: attachedAssignment, ...lessonData } = body;
    const validated = LessonUpdateSchema.parse(lessonData);

    const updatedLesson = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({
        where: { id: lessonId, moduleId },
        data: {
          ...(validated.title && { title: validated.title }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.contentType && { contentType: validated.contentType }),
          ...(validated.contentUrl !== undefined && { contentUrl: validated.contentUrl }),
          ...(validated.textContent !== undefined && { textContent: validated.textContent }),
          ...(validated.durationMinutes !== undefined && { durationMinutes: validated.durationMinutes }),
          ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex }),
          ...(validated.isFreePreview !== undefined && { isFreePreview: validated.isFreePreview }),
        },
        include: {
          module: { select: { courseId: true } },
        },
      });

      const courseId = lesson.module.courseId;

      // Update or create attached quiz
      if (attachedQuiz) {
        if (attachedQuiz.title && Array.isArray(attachedQuiz.questions)) {
          const existingQuiz = await tx.quiz.findUnique({ where: { lessonId } });
          if (existingQuiz) {
            await tx.question.deleteMany({ where: { quizId: existingQuiz.id } });
            await tx.quiz.update({
              where: { id: existingQuiz.id },
              data: {
                title: attachedQuiz.title,
                passingMarks: Number(attachedQuiz.passingMarks || 60),
                timeLimitMinutes: Number(attachedQuiz.timeLimitMinutes || 15),
                questions: {
                  create: attachedQuiz.questions.map((q: any, qIdx: number) => ({
                    question: q.question,
                    type: q.type || "MCQ",
                    difficulty: q.difficulty || "MEDIUM",
                    marks: Number(q.marks || 1),
                    explanation: q.explanation || null,
                    correctAnswerText: q.correctAnswerText || null,
                    orderIndex: qIdx,
                    options: {
                      create: (q.options || []).map((opt: any, oIdx: number) => ({
                        text: opt.text,
                        isCorrect: Boolean(opt.isCorrect),
                        orderIndex: oIdx,
                      })),
                    },
                  })),
                },
              },
            });
          } else {
            await tx.quiz.create({
              data: {
                courseId,
                lessonId,
                title: attachedQuiz.title,
                description: attachedQuiz.description || `Quiz for lesson: ${lesson.title}`,
                passingMarks: Number(attachedQuiz.passingMarks || 60),
                timeLimitMinutes: Number(attachedQuiz.timeLimitMinutes || 15),
                status: "PUBLISHED",
                questions: {
                  create: attachedQuiz.questions.map((q: any, qIdx: number) => ({
                    question: q.question,
                    type: q.type || "MCQ",
                    difficulty: q.difficulty || "MEDIUM",
                    marks: Number(q.marks || 1),
                    explanation: q.explanation || null,
                    correctAnswerText: q.correctAnswerText || null,
                    orderIndex: qIdx,
                    options: {
                      create: (q.options || []).map((opt: any, oIdx: number) => ({
                        text: opt.text,
                        isCorrect: Boolean(opt.isCorrect),
                        orderIndex: oIdx,
                      })),
                    },
                  })),
                },
              },
            });
          }
        }
      }

      // Update or create attached assignment
      if (attachedAssignment) {
        if (attachedAssignment.title) {
          const existingAssignment = await tx.assignment.findUnique({ where: { lessonId } });
          if (existingAssignment) {
            await tx.assignment.update({
              where: { id: existingAssignment.id },
              data: {
                title: attachedAssignment.title,
                description: attachedAssignment.description,
                instructions: attachedAssignment.instructions || null,
                totalMarks: Number(attachedAssignment.totalMarks || 100),
                deadline: attachedAssignment.deadline ? new Date(attachedAssignment.deadline) : null,
              },
            });
          } else {
            await tx.assignment.create({
              data: {
                courseId,
                lessonId,
                title: attachedAssignment.title,
                description: attachedAssignment.description || `Assignment task for lesson: ${lesson.title}`,
                instructions: attachedAssignment.instructions || null,
                totalMarks: Number(attachedAssignment.totalMarks || 100),
                deadline: attachedAssignment.deadline ? new Date(attachedAssignment.deadline) : null,
              },
            });
          }
        }
      }

      return tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          resources: true,
          quiz: { include: { questions: { include: { options: true } } } },
          assignment: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: updatedLesson });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId, lessonId } = await params;

    await prisma.lesson.delete({
      where: { id: lessonId, moduleId },
    });

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
