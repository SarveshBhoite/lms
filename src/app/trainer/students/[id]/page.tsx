import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TrainerStudentDetailClient from "./TrainerStudentDetailClient";

export default async function TrainerStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";
  const trainerId = session.userId;

  // Check scope access: student must be in trainer's assigned course or batch scope
  if (!isAdmin) {
    const scopeCheck = await prisma.user.findFirst({
      where: {
        id,
        role: "STUDENT",
        OR: [
          {
            enrollments: {
              some: {
                course: {
                  OR: [
                    { trainerId },
                    { batches: { some: { trainers: { some: { trainerId } } } } },
                  ],
                },
              },
            },
          },
          {
            studentBatches: {
              some: {
                batch: {
                  OR: [
                    { course: { trainerId } },
                    { trainers: { some: { trainerId } } },
                  ],
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!scopeCheck) {
      redirect("/unauthorized");
    }
  }

  const [student, notes] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true, level: true, durationHours: true } },
            batch: { select: { id: true, name: true, startDate: true, endDate: true } },
          },
        },
        courseProgresses: {
          include: { course: { select: { id: true, title: true } } },
        },
        lessonProgresses: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                contentType: true,
                module: { select: { title: true } },
              },
            },
          },
          orderBy: { lastWatchedAt: "desc" },
        },
        quizAttempts: {
          include: {
            quiz: { select: { id: true, title: true, passingMarks: true, timeLimitMinutes: true } },
          },
          orderBy: { startedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: { select: { id: true, title: true, totalMarks: true, deadline: true } },
            feedback: { include: { trainer: { select: { name: true } } } },
          },
          orderBy: { submittedAt: "desc" },
        },
        attendances: {
          include: {
            liveClass: {
              select: {
                id: true,
                title: true,
                scheduledDate: true,
                batch: { select: { name: true } },
              },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
        certificates: {
          include: { course: { select: { title: true } } },
        },
      },
    }),
    prisma.trainerNote.findMany({
      where: { studentId: id },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  if (!student) {
    notFound();
  }

  const studentWithNotes = {
    ...student,
    studentNotes: notes,
  };

  return <TrainerStudentDetailClient initialStudent={studentWithNotes as any} currentUserId={session.userId} />;
}
