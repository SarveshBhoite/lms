import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'isActive' boolean property." },
        { status: 400 }
      );
    }

    const student = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: body.isActive ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
        resource: `User:${id}`,
        details: { studentEmail: student.email, isActive: body.isActive },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student account ${body.isActive ? "activated" : "deactivated"} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
