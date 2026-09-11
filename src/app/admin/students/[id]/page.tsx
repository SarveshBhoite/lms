import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import StudentProfileClient from "./StudentProfileClient";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const [student, notes, courses, batches] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: "STUDENT" },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                level: true,
                durationHours: true,
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        studentBatches: {
          include: {
            batch: {
              include: {
                course: { select: { title: true } },
              },
            },
          },
        },
        courseProgresses: {
          include: {
            course: { select: { id: true, title: true } },
          },
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
            quiz: {
              select: {
                title: true,
                passingMarks: true,
                timeLimitMinutes: true,
                course: { select: { title: true } },
              },
            },
          },
          orderBy: { startedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: {
              select: {
                title: true,
                totalMarks: true,
                deadline: true,
                course: { select: { title: true } },
              },
            },
            feedback: {
              include: {
                trainer: { select: { name: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
        attendances: {
          include: {
            liveClass: {
              select: {
                title: true,
                scheduledDate: true,
                batch: { select: { name: true } },
              },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
        certificates: {
          include: {
            course: { select: { title: true } },
          },
          orderBy: { issueDate: "desc" },
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
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!student) {
    notFound();
  }

  // Serialize dates for client components
  const serializedStudent = {
    ...student,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
    lastLoginAt: student.lastLoginAt ? student.lastLoginAt.toISOString() : null,
    profile: student.profile
      ? {
          ...student.profile,
          createdAt: student.profile.createdAt.toISOString(),
          updatedAt: student.updatedAt.toISOString(),
        }
      : null,
    enrollments: student.enrollments.map((en) => ({
      ...en,
      enrolledAt: en.enrolledAt.toISOString(),
      completedAt: en.completedAt ? en.completedAt.toISOString() : null,
      batch: en.batch
        ? {
            ...en.batch,
            startDate: en.batch.startDate.toISOString(),
            endDate: en.batch.endDate.toISOString(),
          }
        : null,
    })),
    studentBatches: student.studentBatches.map((sb) => ({
      ...sb,
      joinedAt: sb.joinedAt.toISOString(),
      batch: {
        ...sb.batch,
        startDate: sb.batch.startDate.toISOString(),
        endDate: sb.batch.endDate.toISOString(),
      },
    })),
    courseProgresses: student.courseProgresses.map((cp) => ({
      ...cp,
      completedAt: cp.completedAt ? cp.completedAt.toISOString() : null,
      updatedAt: cp.updatedAt.toISOString(),
    })),
    quizAttempts: student.quizAttempts.map((qa) => ({
      ...qa,
      startedAt: qa.startedAt.toISOString(),
      submittedAt: qa.submittedAt ? qa.submittedAt.toISOString() : null,
    })),
    assignmentSubmissions: student.assignmentSubmissions.map((as) => ({
      ...as,
      submittedAt: as.submittedAt.toISOString(),
      updatedAt: as.updatedAt.toISOString(),
      feedback: as.feedback
        ? {
            ...as.feedback,
            evaluatedAt: as.feedback.evaluatedAt.toISOString(),
            updatedAt: as.feedback.updatedAt.toISOString(),
          }
        : null,
    })),
    attendances: student.attendances.map((at) => ({
      ...at,
      recordedAt: at.recordedAt.toISOString(),
      joinClickTime: at.joinClickTime ? at.joinClickTime.toISOString() : null,
      leftTime: at.leftTime ? at.leftTime.toISOString() : null,
      liveClass: {
        ...at.liveClass,
        scheduledDate: at.liveClass.scheduledDate.toISOString(),
      },
    })),
    lessonProgresses: (student.lessonProgresses || []).map((lp) => ({
      ...lp,
      lastWatchedAt: lp.lastWatchedAt ? lp.lastWatchedAt.toISOString() : new Date().toISOString(),
    })),
    certificates: student.certificates.map((c) => ({
      ...c,
      issueDate: c.issueDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    studentNotes: (notes || []).map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  };

  return (
    <StudentProfileClient
      student={serializedStudent as any}
      courses={courses}
      batches={batches}
    />
  );
}
