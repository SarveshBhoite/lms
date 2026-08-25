import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BatchesClient from "./BatchesClient";

export default async function AdminBatchesPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const [batches, courses, trainers, students] = await Promise.all([
    prisma.batch.findMany({
      include: {
        course: {
          select: { id: true, title: true, level: true, thumbnailUrl: true },
        },
        trainers: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: { select: { avatarUrl: true, designation: true } },
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
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        },
        liveClasses: {
          select: { id: true, title: true, scheduledDate: true, status: true },
        },
        _count: {
          select: {
            students: true,
            trainers: true,
            liveClasses: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, level: true },
      orderBy: { title: "asc" },
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

  // Serialize dates for Client component
  const serializedBatches = batches.map((b) => ({
    id: b.id,
    name: b.name,
    courseId: b.courseId,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    course: b.course,
    trainers: b.trainers.map((bt) => ({
      id: bt.id,
      trainerId: bt.trainerId,
      assignedAt: bt.assignedAt.toISOString(),
      trainer: bt.trainer,
    })),
    students: b.students.map((bs) => ({
      id: bs.id,
      userId: bs.userId,
      joinedAt: bs.joinedAt.toISOString(),
      user: bs.user,
    })),
    totalStudents: b._count.students,
    totalTrainers: b._count.trainers,
    totalLiveClasses: b._count.liveClasses,
  }));

  return (
    <BatchesClient
      initialBatches={serializedBatches as any}
      courses={courses}
      trainers={trainers as any}
      students={students as any}
    />
  );
}
