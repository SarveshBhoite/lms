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
              select: {
                batchId: true,
                batch: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    trainers: {
                      select: {
                        trainer: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const students = activeEnrollments.map((e) => {
      const u = e.user;
      const activeBatches = u.studentBatches || [];
      const otherActiveBatch = activeBatches.find(
        (sb) => sb.batchId !== currentBatchId
      );

      const isCurrentBatchMember = currentBatchId
        ? activeBatches.some((sb) => sb.batchId === currentBatchId)
        : false;

      const isLocked = Boolean(otherActiveBatch);
      const lockedBatchName = otherActiveBatch ? otherActiveBatch.batch.name : null;
      const lockedTrainerName = otherActiveBatch?.batch.trainers[0]?.trainer?.name || "Faculty";

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        profile: u.profile,
        isLocked,
        lockedBatchName,
        lockedTrainerName,
        isCurrentBatchMember,
      };
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return handleApiError(error);
  }
}
