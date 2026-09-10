import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import TrainerNotificationsClient, { NotificationFeedItem } from "./TrainerNotificationsClient";

export default async function TrainerNotificationsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  // 1. Fetch direct system notifications sent to the trainer
  const directNotifications = await prisma.notification.findMany({
    where: { userId: trainerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 2. Automatically mark unread notifications as read upon opening this page (matching student notifications)
  const hasUnread = directNotifications.some((n) => !n.isRead);
  if (hasUnread) {
    await prisma.notification.updateMany({
      where: { userId: trainerId, isRead: false },
      data: { isRead: true },
    });
  }

  // 3. Fetch real-time student activity feed from the trainer's assigned courses & batches:
  const [recentSubmissions, recentQuizAttempts, recentEnrollments] = await Promise.all([
    // A. Student assignment submissions
    prisma.assignmentSubmission.findMany({
      where: {
        assignment: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true, course: { select: { title: true } } } },
      },
      orderBy: { submittedAt: "desc" },
      take: 25,
    }),

    // B. Student quiz attempts
    prisma.quizAttempt.findMany({
      where: {
        quiz: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
              ],
            },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: { select: { id: true, title: true, course: { select: { title: true } } } },
      },
      orderBy: { startedAt: "desc" },
      take: 25,
    }),

    // C. New student cohort enrollments
    prisma.batchStudent.findMany({
      where: {
        batch: isAdmin
          ? {}
          : {
              OR: [
                { course: { trainerId } },
                { trainers: { some: { trainerId } } },
              ],
            },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true, course: { select: { title: true } } } },
      },
      orderBy: { joinedAt: "desc" },
      take: 20,
    }),
  ]);

  // 4. Assemble and harmonize all activity items into a unified feed
  const combinedItems: NotificationFeedItem[] = [
    // Direct notifications
    ...directNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: true, // Auto-marked as read on open
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
      badgeLabel: n.type.replace(/_/g, " "),
    })),

    // Assignment submissions
    ...recentSubmissions.map((sub) => ({
      id: `sub-${sub.id}`,
      title: `Assignment Submitted: ${sub.assignment.title}`,
      message: `${sub.user.name || sub.user.email} turned in a solution for "${sub.assignment.title}" (${sub.assignment.course?.title || "Course"}). Status: ${sub.status}.`,
      type: "ASSIGNMENT",
      isRead: true,
      actionUrl: `/trainer/assignments/${sub.assignment.id}`,
      createdAt: sub.submittedAt.toISOString(),
      badgeLabel: "Assignment",
      studentName: sub.user.name || sub.user.email,
    })),

    // Quiz attempts
    ...recentQuizAttempts.map((qa) => ({
      id: `qa-${qa.id}`,
      title: `Quiz Completed: ${qa.quiz.title}`,
      message: `${qa.user.name || "Student"} completed "${qa.quiz.title}" with a score of ${qa.score.toFixed(1)}% (${qa.isPassed ? "PASSED" : "FAILED"}).`,
      type: "QUIZ",
      isRead: true,
      actionUrl: `/trainer/quizzes/${qa.quiz.id}`,
      createdAt: qa.startedAt.toISOString(),
      badgeLabel: "Quiz",
      studentName: qa.user.name || "",
    })),

    // Cohort enrollments
    ...recentEnrollments.map((bs) => ({
      id: `enroll-${bs.id}`,
      title: `New Learner: ${bs.user.name || "Student"}`,
      message: `${bs.user.name || "A new student"} enrolled in batch "${bs.batch.name}" for "${bs.batch.course?.title || "Course"}".`,
      type: "STUDENT",
      isRead: true,
      actionUrl: `/trainer/batches/${bs.batch.id}`,
      createdAt: bs.joinedAt.toISOString(),
      badgeLabel: "Learner Enrolled",
      studentName: bs.user.name || bs.user.email,
    })),
  ];

  // Deduplicate and sort descending by date
  const uniqueItemsMap = new Map<string, NotificationFeedItem>();
  for (const item of combinedItems) {
    if (!uniqueItemsMap.has(item.id)) {
      uniqueItemsMap.set(item.id, item);
    }
  }

  const feedList = Array.from(uniqueItemsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh, matching student notification page) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Bell className="w-3 h-3 text-[#7C248C]" /> Feed & Faculty Alerts
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications & <span className="jvm-gradient-text">Updates</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Stay updated with student submissions, evaluations, live class schedules, and cohort updates.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-2 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            {feedList.length} {feedList.length === 1 ? "Alert" : "Alerts"} Total
          </span>
        </div>
      </div>

      {/* Notifications Stream Feed */}
      <TrainerNotificationsClient
        initialNotifications={feedList}
        currentUserId={trainerId}
      />
    </div>
  );
}

