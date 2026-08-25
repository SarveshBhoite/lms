import Link from "next/link";
import prisma from "@/lib/prisma";
import { HelpCircle, Clock, Award, Plus } from "lucide-react";

export default async function TrainerQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    include: {
      course: { select: { title: true } },
      questions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Quiz Engine & Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">Design automated assessments, question weights, and passing criteria.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {quiz.status}
              </span>
              <span className="text-xs text-slate-400">{quiz.course.title}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{quiz.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <span>Time: <strong className="text-white">{quiz.timeLimitMinutes}m</strong></span>
              <span>Pass: <strong className="text-emerald-400">{quiz.passingMarks}%</strong></span>
              <span>Questions: <strong className="text-white">{quiz.questions.length}</strong></span>
              <span>Attempts: <strong className="text-white">{quiz.maxAttempts}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
