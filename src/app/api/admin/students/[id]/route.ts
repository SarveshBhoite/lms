import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { UpdateStudentSchema } from "@/validations/student.schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const student = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: true,
            batch: true,
          },
          orderBy: { enrolledAt: "desc" },
        },
        studentBatches: {
          include: {
            batch: {
              include: {
                course: true,
              },
            },
          },
        },
        courseProgresses: {
          include: {
            course: true,
          },
        },
        quizAttempts: {
          include: {
            quiz: {
              include: {
                course: { select: { title: true } },
              },
            },
          },
          orderBy: { startedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: {
              include: {
                course: { select: { title: true } },
              },
            },
            feedback: true,
          },
          orderBy: { submittedAt: "desc" },
        },
        attendances: {
          include: {
            liveClass: {
              include: {
                batch: { select: { name: true } },
              },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
        certificates: {
          include: {
            course: { select: { title: true } },
          },
          orderBy: { issueDate: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateStudentSchema.parse(body);

    const existingStudent = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: { profile: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email.toLowerCase();
    if (typeof validatedData.isActive === "boolean") updateData.isActive = validatedData.isActive;
    if (validatedData.password && validatedData.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update profile phone / avatarUrl if provided
    if (validatedData.phone !== undefined || validatedData.avatarUrl !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          phone: validatedData.phone || null,
          avatarUrl: validatedData.avatarUrl || null,
        },
        update: {
          ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
          ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl || null }),
        },
      });
    }

    // Handle initial/updated enrollment & batch assignment if provided
    if (validatedData.courseId) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: id,
            courseId: validatedData.courseId,
          },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: id,
            courseId: validatedData.courseId,
            batchId: validatedData.batchId || null,
            status: "ACTIVE",
          },
        });
      } else if (validatedData.batchId) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { batchId: validatedData.batchId },
        });
      }
    }

    if (validatedData.batchId) {
      const existingBatchStudent = await prisma.batchStudent.findUnique({
        where: {
          batchId_userId: {
            batchId: validatedData.batchId,
            userId: id,
          },
        },
      });

      if (!existingBatchStudent) {
        await prisma.batchStudent.create({
          data: {
            userId: id,
            batchId: validatedData.batchId,
          },
        });
      }
    }

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "STUDENT_UPDATED",
        resource: `User:${id}`,
        details: { updatedFields: Object.keys(body) },
      },
    });

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin();
    const { id } = await params;

    const student = await prisma.user.findFirst({
      where: { id, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student account not found." },
        { status: 404 }
      );
    }

    // Perform safe delete of student account (Cascade deletes associated profile, enrollments, etc.)
    await prisma.user.delete({
      where: { id },
    });

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: adminSession.userId,
        action: "STUDENT_DELETED",
        resource: `User:${id}`,
        details: { studentName: student.name, studentEmail: student.email },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student ${student.name} deleted successfully.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
