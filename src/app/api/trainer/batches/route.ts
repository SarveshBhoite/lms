import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";

    const batches = await prisma.batch.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId: session.userId } },
              { trainers: { some: { trainerId: session.userId } } },
            ],
          },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        trainers: { include: { trainer: { select: { id: true, name: true, email: true } } } },
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
        liveClasses: { select: { id: true, title: true, scheduledDate: true, status: true } },
        _count: { select: { students: true, trainers: true, liveClasses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveTrainer();
    const isAdmin = session.role === "ADMIN";
    const body = await req.json();

    const { name, courseId, startDate, endDate, status = "UPCOMING", studentIds = [] } = body;

    if (!name || !courseId || !startDate || !endDate) {
      throw new Error("Missing required batch fields (name, courseId, startDate, endDate)");
    }

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You are not assigned to teach this course", 403);
    }

    // Create batch and automatically link creator to BatchTrainer
    const batch = await prisma.batch.create({
      data: {
        name,
        courseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        trainers: {
          create: {
            trainerId: session.userId,
          },
        },
      },
    });

    // Assign students if provided
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      // Validate students are enrolled in this course
      const validEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId,
          userId: { in: studentIds },
          status: "ACTIVE",
        },
        select: { userId: true, id: true },
      });

      const validUserIds = validEnrollments.map((e) => e.userId);

      if (validUserIds.length > 0) {
        await prisma.batchStudent.createMany({
          data: validUserIds.map((userId) => ({
            batchId: batch.id,
            userId,
          })),
          skipDuplicates: true,
        });

        // Update enrollment batchId
        await prisma.enrollment.updateMany({
          where: {
            courseId,
            userId: { in: validUserIds },
          },
          data: { batchId: batch.id },
        });
      }
    }

    const updatedBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: { select: { id: true, title: true } },
        trainers: { include: { trainer: { select: { id: true, name: true } } } },
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: updatedBatch });
  } catch (error) {
    return handleApiError(error);
  }
}
