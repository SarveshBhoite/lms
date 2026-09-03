import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import HtmlLessonEditor from "@/components/HtmlLessonEditor";

export default async function AdminLessonEditPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const { id: courseId, moduleId, lessonId } = await params;

  const [course, courseModule, lesson] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    }),
    prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true },
    }),
    prisma.lesson.findUnique({
      where: { id: lessonId, moduleId },
      include: {
        resources: true,
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { options: { orderBy: { orderIndex: "asc" } } },
            },
          },
        },
        assignment: true,
      },
    }),
  ]);

  if (!course || !courseModule || !lesson) {
    notFound();
  }

  const initialData = {
    title: lesson.title,
    description: lesson.description || "",
    contentType: lesson.contentType as any,
    contentUrl: lesson.contentUrl || "",
    textContent: lesson.textContent || "",
    durationMinutes: lesson.durationMinutes,
    isFreePreview: lesson.isFreePreview,
    resources: lesson.resources.map((r) => ({
      id: r.id,
      title: r.title,
      fileType: r.fileType,
      fileSize: r.fileSize,
      fileUrl: r.fileUrl,
    })),
    quiz: lesson.quiz
      ? {
          title: lesson.quiz.title,
          description: lesson.quiz.description || "",
          passingMarks: lesson.quiz.passingMarks,
          timeLimitMinutes: lesson.quiz.timeLimitMinutes,
          questions: lesson.quiz.questions.map((q) => ({
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            marks: q.marks,
            explanation: q.explanation || "",
            correctAnswerText: q.correctAnswerText || "",
            options: q.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          })),
        }
      : null,
    assignment: lesson.assignment
      ? {
          title: lesson.assignment.title,
          description: lesson.assignment.description,
          instructions: lesson.assignment.instructions || "",
          deadline: lesson.assignment.deadline ? lesson.assignment.deadline.toISOString().split("T")[0] : "",
          totalMarks: lesson.assignment.totalMarks,
        }
      : null,
  };

  return (
    <HtmlLessonEditor
      courseId={course.id}
      courseTitle={course.title}
      moduleId={courseModule.id}
      moduleTitle={courseModule.title}
      lessonId={lesson.id}
      initialData={initialData}
      backUrl={`/admin/courses/${course.id}`}
      apiBaseUrl={`/api/admin/courses/${course.id}/modules/${courseModule.id}/lessons`}
    />
  );
}
