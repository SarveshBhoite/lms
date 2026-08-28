import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminContentClient from "@/app/admin/content/AdminContentClient";

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
      include: {
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

  return <AdminContentClient initialCourses={courses as any} initialResources={resources as any} />;
}
