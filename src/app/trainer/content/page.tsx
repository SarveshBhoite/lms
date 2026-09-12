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

  // System-wide content library: show all resources uploaded across all trainers, courses, and lessons
  const [courses, resources] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      include: {
        course: {
          select: {
            id: true,
            title: true,
            trainer: {
              select: {
                id: true,
                name: true,
              },
            },
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
                    trainer: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
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
