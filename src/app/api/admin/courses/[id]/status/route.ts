import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { CourseStatusUpdateSchema } from "@/validations/course.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTrainerOrAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status } = CourseStatusUpdateSchema.parse(body);

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status },
      select: { id: true, title: true, status: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "COURSE_STATUS_CHANGED",
        resource: `Course:${id}`,
        details: { title: updatedCourse.title, newStatus: status },
      },
    });

    return NextResponse.json({ success: true, data: updatedCourse });
  } catch (error) {
    return handleApiError(error);
  }
}
