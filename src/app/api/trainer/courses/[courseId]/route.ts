import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { courseId } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You are not assigned to manage this course", 403);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        modules: {
          include: {
            lessons: {
              include: {
                resources: true,
                quiz: {
                  include: {
                    questions: {
                      orderBy: { orderIndex: "asc" },
                      include: { options: { orderBy: { orderIndex: "asc" } } },
                    },
                  },
                },
                assignment: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true, phone: true, designation: true } },
                courseProgresses: {
                  where: { courseId },
                  select: { progressPercent: true, completedLessonsCount: true, isCompleted: true },
                },
              },
            },
            batch: { select: { id: true, name: true } },
          },
        },
        batches: {
          include: {
            students: { select: { userId: true } },
            _count: { select: { students: true } },
          },
        },
        quizzes: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { questions: true, quizAttempts: true } },
            lesson: { select: { id: true, title: true } },
          },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { submissions: true } },
            lesson: { select: { id: true, title: true } },
          },
        },
        liveClasses: {
          orderBy: { scheduledDate: "desc" },
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                _count: { select: { students: true } },
              },
            },
            trainer: { select: { id: true, name: true } },
            attendances: {
              select: {
                id: true,
                status: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Content Statistics
    const totalModules = course.modules.length;
    let totalLessons = 0;
    let totalResources = 0;

    course.modules.forEach((m) => {
      totalLessons += m.lessons.length;
      m.lessons.forEach((l) => {
        totalResources += l.resources.length;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        stats: {
          totalModules,
          totalLessons,
          totalResources,
          totalStudents: course.enrollments.length,
          totalBatches: course.batches.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
