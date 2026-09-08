import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileCheck } from "lucide-react";
import StudentAssignmentsClient from "./StudentAssignmentsClient";

export default async function StudentAssignmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const [batchStudents, userEnrollments] = await Promise.all([
    prisma.batchStudent.findMany({
      where: { userId: studentId },
      select: { batchId: true },
    }),
    prisma.enrollment.findMany({
      where: { userId: studentId, status: "ACTIVE" },
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

  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: enrolledCourseIds },
      lessonId: null, // ONLY standalone assignments
      OR: [
        { batchIds: { isEmpty: true } },
        { batchIds: { hasSome: enrolledBatchIds } },
      ],
    },
    include: {
      course: { select: { id: true, title: true } },
      submissions: {
        where: { userId: studentId },
        include: {
          feedback: { include: { trainer: { select: { name: true } } } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { deadline: "asc" },
  });

  const serialized = assignments.map((asgn) => {
    const submission = asgn.submissions[0];
    return {
      id: asgn.id,
      title: asgn.title,
      description: asgn.description,
      totalMarks: asgn.totalMarks,
      deadline: asgn.deadline ? asgn.deadline.toISOString() : null,
      course: asgn.course,
      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            submittedAt: submission.submittedAt.toISOString(),
            marksAwarded: submission.feedback?.marksAwarded ?? null,
            feedbackText: submission.feedback?.feedbackText ?? null,
          }
        : null,
    };
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-[#E01E6A]" /> Course Assignments & Projects
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Submit your project links and code submissions, track grading status, and view trainer feedback.
          </p>
        </div>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}

