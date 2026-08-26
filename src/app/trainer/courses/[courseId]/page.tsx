import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import TrainerCourseClient from "./TrainerCourseClient";

export default async function TrainerCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      trainer: { select: { id: true, name: true, email: true } },
      modules: {
        include: {
          lessons: {
            include: { resources: true },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true, phone: true } },
              courseProgresses: {
                where: { courseId },
                select: { progressPercent: true, completedLessonsCount: true, isCompleted: true },
              },
            },
          },
          batch: { select: { id: true, name: true } },
        },
      },
      batches: {
        select: { id: true, name: true, status: true },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return <TrainerCourseClient initialCourse={course as any} />;
}
