import { NextRequest, NextResponse } from "next/server";
import { ModuleCreateSchema, LessonCreateSchema } from "@/validations/course.schema";
import { CourseService } from "@/services/course.service";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const body = await req.json();

    if (body.type === "MODULE") {
      const validated = ModuleCreateSchema.parse(body);
      const mod = await CourseService.createModule(session.userId, validated);
      return NextResponse.json({ success: true, module: mod }, { status: 201 });
    } else if (body.type === "LESSON") {
      const validated = LessonCreateSchema.parse(body);
      const lesson = await CourseService.createLesson(session.userId, validated);
      return NextResponse.json({ success: true, lesson }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "Invalid curriculum item type" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTrainerOrAdmin();
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ success: false, error: "Missing type or id parameter" }, { status: 400 });
    }

    if (type === "MODULE") {
      await prisma.courseModule.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Module deleted successfully" });
    } else if (type === "LESSON") {
      await prisma.lesson.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid entity type" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
