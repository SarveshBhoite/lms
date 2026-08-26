import Link from "next/link";
import prisma from "@/lib/prisma";
import { FileText, Clock, Award, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function StudentAssignmentsPage() {
  const session = await getSession();

  const [assignments, submissions] = await Promise.all([
    prisma.assignment.findMany({
      include: {
        course: { select: { title: true } },
      },
      orderBy: { deadline: "asc" },
    }),
    session?.userId
      ? prisma.assignmentSubmission.findMany({
          where: { userId: session.userId },
          include: { feedback: true },
        })
      : [],
  ]);

  const submissionMap = new Map<string, typeof submissions[0]>();
  submissions.forEach((s) => {
    submissionMap.set(s.assignmentId, s);
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5" /> Practical Milestones
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Course Lab Assignments</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Submit capstone project repositories, technical deliverables, and inspect faculty grading feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((asgn) => {
          const submission = submissionMap.get(asgn.id);
          const isSubmitted = Boolean(submission);
          const isEvaluated = submission?.status === "EVALUATED";

          return (
            <div
              key={asgn.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition shadow-xl"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-400 font-bold font-mono truncate">
                    {asgn.course.title}
                  </span>
                  {isSubmitted && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isEvaluated
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isEvaluated ? "GRADED" : "SUBMITTED"}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{asgn.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {asgn.description || "Deploy a production-ready solution satisfying the milestone acceptance criteria."}
                </p>
              </div>

              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono">Total Points:</span>
                    <span className="font-bold text-white font-mono">{asgn.totalMarks} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono">Deadline:</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {new Date(asgn.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {submission?.feedback && (
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Awarded Score:</span>
                      <span>{submission.feedback.marksAwarded} / {asgn.totalMarks}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/student/assignments/${asgn.id}`}
                  className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  {isSubmitted ? "View Submission & Feedback" : "Submit Milestone"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
