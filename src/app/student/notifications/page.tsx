import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentNotificationsClient from "./StudentNotificationsClient";

export default async function StudentNotificationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId: studentId },
    orderBy: { createdAt: "desc" },
  });

  return <StudentNotificationsClient initialNotifications={notifications as any} currentUserId={session.userId} />;
}
