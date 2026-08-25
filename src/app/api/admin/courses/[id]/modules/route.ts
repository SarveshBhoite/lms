import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTrainerOrAdmin, handleApiError } from "@/lib/rbac";
import { ModuleCreateSchema, ModuleReorderSchema } from "@/validations/course.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId } = await params;
    const body = await req.json();
    const validated = ModuleCreateSchema.parse(body);

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    let orderIndex = validated.orderIndex;
    if (orderIndex === 0) {
      const highestModule = await prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });
      orderIndex = (highestModule?.orderIndex ?? -1) + 1;
    }

    const newModule = await prisma.courseModule.create({
      data: {
        courseId,
        title: validated.title,
        description: validated.description || null,
        orderIndex,
      },
      include: {
        lessons: {
          include: { resources: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: newModule }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireTrainerOrAdmin();
    const { id: courseId } = await params;
    const body = await req.json();
    const { moduleOrders } = ModuleReorderSchema.parse(body);

    await prisma.$transaction(
      moduleOrders.map((m) =>
        prisma.courseModule.update({
          where: { id: m.id, courseId },
          data: { orderIndex: m.orderIndex },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Modules reordered successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
