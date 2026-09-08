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
  type?: "MCQ" | "MULTIPLE_ANSWER" | "TRUE_FALSE" | "FILL_IN_BLANK";
  difficulty?: string;
  marks?: number;
  explanation?: string | null;
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({}); // questionId -> optionId, array of IDs, or text string

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

  const handleToggleMultipleAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (currentList.includes(optionId)) {
        return { ...prev, [questionId]: currentList.filter((id) => id !== optionId) };
      } else {
        return { ...prev, [questionId]: [...currentList, optionId] };
      }
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: text,
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
      showToast("success", data.data.isPassed ? "Congratulations! You passed the quiz!" : "Quiz completed. Keep practicing!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIdx];

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

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#7C248C] hover:border-purple-200 transition shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Quizzes
        </Link>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-[#7C248C]">
          {quiz.course.title}
        </span>
      </div>

      {attemptResult ? (
        /* ---------------- RESULT CELEBRATION STUDIO CARD ---------------- */
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-white shadow-xl space-y-8 text-center max-w-2xl mx-auto relative overflow-hidden">
          <div
            className={`h-2.5 w-full absolute top-0 left-0 ${
              attemptResult.isPassed ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />

          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-inner ${
              attemptResult.isPassed
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span
              className={`text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full border ${
                attemptResult.isPassed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {attemptResult.isPassed ? "Official Benchmark Cleared" : "Passing Criteria Not Met"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {attemptResult.isPassed ? "🎉 Assessment Passed!" : "Assessment Completed"}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Evaluation Record for: {quiz.title}
            </p>
          </div>

          {/* Score Metric Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200/80 max-w-sm mx-auto space-y-3 font-mono">
            <div className="text-4xl font-black text-slate-900">{attemptResult.score}%</div>
            <div className="text-xs text-slate-600 font-bold">
              Passing Mark Required: {quiz.passingMarks}%
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200/60 flex justify-between">
              <span>Correct Questions:</span>
              <strong className="text-slate-900">{attemptResult.correctCount} / {attemptResult.totalQuestions}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={() => {
                setAttemptResult(null);
                setIsQuizStarted(false);
                setSelectedAnswers({});
                setTimeLeftSeconds(quiz.timeLimitMinutes * 60);
              }}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" /> Retake Evaluation
            </button>
            <Link
              href="/student/quizzes"
              className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 transition"
            >
              Return to Quizzes Catalog
            </Link>
          </div>
        </div>
      ) : !isQuizStarted ? (
        /* ---------------- PRE-START BRIEFING CARD ---------------- */
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-200/90 bg-white shadow-lg space-y-8 text-center max-w-2xl mx-auto overflow-hidden relative">
          <div className="h-2.5 w-full jvm-gradient-bg absolute top-0 left-0" />

          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7C248C] border border-purple-200/60 flex items-center justify-center mx-auto shadow-2xs">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 shadow-2xs">
              Curriculum Knowledge Assessment
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
            {quiz.description ? (
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{quiz.description}</p>
            ) : (
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Objective timed assessment testing conceptual understanding and practical problem-solving logic.
              </p>
            )}
          </div>

          {/* Quick Specs Container */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs font-mono text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">TIME LIMIT</span>
              <strong className="text-slate-900 font-extrabold text-sm">{quiz.timeLimitMinutes} Mins</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">QUESTIONS</span>
              <strong className="text-slate-900 font-extrabold text-sm">{quiz.questions.length}</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">PASSING</span>
              <strong className="text-[#7C248C] font-extrabold text-sm">{quiz.passingMarks}%</strong>
            </div>
          </div>

          <div>
            <button
              onClick={() => setIsQuizStarted(true)}
              className="px-10 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-extrabold text-xs shadow-lg shadow-purple-900/25 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              Begin Timed Assessment Now
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- ACTIVE EXAM STUDIO WORKSPACE ---------------- */
        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-slate-200/90 bg-white shadow-md space-y-6">
          {/* Progress Header Bar */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-600 font-bold">
                Question <strong className="text-slate-900">{currentQuestionIdx + 1}</strong> of {quiz.questions.length}
              </span>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7C248C] font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> Time Remaining: {formatTime(timeLeftSeconds)}
              </div>
            </div>

            {/* Visual Step Progress Track */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="jvm-gradient-bg h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIdx + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.type && (
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 shrink-0 self-start sm:self-auto">
                    {currentQuestion.type === "MULTIPLE_ANSWER"
                      ? "Multiple Answers (Check all that apply)"
                      : currentQuestion.type === "TRUE_FALSE"
                      ? "True / False"
                      : currentQuestion.type === "FILL_IN_BLANK"
                      ? "Fill in the Blank"
                      : "Single Choice (MCQ)"}
                  </span>
                )}
              </div>

              {/* 1. FILL IN THE BLANK */}
              {currentQuestion.type === "FILL_IN_BLANK" ? (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-mono text-slate-500 block font-bold">
                    Type your answer below (case-insensitive):
                  </label>
                  <input
                    type="text"
                    placeholder="Type response here..."
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#7C248C] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition shadow-inner font-medium"
                  />
                </div>
              ) : currentQuestion.type === "MULTIPLE_ANSWER" ? (
                /* 2. MULTIPLE ANSWER (Checkboxes) */
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const currentSelected: string[] = Array.isArray(selectedAnswers[currentQuestion.id])
                      ? selectedAnswers[currentQuestion.id]
                      : [];
                    const isChecked = currentSelected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleMultipleAnswer(currentQuestion.id, opt.id)}
                        className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between text-xs sm:text-sm font-medium transition cursor-pointer ${
                          isChecked
                            ? "bg-purple-50/70 border-[#7C248C] text-slate-900 font-bold shadow-xs scale-[1.005]"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80 hover:border-slate-300"
                        }`}
                      >
                        <span className="pr-4">{opt.text}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#7C248C] accent-[#7C248C] pointer-events-none shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* 3. MCQ & TRUE/FALSE (Single Selection) */
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                        className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between text-xs sm:text-sm font-medium transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-50/70 border-[#7C248C] text-slate-900 font-bold shadow-xs scale-[1.005]"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80 hover:border-slate-300"
                        }`}
                      >
                        <span className="pr-4">{opt.text}</span>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-[#7C248C] accent-[#7C248C] pointer-events-none shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(prev - 1, 0))}
              disabled={currentQuestionIdx === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 transition cursor-pointer"
            >
              Previous Question
            </button>

            {currentQuestionIdx < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx((prev) => Math.min(prev + 1, quiz.questions.length - 1))}
                className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition cursor-pointer"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-700/20 hover:scale-[1.02] transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Responses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit & Auto-Evaluate Quiz
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
