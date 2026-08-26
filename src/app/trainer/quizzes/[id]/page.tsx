import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTrainerCourseAccess } from "@/lib/rbac";
import { ChevronLeft, HelpCircle, Users, CheckCircle2, XCircle } from "lucide-react";
import { redirect, notFound } from "next/navigation";

export default async function TrainerQuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const { id } = await params;
  const isAdmin = session.role === "ADMIN";

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        include: { options: true },
        orderBy: { orderIndex: "asc" },
      },
      quizAttempts: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  const hasAccess = await verifyTrainerCourseAccess(session.userId, quiz.courseId, isAdmin);
  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {quiz.status}
          </span>
          <span className="text-xs text-slate-500 font-mono">Passing Score: {quiz.passingMarks}%</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
        <p className="text-xs text-slate-600">Course: <span className="text-purple-700 font-bold">{quiz.course.title}</span></p>
      </div>

      {/* Quiz Questions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Quiz Questions ({quiz.questions.length})</h2>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                Q{idx + 1}. {q.question} <span className="text-xs text-slate-500 font-mono">({q.marks} Marks)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2 rounded-xl border text-xs font-mono ${
                      opt.isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {opt.text} {opt.isCorrect && "✓"}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Attempts Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Student Quiz Attempts ({quiz.quizAttempts.length})</h2>

        {quiz.quizAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Score (%)</th>
                  <th className="p-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quiz.quizAttempts.map((qa) => (
                  <tr key={qa.id}>
                    <td className="p-4 font-bold text-slate-900">{qa.user.name}</td>
                    <td className="p-4 font-mono text-slate-500">{qa.submittedAt ? new Date(qa.submittedAt).toLocaleString() : "In Progress"}</td>
                    <td className="p-4 font-bold font-mono text-slate-900">{qa.score.toFixed(1)}%</td>
                    <td className="p-4">
                      {qa.isPassed ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> PASSED</span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1"><XCircle className="w-4 h-4 text-rose-600" /> FAILED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">No attempts recorded for this quiz yet.</div>
        )}
      </div>
    </div>
  );
}
