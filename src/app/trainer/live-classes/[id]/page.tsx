import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerBatchAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import LiveClassDetailClient from "./LiveClassDetailClient";

export default async function LiveClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const liveClass = await prisma.liveClass.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      batch: {
        select: {
          id: true,
          name: true,
          courseId: true,
          course: { select: { id: true, title: true } },
        },
      },
      trainer: { select: { id: true, name: true, email: true } },
      attendances: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!liveClass) {
    notFound();
  }

  const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  // Load all students across all assigned batches for this live class
  const allBatchIds = liveClass.batchIds.length > 0 ? liveClass.batchIds : [liveClass.batchId];
  const allBatchStudents = await prisma.batchStudent.findMany({
    where: { batchId: { in: allBatchIds } },
    include: {
      batch: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { phone: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  // Attach all assigned students to batch.students for full multi-batch roster display
  const enrichedClass = {
    ...liveClass,
    batch: {
      ...liveClass.batch,
      students: allBatchStudents,
    },
  };

  return <LiveClassDetailClient initialClass={enrichedClass as any} currentUserId={session.userId} />;
}
