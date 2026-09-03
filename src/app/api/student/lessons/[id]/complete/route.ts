import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: lessonId } = await params;
    const studentId = session.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: { select: { courseId: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            passingMarks: true,
            quizAttempts: {
              where: { userId: studentId, isPassed: true },
              take: 1,
            },
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            submissions: {
              where: { userId: studentId },
              take: 1,
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    // Check quiz criteria: must have passed attempt if quiz attached
    if (lesson.quiz && lesson.quiz.quizAttempts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Please pass the required quiz "${lesson.quiz.title}" (Passing score: ${lesson.quiz.passingMarks}%) before completing this lesson.`,
        },
        { status: 400 }
      );
    }

    // Check assignment criteria: must have submitted project if assignment attached
    if (lesson.assignment && lesson.assignment.submissions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Please submit the required assignment "${lesson.assignment.title}" before completing this lesson.`,
        },
        { status: 400 }
      );
    }

    const courseId = lesson.module.courseId;

    // 1. Upsert LessonProgress
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: studentId, lessonId },
      },
      update: {
        isCompleted: true,
        completionPercent: 100,
        lastWatchedAt: new Date(),
        completedAt: new Date(),
      },
      create: {
        userId: studentId,
        lessonId,
        isCompleted: true,
        completionPercent: 100,
        lastWatchedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // 2. Count total lessons in course
    const totalLessons = await prisma.lesson.count({
      where: {
        module: { courseId },
      },
    });

    // 3. Count student's completed lessons in course
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: studentId,
        isCompleted: true,
        lesson: { module: { courseId } },
      },
    });

    const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isCompleted = completedLessons >= totalLessons && totalLessons > 0;

    // 4. Upsert CourseProgress
    await prisma.courseProgress.upsert({
      where: {
        userId_courseId: { userId: studentId, courseId },
      },
      update: {
        completedLessonsCount: completedLessons,
        totalLessonsCount: totalLessons,
        progressPercent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId: studentId,
        courseId,
        completedLessonsCount: completedLessons,
        totalLessonsCount: totalLessons,
        progressPercent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lessonId,
        completedLessons,
        totalLessons,
        progressPercent: Number(progressPercent.toFixed(1)),
        isCompleted,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to mark lesson complete" }, { status: 500 });
  }
}
