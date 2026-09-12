import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TrainerDrawerLayout from "./TrainerDrawerLayout";

import DeactivatedAccountScreen from "@/components/student/DeactivatedAccountScreen";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  // Verify trainer isActive and fetch profile
  const user = await prisma.user.findUnique({
    where: { id: trainerId },
    select: {
      isActive: true,
      name: true,
      email: true,
      role: true,
      profile: { select: { avatarUrl: true, designation: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // If trainer account is deactivated by admin, override screen
  if (!user.isActive) {
    return (
      <DeactivatedAccountScreen
        userName={user.name}
        userEmail={user.email}
        role="TRAINER"
      />
    );
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Parallel queries for dynamic badges matching Trainer scope
  const [
    unreadNotificationsCount,
    upcomingLiveClassesCount,
    pendingAssignmentsCount,
  ] = await Promise.all([
    // 1. Direct unread system notifications for trainer
    prisma.notification.count({
      where: { userId: trainerId, isRead: false },
    }),

    // 2. Upcoming live classes (scheduled today onwards taught by or assigned to trainer)
    prisma.liveClass.count({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { trainerId },
                { batch: { trainers: { some: { trainerId } } } },
                { course: { trainerId } },
              ],
            }),
        scheduledDate: { gte: todayStart },
        status: { in: ["SCHEDULED", "LIVE"] },
      },
    }),

    // 3. Pending assignment submissions awaiting faculty evaluation
    prisma.assignmentSubmission.count({
      where: {
        status: "SUBMITTED",
        assignment: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            },
      },
    }),
  ]);

  return (
    <TrainerDrawerLayout
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.profile?.designation,
        avatarUrl: user.profile?.avatarUrl,
      }}
      unreadNotificationsCount={unreadNotificationsCount}
      liveClassesCount={upcomingLiveClassesCount}
      pendingAssignmentsCount={pendingAssignmentsCount}
    >
      {children}
    </TrainerDrawerLayout>
  );
}
