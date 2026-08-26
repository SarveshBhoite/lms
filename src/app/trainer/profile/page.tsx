import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerProfileFormClient from "./TrainerProfileFormClient";

export default async function TrainerProfilePage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      coursesCreated: { select: { id: true, title: true } },
      trainerBatches: { include: { batch: { select: { name: true } } } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <TrainerProfileFormClient initialUser={user as any} />;
}
