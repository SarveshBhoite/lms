import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { BatchCreateSchema } from "@/validations/batch.schema";

export async function GET(req: NextRequest) {
  try {
    await requireTrainerOrAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL";
    const courseId = searchParams.get("courseId") || "";

    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (query.trim()) {
      whereClause.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { course: { title: { contains: query.trim(), mode: "insensitive" } } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where: whereClause,
      include: {
        course: {
          select: { id: true, title: true, level: true, thumbnailUrl: true },
        },
        trainers: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true, designation: true } },
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        liveClasses: {
          select: { id: true, title: true, scheduledDate: true, status: true },
        },
        _count: {
          select: {
            students: true,
            trainers: true,
            liveClasses: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const formatted = batches.map((b) => ({
      ...b,
      totalStudents: b._count.students,
      totalTrainers: b._count.trainers,
      totalLiveClasses: b._count.liveClasses,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = BatchCreateSchema.parse(body);

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: validated.courseId } });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Selected course does not exist" },
        { status: 400 }
      );
    }

    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    // Create Batch
    const newBatch = await prisma.batch.create({
      data: {
        name: validated.name,
        courseId: validated.courseId,
        startDate,
        endDate,
        status: validated.status,
        trainers: {
          create: validated.trainerIds.map((trainerId) => ({
            trainerId,
          })),
        },
        students: {
          create: validated.studentIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        course: { select: { id: true, title: true } },
        trainers: { include: { trainer: { select: { id: true, name: true } } } },
        students: true,
      },
    });

    // Also automatically enroll assigned students in the course if not already enrolled
    if (validated.studentIds.length > 0) {
      await Promise.all(
        validated.studentIds.map(async (userId) => {
          await prisma.enrollment.upsert({
            where: {
              userId_courseId: { userId, courseId: validated.courseId },
            },
            create: {
              userId,
              courseId: validated.courseId,
              batchId: newBatch.id,
              status: "ACTIVE",
            },
            update: {
              batchId: newBatch.id,
            },
          });
        })
      );
    }

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "BATCH_CREATED",
        resource: `Batch:${newBatch.id}`,
        details: {
          name: newBatch.name,
          courseId: newBatch.courseId,
          assignedTrainersCount: validated.trainerIds.length,
          assignedStudentsCount: validated.studentIds.length,
        },
      },
    });

    return NextResponse.json({ success: true, data: newBatch }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
