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
    select: { courseId: true },
  });

  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: enrolledCourseIds } },
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
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {asgn.course.title}
                    </span>
                    <span className="text-xs text-rose-600 font-mono font-bold">
                      {new Date(asgn.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{asgn.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{asgn.description}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700 font-mono">
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <strong className="text-slate-900">{asgn.totalMarks} Marks</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <strong className="text-rose-700">{submission ? submission.status : "PENDING"}</strong>
                    </div>
                    {submission?.feedback && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Awarded Marks:</span>
                        <strong className="text-emerald-700">{submission.feedback.marksAwarded} / {asgn.totalMarks}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/student/assignments/${asgn.id}`}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  {submission ? "View Submission & Feedback" : "Submit Assignment"}
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
