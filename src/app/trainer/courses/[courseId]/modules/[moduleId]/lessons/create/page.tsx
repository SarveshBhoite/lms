import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import HtmlLessonEditor from "@/components/HtmlLessonEditor";

export default async function TrainerLessonCreatePage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { courseId, moduleId } = await params;
  const isAdmin = session.role === "ADMIN";

  const hasAccess = await verifyTrainerCourseAccess(session.userId, courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  const [course, courseModule] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    }),
    prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true },
    }),
  ]);

  if (!course || !courseModule) {
    notFound();
  }

  return (
    <HtmlLessonEditor
      courseId={course.id}
      courseTitle={course.title}
      moduleId={courseModule.id}
      moduleTitle={courseModule.title}
      backUrl={`/trainer/courses/${course.id}`}
      apiBaseUrl={`/api/admin/courses/${course.id}/modules/${courseModule.id}/lessons`}
    />
  );
}
