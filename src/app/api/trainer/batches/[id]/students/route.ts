import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerBatchAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Access denied to batch student roster", 403);
    }

    const batchStudents = await prisma.batchStudent.findMany({
      where: { batchId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { phone: true, avatarUrl: true, designation: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: batchStudents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { id } = await params;
    const isAdmin = session.role === "ADMIN";

    const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: Cannot manage students for this batch", 403);
    }

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { courseId: true },
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    const { studentIds } = await req.json();

    if (!Array.isArray(studentIds)) {
      throw new Error("Invalid payload: studentIds must be an array of user IDs");
    }

    // 1. Existing student IDs in this batch
    const currentStudents = await prisma.batchStudent.findMany({
      where: { batchId: id },
      select: { userId: true },
    });
    const currentStudentIds = currentStudents.map((s) => s.userId);

    const studentsToRemove = currentStudentIds.filter((uid) => !studentIds.includes(uid));
    const studentsToAdd = studentIds.filter((uid) => !currentStudentIds.includes(uid));

    // 2. Remove students no longer in list (do not delete account or learning history!)
    if (studentsToRemove.length > 0) {
      await prisma.batchStudent.deleteMany({
        where: {
          batchId: id,
          userId: { in: studentsToRemove },
        },
      });

      // Clear batchId from enrollment for removed students
      await prisma.enrollment.updateMany({
        where: {
          courseId: batch.courseId,
          userId: { in: studentsToRemove },
          batchId: id,
        },
        data: { batchId: null },
      });
    }

    // 3. Check for students to add and handle reassignment safely
    if (studentsToAdd.length > 0) {
      // Find active enrollments for students to add
      const eligibleEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: batch.courseId,
          userId: { in: studentsToAdd },
          status: "ACTIVE",
        },
        select: { userId: true, batchId: true },
      });

      const validUserIds = eligibleEnrollments.map((e) => e.userId);

      if (validUserIds.length > 0) {
        // Remove from old batch if reassigning
        await prisma.batchStudent.deleteMany({
          where: {
            userId: { in: validUserIds },
            batch: { courseId: batch.courseId },
          },
        });

        // Add to current batch
        await prisma.batchStudent.createMany({
          data: validUserIds.map((userId) => ({
            batchId: id,
            userId,
          })),
          skipDuplicates: true,
        });

        // Link enrollment to new batch
        await prisma.enrollment.updateMany({
          where: {
            courseId: batch.courseId,
            userId: { in: validUserIds },
          },
          data: { batchId: id },
        });
      }
    }

    const updatedStudents = await prisma.batchStudent.findMany({
      where: { batchId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedStudents });
  } catch (error) {
    return handleApiError(error);
  }
}
