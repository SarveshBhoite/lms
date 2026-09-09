import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerContentClient from "./TrainerContentClient";

export default async function TrainerContentLibraryPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const [courses, resources] = await Promise.all([
    prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { trainerId },
              { batches: { some: { trainers: { some: { trainerId } } } } },
            ],
          },
      select: {
        id: true,
        title: true,
        batches: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        modules: {
          select: {
            id: true,
            title: true,
            lessons: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.resource.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              {
                lesson: {
                  module: {
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
                course: {
                  OR: [
                    { trainerId },
                    { batches: { some: { trainers: { some: { trainerId } } } } },
                  ],
                },
              },
              {
                batch: {
                  trainers: { some: { trainerId } },
                },
              },
            ],
          },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <TrainerContentClient initialCourses={courses as any} initialResources={resources as any} />;
}
