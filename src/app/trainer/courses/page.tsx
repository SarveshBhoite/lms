import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerCoursesClient from "./TrainerCoursesClient";

export default async function TrainerCoursesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { trainerId },
            { batches: { some: { trainers: { some: { trainerId } } } } },
          ],
        },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
      enrollments: { select: { id: true } },
      batches: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <TrainerCoursesClient courses={courses as any} isAdmin={isAdmin} />;
}
