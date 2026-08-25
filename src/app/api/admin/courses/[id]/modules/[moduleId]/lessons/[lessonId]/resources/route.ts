import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { ResourceCreateSchema } from "@/validations/course.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireAdmin();
    const { lessonId } = await params;
    const body = await req.json();
    const validated = ResourceCreateSchema.parse(body);

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    const newResource = await prisma.resource.create({
      data: {
        lessonId,
        title: validated.title,
        fileType: validated.fileType,
        fileSize: validated.fileSize,
        fileUrl: validated.fileUrl,
        storageKey: validated.storageKey || null,
        isPublic: validated.isPublic,
      },
    });

    return NextResponse.json({ success: true, data: newResource }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "Resource ID is required" },
        { status: 400 }
      );
    }

    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
