import { NextRequest, NextResponse } from "next/server";
import { CourseCreateSchema } from "@/validations/course.schema";
import { CourseService } from "@/services/course.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { CourseStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          trainer: { select: { name: true, email: true } },
          modules: {
            include: {
              lessons: {
                include: { resources: true },
                orderBy: { orderIndex: "asc" },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
          enrollments: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, course });
    }

    const courses = await prisma.course.findMany({
      where: session.role === "ADMIN" ? {} : { trainerId: session.userId },
      include: {
        trainer: { select: { name: true, email: true } },
        modules: {
          include: {
            lessons: {
              include: { resources: true },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        enrollments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const validated = CourseCreateSchema.parse(body);

    const course = await CourseService.createCourse(session.userId, validated);
    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();
    const { courseId, ...updateFields } = body;

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(updateFields.title ? { title: updateFields.title.trim() } : {}),
        ...(updateFields.description ? { description: updateFields.description.trim() } : {}),
        ...(updateFields.durationHours ? { durationHours: Number(updateFields.durationHours) } : {}),
        ...(updateFields.level ? { level: updateFields.level } : {}),
        ...(updateFields.status ? { status: updateFields.status as CourseStatus } : {}),
        ...(updateFields.thumbnailUrl !== undefined ? { thumbnailUrl: updateFields.thumbnailUrl } : {}),
        ...(updateFields.objectives ? { objectives: updateFields.objectives } : {}),
        ...(updateFields.prerequisites ? { prerequisites: updateFields.prerequisites } : {}),
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_UPDATED",
        resource: `Course:${courseId}`,
        details: { updatedFields: Object.keys(updateFields) },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Course ${updated.title} updated successfully.`,
      course: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: `Course deleted successfully.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
