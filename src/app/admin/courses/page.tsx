import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoursesClient from "./CoursesClient";

export default async function AdminCoursesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const [courses, trainers] = await Promise.all([
    prisma.course.findMany({
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true, designation: true } },
          },
        },
        modules: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
        enrollments: { select: { id: true } },
        batches: { select: { id: true, name: true, status: true } },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            batches: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
  ]);

  // Format courses data
  const serializedCourses = courses.map((course) => {
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + (m._count?.lessons || 0),
      0
    );
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      objectives: course.objectives,
      durationHours: course.durationHours,
      level: course.level,
      prerequisites: course.prerequisites,
      trainerId: course.trainerId,
      status: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      trainer: course.trainer,
      totalModules: course._count.modules,
      totalLessons,
      totalStudents: course._count.enrollments,
      totalBatches: course._count.batches,
    };
  });

  return (
    <CoursesClient
      initialCourses={serializedCourses as any}
      trainers={trainers as any}
    />
  );
}
