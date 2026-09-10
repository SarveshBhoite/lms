import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerBatchesClient from "./TrainerBatchesClient";

export default async function TrainerBatchesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const batches = await prisma.batch.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { course: { trainerId } },
            { trainers: { some: { trainerId } } },
          ],
        },
    include: {
      course: { select: { title: true, slug: true } },
      students: { select: { id: true } },
      trainers: { include: { trainer: { select: { name: true } } } },
      liveClasses: { select: { id: true, status: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return <TrainerBatchesClient batches={batches as any} isAdmin={isAdmin} />;
}
