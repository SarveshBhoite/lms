import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default async function StudentAssignmentsPage() {
  const session = await getSession();
  if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const studentId = session.userId;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId, status: "ACTIVE" },
    select: { courseId: true, batchId: true },
  });

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const enrolledBatchIds = enrollments.map((e) => e.batchId).filter(Boolean) as string[];

  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: enrolledCourseIds },
      lessonId: null, // ONLY standalone assignments, not lesson tasks
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

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-rose-600" /> Course Assignments & Project Work
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Submit your project links and code submissions, track grading status, and view trainer feedback.
          </p>
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asgn) => {
            const submission = asgn.submissions[0];

            return (
              <div
                key={asgn.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200">
                      {asgn.course.title}
                    </span>
                    <span className="text-xs text-[#E01E6A] font-mono font-bold">
                      {asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible Deadline"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{asgn.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{asgn.description}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-700 font-mono">
                    <div className="flex justify-between">
                      <span>Maximum Marks:</span>
                      <strong className="text-slate-900">{asgn.totalMarks} Pts</strong>
                    </div>
                    {submission && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Submission Status:</span>
                        <strong className="text-[#7C248C] font-bold">{submission.status}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/student/assignments/${asgn.id}`}
                  className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submission ? "Review / Resubmit Project" : "Submit Assignment"}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No assignments published for your enrolled courses right now.</p>
        </div>
      )}
    </div>
  );
}
