import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerBatchAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import TrainerBatchDetailClient from "./TrainerBatchDetailClient";

export default async function TrainerBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerBatchAccess(session.userId, id, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          durationHours: true,
          quizzes: {
            select: {
              id: true,
              title: true,
              description: true,
              timeLimitMinutes: true,
              passingMarks: true,
              status: true,
              questions: { select: { id: true } },
              quizAttempts: { select: { id: true, userId: true, score: true, isPassed: true } },
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              description: true,
              deadline: true,
              totalMarks: true,
              submissions: {
                select: {
                  id: true,
                  userId: true,
                  status: true,
                  submittedAt: true,
                  user: { select: { id: true, name: true, email: true } },
                  feedback: true,
                },
              },
            },
          },
        },
      },
      trainers: {
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: { select: { phone: true, avatarUrl: true, designation: true } },
            },
          },
        },
      },
      students: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              profile: { select: { phone: true, avatarUrl: true, designation: true } },
            },
          },
        },
      },
      liveClasses: {
        include: {
          trainer: { select: { id: true, name: true, email: true } },
          attendances: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { scheduledDate: "desc" },
      },
      _count: {
        select: { students: true, trainers: true, liveClasses: true },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  // Fetch eligible students for adding to batch (if trainer wants to add more students)
  const eligibleEnrollments = await prisma.enrollment.findMany({
    where: {
      courseId: batch.courseId,
      status: "ACTIVE",
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { avatarUrl: true, phone: true } },
          studentBatches: {
            where: {
              batch: {
                courseId: batch.courseId,
                status: { in: ["UPCOMING", "ONGOING"] },
              },
            },
            select: { batchId: true },
          },
        },
      },
    },
  });

  const availableStudents = eligibleEnrollments
    .map((e) => e.user)
    .filter((u) => {
      if (!u.studentBatches || u.studentBatches.length === 0) return true;
      if (u.studentBatches.some((sb) => sb.batchId === batch.id)) return true;
      return false;
    });

  return (
    <TrainerBatchDetailClient
      initialBatch={batch as any}
      availableStudents={availableStudents as any}
      currentUserId={session.userId}
    />
  );
}
