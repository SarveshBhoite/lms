"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Award,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  question: string;
  type: "MCQ" | "MULTIPLE_ANSWER" | "TRUE_FALSE" | "FILL_BLANK";
  marks: number;
  explanation?: string;
  options: Option[];
}

export default function StudentQuizRunnerPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const router = useRouter();

  const [quizTitle, setQuizTitle] = useState("Automated Assessment");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins

  const [result, setResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
    isPassed: boolean;
    passingMarks: number;
  } | null>(null);

  useEffect(() => {
    // Assessment question bank featuring MCQs, True/False, and Fill-in-the-blanks
    setQuizTitle("Full-Stack Distributed Architecture & Security Assessment");
    setQuestions([
      {
        id: "q1",
        question: "In the Next.js App Router, components inside the app directory are by default rendered as:",
        type: "MCQ",
        marks: 10,
        explanation: "Next.js App Router uses React Server Components (RSC) by default for zero client JS bundle overhead.",
        options: [
          { id: "opt1", text: "React Server Components (RSC)", isCorrect: true },
          { id: "opt2", text: "Client Components", isCorrect: false },
          { id: "opt3", text: "Static HTML Templates", isCorrect: false },
          { id: "opt4", text: "Microfrontends", isCorrect: false },
        ],
      },
      {
        id: "q2",
        question: "Setting the 'HttpOnly' flag on authentication cookies completely prevents client JavaScript from reading session tokens.",
        type: "TRUE_FALSE",
        marks: 10,
        explanation: "True. The HttpOnly flag safeguards authentication cookies against cross-site scripting (XSS) attacks.",
        options: [
          { id: "opt_true", text: "True", isCorrect: true },
          { id: "opt_false", text: "False", isCorrect: false },
        ],
      },
      {
        id: "q3",
        question: "Type the security paradigm that restricts system access to authorized users based on their assigned role:",
        type: "FILL_BLANK",
        marks: 10,
        explanation: "Role-Based Access Control (RBAC) enforces granular authorization based on user roles.",
        options: [
          { id: "ans1", text: "RBAC", isCorrect: true },
          { id: "ans2", text: "Role-Based Access Control", isCorrect: true },
          { id: "ans3", text: "Role Based Access Control", isCorrect: true },
        ],
      },
    ]);
    setLoading(false);
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    if (submitted) return;
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let earned = 0;
      const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

      questions.forEach((q) => {
        if (q.type === "FILL_BLANK") {
          const userVal = (textAnswers[q.id] || "").trim().toLowerCase();
          const isCorrect = q.options.some((opt) => opt.text.trim().toLowerCase() === userVal);
          if (isCorrect) earned += q.marks;
        } else {
          const chosen = selectedAnswers[q.id];
          const correctOpt = q.options.find((o) => o.isCorrect);
          if (chosen === correctOpt?.id) {
            earned += q.marks;
          }
        }
      });

      const percentage = Math.round((earned / totalMarks) * 100);
      setResult({
        score: earned,
        totalMarks,
        percentage,
        isPassed: percentage >= 60,
        passingMarks: 60,
      });
      setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> Loading assessment engine...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
      <Link
        href="/student/quizzes"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-wider block mb-1">
            Automated Knowledge Evaluation
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{quizTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supports MCQs, True/False, and Fill-in-the-blank question formats.
          </p>
        </div>

        <div
          className={`px-4 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-2 shrink-0 ${
            timeLeft < 300
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
              : "bg-amber-500/10 border-amber-500/20 text-amber-300"
          }`}
        >
          <Clock className="w-4 h-4" /> {formatTimer(timeLeft)}
        </div>
      </div>

      {/* Result Card */}
      {submitted && result && (
        <div
          className={`p-8 rounded-3xl border text-center space-y-3 shadow-2xl ${
            result.isPassed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          {result.isPassed ? (
            <Award className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
          ) : (
            <AlertCircle className="w-14 h-14 text-amber-400 mx-auto" />
          )}

          <h2 className="text-2xl font-extrabold text-white">
            {result.isPassed ? "Assessment Passed with Distinction!" : "Assessment Completed"}
          </h2>

          <p className="text-sm">
            Your Final Score: <strong className="text-white text-base">{result.score}</strong> / {result.totalMarks}{" "}
            Marks (<strong className="text-white text-base">{result.percentage}%</strong>) • Pass Mark:{" "}
            {result.passingMarks}%
          </p>

          <div className="pt-2">
            <Link
              href="/student/quizzes"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Return to Quizzes Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-base text-white">
                <span className="text-indigo-400 mr-2 font-mono">Q{qIndex + 1}.</span>
                {q.question}
              </h3>
              <span className="text-xs text-slate-400 font-mono shrink-0 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                {q.marks} pts
              </span>
            </div>

            {/* MCQ & True/False */}
            {q.type !== "FILL_BLANK" ? (
              <div className="space-y-2.5 pt-2">
                {q.options.map((opt) => {
                  const isSelected = selectedAnswers[q.id] === opt.id;
                  let optionStyle = "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800";

                  if (isSelected) {
                    optionStyle = "bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/40";
                  }

                  if (submitted) {
                    if (opt.isCorrect) {
                      optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                    } else if (isSelected && !opt.isCorrect) {
                      optionStyle = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs transition flex items-center justify-between cursor-pointer ${optionStyle}`}
                    >
                      <span>{opt.text}</span>
                      {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Fill-in-the-blank Input */
              <div className="pt-2 space-y-2">
                <input
                  type="text"
                  disabled={submitted}
                  value={textAnswers[q.id] || ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder="Type your exact keyword answer here..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                {submitted && (
                  <div className="text-xs text-emerald-400 font-mono">
                    Acceptable Answer(s): {q.options.map((o) => o.text).join(", ")}
                  </div>
                )}
              </div>
            )}

            {submitted && q.explanation && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                <span className="font-bold text-indigo-300 block mb-1 font-mono uppercase tracking-wider text-[10px]">
                  Evaluation Key:
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Assessment for Auto-Evaluation"}
        </button>
      )}
    </div>
  );
}
