import Link from "next/link";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { HelpCircle, Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TrainerQuizzesPage() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const trainerId = session.userId;
  const isAdmin = session.role === "ADMIN";

  const quizzes = await prisma.quiz.findMany({
    where: {
      lessonId: null, // ONLY standalone course/batch quizzes (lesson quizzes are embedded in lessons)
      ...(isAdmin
        ? {}
        : {
            OR: [
              { course: { trainerId } },
              { course: { batches: { some: { trainers: { some: { trainerId } } } } } },
            ],
          }),
    },
    include: {
      course: { select: { title: true } },
      questions: { select: { id: true } },
      quizAttempts: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Quizzes & Assessments</h1>
          <p className="text-slate-600 text-sm mt-1">
            Create, publish, and evaluate quiz assessments for your assigned courses and student cohorts.
          </p>
        </div>

        <Link
          href="/trainer/quizzes/create"
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Create New Quiz
        </Link>
      </div>

      {quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((qz) => (
            <div key={qz.id} className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                    {qz.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{qz.timeLimitMinutes} mins</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#7C248C] font-bold block mb-1">
                    {qz.course.title}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg">{qz.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-100 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Questions</span>
                    <strong className="text-slate-900">{qz.questions.length}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Attempts</span>
                    <strong className="text-[#7C248C]">{qz.quizAttempts.length}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  href={`/trainer/quizzes/${qz.id}/edit`}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition"
                >
                  Edit Quiz
                </Link>
                <Link
                  href={`/trainer/quizzes/${qz.id}/questions`}
                  className="flex-1 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs text-center transition shadow-xs hover:scale-[1.01]"
                >
                  Question Bank
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-sm">No quizzes created under your assigned courses yet.</p>
        </div>
      )}
    </div>
  );
}
