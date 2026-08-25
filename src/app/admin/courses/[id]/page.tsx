import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CourseDetailClient from "./CourseDetailClient";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const [course, trainers] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              include: {
                resources: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
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
            batch: { select: { id: true, name: true } },
          },
        },
        batches: {
          orderBy: { startDate: "desc" },
          include: {
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            batches: true,
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
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!course) {
    notFound();
  }

  // Serialize dates for Client Component
  const serializedCourse = {
    ...course,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    trainer: {
      ...course.trainer,
    },
    modules: course.modules.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      lessons: m.lessons.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        resources: l.resources.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      })),
    })),
    enrollments: course.enrollments.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    })),
    batches: course.batches.map((b) => ({
      ...b,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
  };

  return (
    <CourseDetailClient
      initialCourse={serializedCourse as any}
      trainers={trainers}
    />
  );
}
