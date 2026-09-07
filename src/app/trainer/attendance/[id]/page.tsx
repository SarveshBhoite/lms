import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerBatchAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import TrainerAttendanceBatchClient from "./TrainerAttendanceBatchClient";

export default async function TrainerBatchAttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id: batchId } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerBatchAccess(session.userId, batchId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          level: true,
        },
      },
      students: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true, phone: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!batch) {
    notFound();
  }

  // Fetch all live class sessions linked to this batch (single or multi-batch)
  const liveClasses = await prisma.liveClass.findMany({
    where: {
      OR: [
        { batchId: batch.id },
        { batchIds: { has: batch.id } },
      ],
    },
    include: {
      trainer: { select: { id: true, name: true, email: true } },
      attendances: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return (
    <TrainerAttendanceBatchClient
      batch={batch as any}
      liveClasses={liveClasses as any}
      currentUserId={session.userId}
    />
  );
}
