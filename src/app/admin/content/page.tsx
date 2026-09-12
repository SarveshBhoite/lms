import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminContentClient from "./AdminContentClient";

export default async function AdminContentLibraryPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const [courses, resources] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
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

  return <AdminContentClient initialCourses={courses as any} initialResources={resources as any} />;
}
