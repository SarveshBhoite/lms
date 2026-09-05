import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerAssignmentsClient from "./TrainerAssignmentsClient";

export default async function TrainerAssignmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const assignments = await prisma.assignment.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { course: { trainerId } },
            { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
          ],
        },
    include: {
      course: { select: { id: true, title: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          module: { select: { title: true } },
        },
      },
      submissions: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = assignments.map((a) => ({
    ...a,
    deadline: a.deadline ? a.deadline.toISOString() : null,
  }));

  return <TrainerAssignmentsClient initialAssignments={serialized as any} />;
}
