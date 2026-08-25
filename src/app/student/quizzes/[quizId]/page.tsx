"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HelpCircle, Clock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  marks: number;
  explanation?: string;
  options: Option[];
}

export default function StudentQuizRunnerPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const router = useRouter();

  const [quiz, setQuiz] = useState<{ title: string; timeLimitMinutes: number; questions: Question[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Fetch quiz data or default to course assessment questions
    setQuiz({
      title: "Next.js Core Concepts & RBAC Assessment",
      timeLimitMinutes: 20,
      questions: [
        {
          id: "q1",
          question: "By default, in the Next.js App Router, components in the app directory are:",
          marks: 10,
          explanation: "In Next.js App Router, all components are React Server Components (RSC) by default unless marked with 'use client'.",
          options: [
            { id: "opt1", text: "React Server Components (RSC)", isCorrect: true },
            { id: "opt2", text: "Client Components", isCorrect: false },
            { id: "opt3", text: "Static HTML Templates", isCorrect: false },
            { id: "opt4", text: "Web Components", isCorrect: false },
          ],
        },
        {
          id: "q2",
          question: "Which HTTP header is standard for protecting session cookies against cross-site scripting (XSS)?",
          marks: 10,
          explanation: "HttpOnly flags prevent client-side JavaScript from reading the cookie.",
          options: [
            { id: "opt5", text: "HttpOnly", isCorrect: true },
            { id: "opt6", text: "SameSite=Strict only", isCorrect: false },
            { id: "opt7", text: "X-Frame-Options", isCorrect: false },
            { id: "opt8", text: "Secure-Only", isCorrect: false },
          ],
        },
      ],
    });
    setLoading(false);
  }, [quizId]);

  const handleSelect = (questionId: string, optionId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    let earned = 0;
    quiz.questions.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (chosen === correctOpt?.id) {
        earned += q.marks;
      }
    });
    setScore(earned);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> Loading quiz runner...
      </div>
    );
  }

  const totalMarks = quiz?.questions.reduce((acc, q) => acc + q.marks, 0) || 0;

  return (
    <div className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
      <Link href="/student/quizzes" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>

      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{quiz?.title}</h1>
          <p className="text-xs text-slate-400 mt-1">Answer all questions and submit to view instant evaluation.</p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0">
          <Clock className="w-4 h-4" /> 20:00 Mins
        </div>
      </div>

      {/* Results Banner if Submitted */}
      {submitted && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Quiz Evaluated Successfully!</h2>
          <p className="text-sm text-emerald-300">
            You scored <strong className="text-white text-base">{score}</strong> / {totalMarks} Marks ({Math.round((score / totalMarks) * 100)}%)
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {quiz?.questions.map((q, qIndex) => (
          <div key={q.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-semibold text-base text-white">
                <span className="text-indigo-400 mr-2">Q{qIndex + 1}.</span>
                {q.question}
              </h3>
              <span className="text-xs text-slate-400 font-mono shrink-0">{q.marks} pts</span>
            </div>

            <div className="space-y-2 pt-2">
              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q.id] === opt.id;
                let optionStyle = "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800";

                if (isSelected) {
                  optionStyle = "bg-indigo-600/30 border-indigo-500 text-white font-semibold";
                }

                if (submitted) {
                  if (opt.isCorrect) {
                    optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold";
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition flex items-center justify-between ${optionStyle}`}
                  >
                    <span>{opt.text}</span>
                    {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-0.5">Explanation:</span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.01] transition"
        >
          Submit Quiz Answers
        </button>
      )}
    </div>
  );
}
