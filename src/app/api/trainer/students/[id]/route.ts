import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";
    const trainerId = session.userId;

    // Check scope access: student must be in trainer's assigned courses or batches
    if (!isAdmin) {
      const scopeCheck = await prisma.user.findFirst({
        where: {
          id,
          role: "STUDENT",
          OR: [
            {
              enrollments: {
                some: {
                  course: {
                    OR: [
                      { trainerId },
                      { batches: { some: { trainers: { some: { trainerId } } } } },
                    ],
                  },
                },
              },
            },
            {
              studentBatches: {
                some: {
                  batch: {
                    OR: [
                      { course: { trainerId } },
                      { trainers: { some: { trainerId } } },
                    ],
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!scopeCheck) {
        throw new AuthError("Forbidden: Student is not in your assigned teaching scope", 403);
      }
    }

    const student = await prisma.user.findUnique({
      where: { id, role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true, level: true, durationHours: true } },
            batch: { select: { id: true, name: true, startDate: true, endDate: true } },
          },
        },
        courseProgresses: {
          include: { course: { select: { id: true, title: true } } },
        },
        lessonProgresses: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                contentType: true,
                module: { select: { title: true } },
              },
            },
          },
          orderBy: { lastWatchedAt: "desc" },
        },
        quizAttempts: {
          include: {
            quiz: { select: { id: true, title: true, passingMarks: true, timeLimitMinutes: true } },
          },
          orderBy: { startedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: { select: { id: true, title: true, totalMarks: true, deadline: true } },
            feedback: { include: { trainer: { select: { name: true } } } },
          },
          orderBy: { submittedAt: "desc" },
        },
        attendances: {
          include: {
            liveClass: {
              select: {
                id: true,
                title: true,
                scheduledDate: true,
                batch: { select: { name: true } },
              },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
        certificates: {
          include: { course: { select: { title: true } } },
        },
        studentNotes: {
          include: {
            trainer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    return handleApiError(error);
  }
}
