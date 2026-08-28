import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import HtmlLessonEditor from "@/components/HtmlLessonEditor";

export default async function TrainerLessonEditPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId, moduleId, lessonId } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

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
      include: { resources: true },
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
  };

  return (
    <HtmlLessonEditor
      courseId={course.id}
      courseTitle={course.title}
      moduleId={courseModule.id}
      moduleTitle={courseModule.title}
      lessonId={lesson.id}
      initialData={initialData}
      backUrl={`/trainer/courses/${course.id}`}
      apiBaseUrl={`/api/admin/courses/${course.id}/modules/${courseModule.id}/lessons`}
    />
  );
}
