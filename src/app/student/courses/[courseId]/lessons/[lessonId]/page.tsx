import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import StudentLessonPlayerClient from "./StudentLessonPlayerClient";

export default async function StudentLessonViewPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId, lessonId } = await params;
  const studentId = session.userId;

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: studentId, courseId, status: "ACTIVE" },
  });

  if (!enrollment && session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Load course with all modules & lessons to determine sequential unlock progression
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
              quiz: { select: { id: true, title: true, passingMarks: true } },
              assignment: { select: { id: true, title: true, totalMarks: true } },
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Load lesson progress
  const lessonProgresses = await prisma.lessonProgress.findMany({
    where: {
      userId: studentId,
      lesson: { module: { courseId } },
    },
    select: { lessonId: true, isCompleted: true },
  });
  const completedLessonIds = lessonProgresses.filter((lp) => lp.isCompleted).map((lp) => lp.lessonId);

  // Flatten all lessons in sequential order
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  if (currentIdx === -1) {
    notFound();
  }

  // Sequential lock check:
  // If currentIdx > 0 and previous lesson is NOT completed, redirect back to course overview
  if (currentIdx > 0) {
    const prevLesson = allLessons[currentIdx - 1];
    if (!completedLessonIds.includes(prevLesson.id)) {
      redirect(`/student/courses/${courseId}`);
    }
  }

  // Load target lesson with full details, rich HTML text content, quiz questions and assignment submissions
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: true,
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          passingMarks: true,
          timeLimitMinutes: true,
          questions: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              question: true,
              type: true,
              marks: true,
              options: {
                orderBy: { orderIndex: "asc" },
                select: { id: true, text: true, orderIndex: true },
              },
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
          instructions: true,
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
  });

  if (!lesson) {
    notFound();
  }

  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <StudentLessonPlayerClient
      course={{
        id: course.id,
        title: course.title,
        level: course.level,
        modules: course.modules,
      }}
      currentLesson={lesson as any}
      completedLessonIds={completedLessonIds}
      prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null}
      nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
    />
  );
}
