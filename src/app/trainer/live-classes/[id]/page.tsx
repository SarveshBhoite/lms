import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerBatchAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import LiveClassDetailClient from "./LiveClassDetailClient";

export default async function LiveClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const liveClass = await prisma.liveClass.findUnique({
    where: { id },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          courseId: true,
          course: { select: { id: true, title: true } },
          students: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: { select: { phone: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      },
      trainer: { select: { id: true, name: true, email: true } },
      attendances: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!liveClass) {
    notFound();
  }

  const hasAccess = await verifyTrainerBatchAccess(session.userId, liveClass.batchId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return <LiveClassDetailClient initialClass={liveClass as any} currentUserId={session.userId} />;
}
