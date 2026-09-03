import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { LessonCreateSchema, LessonReorderSchema } from "@/validations/course.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const { quiz: attachedQuiz, assignment: attachedAssignment, ...lessonData } = body;
    const validated = LessonCreateSchema.parse(lessonData);

    const moduleObj = await prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });

    if (!moduleObj) {
      return NextResponse.json(
        { success: false, error: "Module not found in this course" },
        { status: 404 }
      );
    }

    let orderIndex = validated.orderIndex;
    if (orderIndex === 0) {
      const highestLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      orderIndex = (highestLesson?.orderIndex ?? -1) + 1;
    }

    const newLesson = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          moduleId,
          title: validated.title,
          description: validated.description || null,
          contentType: validated.contentType,
          contentUrl: validated.contentUrl || null,
          textContent: validated.textContent || null,
          durationMinutes: validated.durationMinutes,
          orderIndex,
          isFreePreview: validated.isFreePreview,
          isFinalLesson: Boolean(validated.isFinalLesson),
        },
      });

      // 1. If an attached quiz was provided
      if (attachedQuiz && attachedQuiz.title && Array.isArray(attachedQuiz.questions) && attachedQuiz.questions.length > 0) {
        await tx.quiz.create({
          data: {
            courseId,
            lessonId: lesson.id,
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

      // 2. If an attached assignment was provided
      if (attachedAssignment && attachedAssignment.title) {
        await tx.assignment.create({
          data: {
            courseId,
            lessonId: lesson.id,
            title: attachedAssignment.title,
            description: attachedAssignment.description || `Assignment task for lesson: ${lesson.title}`,
            instructions: attachedAssignment.instructions || null,
            totalMarks: Number(attachedAssignment.totalMarks || 100),
            deadline: attachedAssignment.deadline ? new Date(attachedAssignment.deadline) : null,
            allowedFileTypes: Array.isArray(attachedAssignment.allowedFileTypes)
              ? attachedAssignment.allowedFileTypes
              : ["pdf", "zip", "docx", "pptx", "link"],
          },
        });
      }

      return tx.lesson.findUnique({
        where: { id: lesson.id },
        include: {
          resources: true,
          quiz: { include: { questions: { include: { options: true } } } },
          assignment: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: newLesson }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { moduleId } = await params;
    const body = await req.json();
    const { lessonOrders } = LessonReorderSchema.parse(body);

    await prisma.$transaction(
      lessonOrders.map((l) =>
        prisma.lesson.update({
          where: { id: l.id, moduleId },
          data: { orderIndex: l.orderIndex },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
