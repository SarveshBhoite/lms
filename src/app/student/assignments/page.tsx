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
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Compact Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-pink-50/30 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E01E6A] text-[10px] font-mono font-bold uppercase tracking-wider">
            <FileCheck className="w-3 h-3 text-[#E01E6A]" /> Hands-on Deliverables
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Course Projects & <span className="jvm-gradient-text">Assignments</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Submit project deliverables, track evaluation milestones, and inspect faculty remarks.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-pink-200/80 text-[#E01E6A] shadow-2xs">
            {serialized.length} {serialized.length === 1 ? "Project" : "Projects"}
          </span>
        </div>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}

