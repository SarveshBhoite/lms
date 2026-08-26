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

    // 2. Validate studentsToAdd: reject if any student is already in another UPCOMING or ONGOING batch for this course
    if (studentsToAdd.length > 0) {
      const conflictingAssignments = await prisma.batchStudent.findMany({
        where: {
          userId: { in: studentsToAdd },
          batchId: { not: id },
          batch: {
            courseId: batch.courseId,
            status: { in: ["UPCOMING", "ONGOING"] },
          },
        },
        include: {
          user: { select: { name: true } },
          batch: { select: { name: true } },
        },
      });

      if (conflictingAssignments.length > 0) {
        const conflictNames = conflictingAssignments
          .map((c) => `"${c.user.name}" in batch "${c.batch.name}"`)
          .join(", ");
        throw new Error(
          `Cannot add student(s): ${conflictNames}. Student is locked in another active batch for this course.`
        );
      }
    }

    // 3. Remove students no longer in list (without deleting account, enrollment, or learning history)
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

    // 4. Add new eligible students
    if (studentsToAdd.length > 0) {
      const eligibleEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: batch.courseId,
          userId: { in: studentsToAdd },
          status: "ACTIVE",
        },
        select: { userId: true },
      });

      const validUserIds = eligibleEnrollments.map((e) => e.userId);

      if (validUserIds.length > 0) {
        await prisma.batchStudent.createMany({
          data: validUserIds.map((userId) => ({
            batchId: id,
            userId,
          })),
          skipDuplicates: true,
        });

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
