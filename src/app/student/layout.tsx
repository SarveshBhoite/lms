import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StudentDrawerLayout from "./StudentDrawerLayout";

import DeactivatedAccountScreen from "@/components/student/DeactivatedAccountScreen";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  // Verify student isActive
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, name: true, email: true, role: true, profile: { select: { avatarUrl: true } } },
  });

  if (!user) {
    redirect("/login");
  }

  // If student account is deactivated, show complete full-screen override blocking portal access
  if (!user.isActive) {
    return <DeactivatedAccountScreen userName={user.name} userEmail={user.email} />;
  }

  // Query student's enrolled courses and batches for accurate badge counts
  const [batchStudents, userEnrollments] = await Promise.all([
    prisma.batchStudent.findMany({
      where: { userId: session.userId },
      select: { batchId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { batchId: true, courseId: true },
    }),
  ]);

  const enrolledCourseIds = userEnrollments.map((e) => e.courseId);
  const enrolledBatchIds = Array.from(
    new Set([
      ...batchStudents.map((b) => b.batchId),
      ...userEnrollments.map((e) => e.batchId).filter(Boolean) as string[],
    ])
  );

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Parallel counts for badge indicators
  const [unreadNotificationsCount, liveClassesCount, quizzesCount, assignmentsCount] = await Promise.all([
    // 1. Unread notifications
    prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    }),

    // 2. Upcoming live classes (scheduled today onwards)
    prisma.liveClass.count({
      where: {
        batchId: { in: enrolledBatchIds },
        scheduledDate: { gte: todayStart },
      },
    }),

    // 3. Pending quizzes (published quizzes with no passing attempts yet)
    prisma.quiz.count({
      where: {
        courseId: { in: enrolledCourseIds },
        lessonId: null,
        status: "PUBLISHED",
        OR: [{ batchIds: { isEmpty: true } }, { batchIds: { hasSome: enrolledBatchIds } }],
        quizAttempts: {
          none: {
            userId: session.userId,
            isPassed: true,
          },
        },
      },
    }),

    // 4. Pending assignments (no submission uploaded yet)
    prisma.assignment.count({
      where: {
        courseId: { in: enrolledCourseIds },
        lessonId: null,
        OR: [{ batchIds: { isEmpty: true } }, { batchIds: { hasSome: enrolledBatchIds } }],
        submissions: {
          none: {
            userId: session.userId,
          },
        },
      },
    }),
  ]);

  return (
    <StudentDrawerLayout
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.profile?.avatarUrl,
      }}
      unreadNotificationsCount={unreadNotificationsCount}
      liveClassesCount={liveClassesCount}
      quizzesCount={quizzesCount}
      assignmentsCount={assignmentsCount}
    >
      {children}
    </StudentDrawerLayout>
  );
}


