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

  const [trainer, courses, batches, liveClassesTaught, evaluatedAssignmentsCount, authoredNotes] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "TRAINER" },
      include: {
        profile: true,
        coursesCreated: {
          include: {
            modules: { select: { id: true, title: true } },
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
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    }),
    prisma.liveClass.findMany({
      where: {
        OR: [
          { trainerId: id },
          { batch: { trainers: { some: { trainerId: id } } } },
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
        attendances: { select: { id: true, status: true } },
      },
      orderBy: { scheduledDate: "desc" },
      take: 50,
    }),
    prisma.assignmentFeedback.count({
      where: { trainerId: id },
    }),
    prisma.trainerNote.findMany({
      where: { trainerId: id },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

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

  const serializedLiveClasses = liveClassesTaught.map((lc) => ({
    id: lc.id,
    title: lc.title,
    scheduledDate: lc.scheduledDate.toISOString(),
    status: lc.status,
    meetingUrl: lc.meetUrl,
    batchName: lc.batch.name,
    totalAttendance: lc.attendances.length,
    presentCount: lc.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length,
  }));

  const serializedAuthoredNotes = authoredNotes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    student: n.student,
  }));

  return (
    <TrainerProfileClient
      trainer={serializedTrainer as any}
      courses={courses}
      batches={batches}
      liveClasses={serializedLiveClasses}
      evaluatedAssignmentsCount={evaluatedAssignmentsCount}
      authoredNotes={serializedAuthoredNotes}
    />
  );
}
