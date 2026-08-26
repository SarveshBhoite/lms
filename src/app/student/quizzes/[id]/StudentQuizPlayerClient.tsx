"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Award,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface OptionItem {
  id: string;
  text: string;
  orderIndex: number;
}

interface QuestionItem {
  id: string;
  question: string;
  orderIndex: number;
  options: OptionItem[];
}

interface QuizAttemptItem {
  id: string;
  score: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt?: string | null;
}

interface QuizDetailData {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  course: { id: string; title: string };
  questions: QuestionItem[];
  quizAttempts: QuizAttemptItem[];
}

export default function StudentQuizPlayerClient({
  initialQuiz,
  currentUserId,
}: {
  initialQuiz: QuizDetailData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetailData>(initialQuiz);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> optionId

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(initialQuiz.timeLimitMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!isQuizStarted || attemptResult || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizStarted, attemptResult, timeLeftSeconds]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit quiz");

      setAttemptResult(data.data);
      showToast("success", `Quiz submitted! Score: ${data.data.score}%`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>

      {attemptResult ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Quiz Completed!</h1>
            <p className="text-xs text-slate-500 font-mono">
              Course: {quiz.course.title} • {quiz.title}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-3 font-mono">
            <div className="text-3xl font-black text-slate-900">{attemptResult.score}%</div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                attemptResult.isPassed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {attemptResult.isPassed ? "PASSED" : "FAILED (Passing: " + quiz.passingMarks + "%)"}
            </span>
            <div className="text-xs text-slate-600">
              Correct Answers: {attemptResult.correctCount} / {attemptResult.totalQuestions}
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setAttemptResult(null);
                setIsQuizStarted(false);
                setSelectedAnswers({});
                setTimeLeftSeconds(quiz.timeLimitMinutes * 60);
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>
          </div>
        </div>
      ) : !isQuizStarted ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {quiz.course.title}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
            {quiz.description && <p className="text-xs text-slate-500 max-w-md mx-auto">{quiz.description}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs font-mono text-slate-700">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">TIME LIMIT</span>
              <strong>{quiz.timeLimitMinutes} Mins</strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">QUESTIONS</span>
              <strong>{quiz.questions.length}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">PASS MARKS</span>
              <strong className="text-purple-700">{quiz.passingMarks}%</strong>
            </div>
          </div>

          <button
            onClick={() => setIsQuizStarted(true)}
            className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition"
          >
            Start Quiz Now
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <span className="text-xs font-mono text-slate-600 font-bold">
              Question {currentQuestionIdx + 1} of {quiz.questions.length}
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> Time Left: {formatTime(timeLeftSeconds)}
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900">{currentQuestion.question}</h2>

              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between text-xs font-medium transition ${
                        isSelected
                          ? "bg-purple-50 border-purple-400 text-slate-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{opt.text}</span>
                      <input type="radio" checked={isSelected} onChange={() => {}} className="w-4 h-4 text-purple-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(prev - 1, 0))}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestionIdx < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx((prev) => Math.min(prev + 1, quiz.questions.length - 1))}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
