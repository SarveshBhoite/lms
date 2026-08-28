import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import HtmlLessonEditor from "@/components/HtmlLessonEditor";

export default async function AdminLessonCreatePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    redirect("/login");
  }

  const { id: courseId, moduleId } = await params;

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
      backUrl={`/admin/courses/${course.id}`}
      apiBaseUrl={`/api/admin/courses/${course.id}/modules/${courseModule.id}/lessons`}
    />
  );
}
