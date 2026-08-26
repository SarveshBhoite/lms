import Link from "next/link";
import prisma from "@/lib/prisma";
import { HelpCircle, Clock, Award, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function StudentQuizzesPage() {
  const session = await getSession();

  const [quizzes, attempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { status: "PUBLISHED" },
      include: {
        course: { select: { title: true } },
        questions: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    session?.userId
      ? prisma.quizAttempt.findMany({
          where: { userId: session.userId },
          orderBy: { startedAt: "desc" },
        })
      : [],
  ]);

  const attemptMap = new Map<string, typeof attempts[0]>();
  attempts.forEach((a) => {
    if (!attemptMap.has(a.quizId)) {
      attemptMap.set(a.quizId, a);
    }
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <HelpCircle className="w-3.5 h-3.5" /> Knowledge Assessments
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quizzes & Knowledge Checks</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Validate comprehension across modules, track passing thresholds, and earn evaluation points.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const latestAttempt = attemptMap.get(quiz.id);

          return (
            <div
              key={quiz.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition shadow-xl"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-400 font-bold font-mono truncate">
                    {quiz.course.title}
                  </span>
                  {latestAttempt && (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        latestAttempt.isPassed
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {latestAttempt.isPassed ? "PASSED" : "ATTEMPTED"}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {quiz.description || "Comprehensive assessment covering module architecture, best practices, and code syntax."}
                </p>
              </div>

              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {quiz.timeLimitMinutes} Mins
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Award className="w-3.5 h-3.5 text-emerald-400" /> Pass: {quiz.passingMarks}%
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> {quiz.questions.length} Questions
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Max: {quiz.maxAttempts} Attempts
                  </span>
                </div>

                <Link
                  href={`/student/quizzes/${quiz.id}`}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  {latestAttempt ? "Retake Assessment" : "Take Assessment"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
