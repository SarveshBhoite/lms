import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveTrainer, verifyTrainerCourseAccess, handleApiError, AuthError } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireActiveTrainer();
    const { courseId } = await params;
    const isAdmin = session.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    const currentBatchId = searchParams.get("currentBatchId");

    const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
    if (!hasAccess) {
      throw new AuthError("Forbidden: You are not assigned to teach this course", 403);
    }

    // Fetch active enrollments for this course
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true, phone: true, designation: true } },
            studentBatches: {
              where: {
                batch: {
                  courseId,
                  status: { in: ["UPCOMING", "ONGOING"] },
                },
              },
              select: { batchId: true, batch: { select: { name: true } } },
            },
          },
        },
      },
    });

    // Filter students: eligible if they have no active batch for this course, or if their active batch IS currentBatchId
    const eligibleStudents = activeEnrollments
      .map((e) => e.user)
      .filter((u) => {
        if (!u.studentBatches || u.studentBatches.length === 0) return true;
        if (currentBatchId && u.studentBatches.some((sb) => sb.batchId === currentBatchId)) return true;
        return false;
      });

    return NextResponse.json({ success: true, data: eligibleStudents });
  } catch (error) {
    return handleApiError(error);
  }
}
