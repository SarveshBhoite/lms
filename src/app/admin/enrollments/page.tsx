import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EnrollmentsClient from "./EnrollmentsClient";

export default async function AdminEnrollmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const [enrollments, courses, batches, students] = await Promise.all([
    prisma.enrollment.findMany({
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
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            durationHours: true,
            thumbnailUrl: true,
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
    }),
    prisma.course.findMany({
      select: { id: true, title: true, level: true },
      orderBy: { title: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, courseId: true, status: true },
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
        profile: { select: { phone: true, avatarUrl: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Fetch CourseProgress for each enrollment
  const formattedEnrollments = await Promise.all(
    enrollments.map(async (enr) => {
      const progress = await prisma.courseProgress.findUnique({
        where: {
          userId_courseId: {
            userId: enr.userId,
            courseId: enr.courseId,
          },
        },
      });

      return {
        id: enr.id,
        userId: enr.userId,
        courseId: enr.courseId,
        batchId: enr.batchId,
        enrolledAt: enr.enrolledAt.toISOString(),
        status: enr.status,
        completedAt: enr.completedAt ? enr.completedAt.toISOString() : null,
        user: enr.user,
        course: enr.course,
        batch: enr.batch
          ? {
              ...enr.batch,
              startDate: enr.batch.startDate.toISOString(),
              endDate: enr.batch.endDate.toISOString(),
            }
          : null,
        progress: progress
          ? {
              completedLessonsCount: progress.completedLessonsCount,
              totalLessonsCount: progress.totalLessonsCount,
              progressPercent: progress.progressPercent,
              isCompleted: progress.isCompleted,
            }
          : {
              completedLessonsCount: 0,
              totalLessonsCount: 0,
              progressPercent: 0.0,
              isCompleted: false,
            },
      };
    })
  );

  return (
    <EnrollmentsClient
      initialEnrollments={formattedEnrollments as any}
      courses={courses}
      batches={batches}
      students={students as any}
    />
  );
}
