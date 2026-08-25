import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import BatchDetailClient from "./BatchDetailClient";

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const { id } = await params;

  const [batch, availableTrainers, availableStudents] = await Promise.all([
    prisma.batch.findUnique({
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
          orderBy: { joinedAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                profile: { select: { phone: true, avatarUrl: true } },
              },
            },
          },
        },
        liveClasses: {
          orderBy: { scheduledDate: "asc" },
          include: {
            trainer: { select: { id: true, name: true, email: true } },
            attendances: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            trainers: true,
            liveClasses: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["TRAINER", "ADMIN"] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: { select: { designation: true, avatarUrl: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { avatarUrl: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!batch) {
    notFound();
  }

  // Serialize dates for Client component
  const serializedBatch = {
    ...batch,
    startDate: batch.startDate.toISOString(),
    endDate: batch.endDate.toISOString(),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    trainers: batch.trainers.map((bt) => ({
      ...bt,
      assignedAt: bt.assignedAt.toISOString(),
    })),
    students: batch.students.map((bs) => ({
      ...bs,
      joinedAt: bs.joinedAt.toISOString(),
    })),
    liveClasses: batch.liveClasses.map((lc) => ({
      ...lc,
      scheduledDate: lc.scheduledDate.toISOString(),
      startTime: lc.startTime.toISOString(),
      endTime: lc.endTime.toISOString(),
      createdAt: lc.createdAt.toISOString(),
      updatedAt: lc.updatedAt.toISOString(),
      attendances: lc.attendances.map((att) => ({
        ...att,
        recordedAt: att.recordedAt.toISOString(),
        joinedTime: att.joinedTime ? att.joinedTime.toISOString() : null,
        leftTime: att.leftTime ? att.leftTime.toISOString() : null,
      })),
    })),
  };

  return (
    <BatchDetailClient
      initialBatch={serializedBatch as any}
      availableTrainers={availableTrainers as any}
      availableStudents={availableStudents as any}
    />
  );
}
