import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import TrainerProfileClient from "./TrainerProfileClient";

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const trainer = await prisma.user.findFirst({
    where: { id, role: "TRAINER" },
    include: {
      profile: true,
      coursesCreated: {
        include: {
          modules: { select: { id: true } },
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: { select: { phone: true, avatarUrl: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      trainerBatches: {
        include: {
          batch: {
            include: {
              course: { select: { id: true, title: true } },
              students: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      profile: { select: { phone: true, avatarUrl: true } },
                    },
                  },
                },
              },
              liveClasses: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!trainer) {
    notFound();
  }

  // Serialize dates for client component props
  const serializedTrainer = {
    ...trainer,
    createdAt: trainer.createdAt.toISOString(),
    updatedAt: trainer.updatedAt.toISOString(),
    lastLoginAt: trainer.lastLoginAt ? trainer.lastLoginAt.toISOString() : null,
    profile: trainer.profile
      ? {
          ...trainer.profile,
          createdAt: trainer.profile.createdAt.toISOString(),
          updatedAt: trainer.profile.updatedAt.toISOString(),
        }
      : null,
    coursesCreated: trainer.coursesCreated.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      enrollments: c.enrollments.map((e) => ({
        ...e,
        enrolledAt: e.enrolledAt.toISOString(),
      })),
    })),
    trainerBatches: trainer.trainerBatches.map((tb) => ({
      ...tb,
      assignedAt: tb.assignedAt.toISOString(),
      batch: {
        ...tb.batch,
        startDate: tb.batch.startDate.toISOString(),
        endDate: tb.batch.endDate.toISOString(),
        createdAt: tb.batch.createdAt.toISOString(),
        updatedAt: tb.batch.updatedAt.toISOString(),
        liveClasses: tb.batch.liveClasses.map((lc) => ({
          ...lc,
          scheduledDate: lc.scheduledDate.toISOString(),
          startTime: lc.startTime.toISOString(),
          endTime: lc.endTime.toISOString(),
          createdAt: lc.createdAt.toISOString(),
          updatedAt: lc.updatedAt.toISOString(),
        })),
        students: tb.batch.students.map((st) => ({
          ...st,
          joinedAt: st.joinedAt.toISOString(),
        })),
      },
    })),
  };

  return <TrainerProfileClient trainer={serializedTrainer as any} />;
}
