import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrainersClient from "./TrainersClient";

export default async function AdminTrainersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const [trainers, courses, batches] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TRAINER" },
      include: {
        profile: true,
        coursesCreated: {
          select: {
            id: true,
            title: true,
            status: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        trainerBatches: {
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                status: true,
                _count: { select: { students: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, trainerId: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates for Client Component props
  const serializedTrainers = trainers.map((tr) => {
    const courseStudents = tr.coursesCreated.reduce(
      (acc, c) => acc + (c._count?.enrollments || 0),
      0
    );
    const batchStudents = tr.trainerBatches.reduce(
      (acc, tb) => acc + (tb.batch._count?.students || 0),
      0
    );

    return {
      ...tr,
      createdAt: tr.createdAt.toISOString(),
      updatedAt: tr.updatedAt.toISOString(),
      lastLoginAt: tr.lastLoginAt ? tr.lastLoginAt.toISOString() : null,
      profile: tr.profile
        ? {
            ...tr.profile,
            createdAt: tr.profile.createdAt.toISOString(),
            updatedAt: tr.profile.updatedAt.toISOString(),
          }
        : null,
      totalStudentsCount: courseStudents + batchStudents,
    };
  });

  return (
    <TrainersClient
      initialTrainers={serializedTrainers as any}
      courses={courses}
      batches={batches}
    />
  );
}
