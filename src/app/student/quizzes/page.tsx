import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HelpCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default async function StudentQuizzesPage() {
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

  const quizzes = await prisma.quiz.findMany({
    where: {
      courseId: { in: enrolledCourseIds },
      status: "PUBLISHED",
    },
    include: {
      course: { select: { id: true, title: true } },
      questions: { select: { id: true } },
      quizAttempts: {
        where: { userId: studentId },
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-purple-600" /> Course Assessments & Quizzes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Test your knowledge with timed quizzes, view automatic scores, and inspect attempt history.
          </p>
        </div>
      </div>

      {quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((qz) => {
            const latestAttempt = qz.quizAttempts[0];

            return (
              <div
                key={qz.id}
                className="glass-card rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                      {qz.course.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {qz.timeLimitMinutes} Mins
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{qz.title}</h3>
                    {qz.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{qz.description}</p>}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <strong className="text-slate-900">{qz.questions.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Score:</span>
                      <strong className="text-slate-900">{qz.passingScore}%</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {latestAttempt ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-slate-600 font-mono">Last Score:</span>
                      <strong className={latestAttempt.scorePercent >= qz.passingScore ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                        {latestAttempt.scorePercent}% ({latestAttempt.scorePercent >= qz.passingScore ? "Passed" : "Failed"})
                      </strong>
                    </div>
                  ) : null}

                  <Link
                    href={`/student/quizzes/${qz.id}`}
                    className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {latestAttempt ? "Retake Quiz" : "Start Assessment"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No quizzes available for your enrolled courses right now.</p>
        </div>
      )}
    </div>
  );
}
