import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerAssignmentsClient, { SerializedAssignmentItem } from "./TrainerAssignmentsClient";

export default async function TrainerAssignmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  // Fetch courses assigned to trainer for filter selection
  const courses = await prisma.course.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { trainerId },
            { batches: { some: { trainers: { some: { trainerId } } } } },
          ],
        },
    select: {
      id: true,
      title: true,
      batches: {
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: { title: "asc" },
  });

  // Fetch assignments (both standalone and lesson-linked)
  const assignments = await prisma.assignment.findMany({
    where: {
      ...(isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          }),
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          batches: { select: { id: true, name: true } },
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          module: { select: { title: true } },
        },
      },
      submissions: {
        select: {
          id: true,
          status: true,
          feedback: { select: { marksAwarded: true } },
        },
      },
    },
    orderBy: [
      { createdAt: "desc" },
      { deadline: "desc" },
    ],
  });

  // Map batch names and submission metrics for each assignment
  const serializedAssignments: SerializedAssignmentItem[] = assignments.map((asgn) => {
    const courseBatches = asgn.course.batches || [];
    const batchNames = (asgn.batchIds || []).map((bId) => {
      const match = courseBatches.find((b) => b.id === bId);
      return match ? match.name : bId;
    });

    const evaluatedCount = asgn.submissions.filter((s) => s.status === "EVALUATED").length;
    const pendingCount = asgn.submissions.filter((s) => s.status === "SUBMITTED").length;
    const revisionCount = asgn.submissions.filter((s) => s.status === "RESUBMISSION_REQUESTED").length;

    const evaluatedSubmissions = asgn.submissions.filter(
      (s) => s.status === "EVALUATED" && s.feedback?.marksAwarded !== undefined
    );
    const avgScore =
      evaluatedSubmissions.length > 0
        ? Math.round(
            evaluatedSubmissions.reduce((sum, s) => sum + (s.feedback?.marksAwarded || 0), 0) /
              evaluatedSubmissions.length
          )
        : null;

    return {
      id: asgn.id,
      courseId: asgn.course.id,
      courseTitle: asgn.course.title,
      lessonId: asgn.lessonId,
      lessonTitle: asgn.lesson?.title || null,
      moduleTitle: asgn.lesson?.module?.title || null,
      batchIds: asgn.batchIds,
      batchNames,
      title: asgn.title,
      description: asgn.description,
      instructions: asgn.instructions,
      deadline: asgn.deadline ? asgn.deadline.toISOString() : null,
      totalMarks: asgn.totalMarks,
      allowedFileTypes: asgn.allowedFileTypes,
      maxFileSizeMb: asgn.maxFileSizeMb,
      submissionsCount: asgn.submissions.length,
      evaluatedCount,
      pendingCount,
      revisionCount,
      avgScore,
      createdAt: asgn.createdAt.toISOString(),
    };
  });

  const filterCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <TrainerAssignmentsClient
        initialAssignments={serializedAssignments}
        courses={filterCourses}
      />
    </div>
  );
}
