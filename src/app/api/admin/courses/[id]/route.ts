import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { CourseUpdateSchema } from "@/validations/course.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                resources: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                profile: { select: { phone: true, avatarUrl: true } },
              },
            },
            batch: { select: { id: true, name: true } },
          },
        },
        batches: {
          orderBy: { startDate: "desc" },
          include: {
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            batches: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();
    const validatedData = CourseUpdateSchema.parse(body);

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (validatedData.trainerId) {
      const trainerUser = await prisma.user.findUnique({
        where: { id: validatedData.trainerId },
      });
      if (!trainerUser || (trainerUser.role !== "TRAINER" && trainerUser.role !== "ADMIN")) {
        return NextResponse.json(
          { success: false, error: "Invalid trainer selected." },
          { status: 400 }
        );
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.thumbnailUrl !== undefined && { thumbnailUrl: validatedData.thumbnailUrl }),
        ...(validatedData.objectives && { objectives: validatedData.objectives }),
        ...(validatedData.durationHours !== undefined && { durationHours: validatedData.durationHours }),
        ...(validatedData.level && { level: validatedData.level }),
        ...(validatedData.prerequisites && { prerequisites: validatedData.prerequisites }),
        ...(validatedData.trainerId && { trainerId: validatedData.trainerId }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_UPDATED",
        resource: `Course:${updatedCourse.id}`,
        details: { title: updatedCourse.title, status: updatedCourse.status },
      },
    });

    return NextResponse.json({ success: true, data: updatedCourse });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    await prisma.course.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_DELETED",
        resource: `Course:${id}`,
        details: { title: course.title },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Course "${course.title}" deleted successfully`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
