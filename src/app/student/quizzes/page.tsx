import Link from "next/link";
import prisma from "@/lib/prisma";
import { HelpCircle, Clock, Award, ArrowRight } from "lucide-react";

export default async function StudentQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    where: { status: "PUBLISHED" },
    include: {
      course: { select: { title: true } },
      questions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Quizzes & Assessments</h1>
        <p className="text-slate-400 text-sm mt-1">Test your mastery across enrolled modules and earn verified milestones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-indigo-400 font-semibold">{quiz.course.title}</div>
              <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> {quiz.timeLimitMinutes} Mins</span>
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-400" /> Pass: {quiz.passingMarks}%</span>
                <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> {quiz.questions.length} Questions</span>
                <span className="text-slate-400 font-mono">Max: {quiz.maxAttempts} tries</span>
              </div>

              <Link
                href={`/student/quizzes/${quiz.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                Take Assessment <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
