import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { requireAuth, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { lessonId, playbackPositionSeconds } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ success: false, error: "Lesson ID is required" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: { include: { lessons: true } },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    const course = lesson.module.course;
    const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const totalLessons = allLessonIds.length;

    // 1. Upsert LessonProgress
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.userId,
          lessonId,
        },
      },
      create: {
        userId: session.userId,
        lessonId,
        isCompleted: true,
        completionPercent: 100.0,
        playbackPositionSeconds: playbackPositionSeconds || 0,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        completionPercent: 100.0,
        playbackPositionSeconds: playbackPositionSeconds || 0,
        completedAt: new Date(),
      },
    });

    // 2. Count completed lessons for this course
    const completedRecords = await prisma.lessonProgress.findMany({
      where: {
        userId: session.userId,
        lessonId: { in: allLessonIds },
        isCompleted: true,
      },
    });

    const completedCount = completedRecords.length;
    const progressPercent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;
    const isCompleted = progressPercent === 100;

    // 3. Upsert CourseProgress
    const courseProgress = await prisma.courseProgress.upsert({
      where: {
        userId_courseId: {
          userId: session.userId,
          courseId: course.id,
        },
      },
      create: {
        userId: session.userId,
        courseId: course.id,
        completedLessonsCount: completedCount,
        totalLessonsCount: totalLessons,
        progressPercent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        completedLessonsCount: completedCount,
        totalLessonsCount: totalLessons,
        progressPercent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // 4. If course completed, generate Certificate if not already present
    let certificate = null;
    if (isCompleted) {
      const existingCert = await prisma.certificate.findUnique({
        where: {
          userId_courseId: {
            userId: session.userId,
            courseId: course.id,
          },
        },
      });

      if (!existingCert) {
        const certNumber = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        certificate = await prisma.certificate.create({
          data: {
            certificateNumber: certNumber,
            userId: session.userId,
            courseId: course.id,
            metadata: {
              courseTitle: course.title,
              grade: "Distinction (98%)",
              verifiedDate: new Date().toISOString(),
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      progress: {
        completedCount,
        totalLessons,
        progressPercent,
        isCompleted,
        certificateEarned: Boolean(certificate),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
