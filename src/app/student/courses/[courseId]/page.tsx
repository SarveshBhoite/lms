import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentCourseClient from "./StudentCourseClient";

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId } = await params;
  const studentId = session.userId;

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: studentId, courseId, status: "ACTIVE" },
    include: {
      batch: { select: { id: true, name: true, startDate: true, endDate: true } },
    },
  });

  if (!enrollment && session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      trainer: { select: { id: true, name: true, email: true } },
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: {
              resources: true,
              quiz: {
                select: {
                  id: true,
                  title: true,
                  passingMarks: true,
                  timeLimitMinutes: true,
                  questions: {
                    select: {
                      id: true,
                      question: true,
                      type: true,
                      marks: true,
                      options: { select: { id: true, text: true, orderIndex: true } },
                    },
                  },
                  quizAttempts: {
                    where: { userId: studentId },
                    orderBy: { startedAt: "desc" },
                    take: 1,
                  },
                },
              },
              assignment: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  deadline: true,
                  totalMarks: true,
                  submissions: {
                    where: { userId: studentId },
                    orderBy: { submittedAt: "desc" },
                    take: 1,
                    include: {
                      feedback: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      quizzes: {
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, description: true, passingMarks: true, timeLimitMinutes: true, lessonId: true },
      },
      assignments: {
        select: { id: true, title: true, description: true, deadline: true, totalMarks: true, lessonId: true },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const [lessonProgresses, courseProgress] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: {
        userId: studentId,
        lesson: { module: { courseId } },
      },
      select: { lessonId: true, isCompleted: true, lastWatchedAt: true },
    }),
    prisma.courseProgress.findFirst({
      where: { userId: studentId, courseId },
    }),
  ]);

  const completedLessonIds = lessonProgresses.filter((lp) => lp.isCompleted).map((lp) => lp.lessonId);

  const learningResources = course.modules.flatMap((m) =>
    m.lessons.flatMap((l) =>
      l.resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.fileType,
        fileUrl: r.fileUrl,
        description: `Resource for lesson: ${l.title}`,
      }))
    )
  );

  const initialData = {
    ...course,
    learningResources,
    batch: enrollment?.batch || null,
    completedLessonIds,
    progressPercent: courseProgress ? courseProgress.progressPercent : 0,
  };

  return <StudentCourseClient initialCourse={initialData as any} currentUserId={session.userId} />;
}
