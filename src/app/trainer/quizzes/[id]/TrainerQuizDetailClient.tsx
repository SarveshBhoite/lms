"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  HelpCircle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Edit3,
  Plus,
  Trash2,
  Save,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";

type QuestionType = "MCQ" | "MULTIPLE_ANSWER" | "TRUE_FALSE" | "FILL_IN_BLANK";
type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

interface OptionItem {
  id?: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionItem {
  id?: string;
  question: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation?: string | null;
  correctAnswerText?: string | null;
  orderIndex: number;
  options: OptionItem[];
}

interface AttemptAnswerItem {
  id: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  isCorrect: boolean;
  marksAwarded: number;
  question?: {
    id: string;
    question: string;
    marks: number;
    type: string;
  } | null;
}

interface QuizAttemptDetailItem {
  id: string;
  score: number;
  totalMarks: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSec: number;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: { avatarUrl?: string | null; phone?: string | null } | null;
  };
  answers: AttemptAnswerItem[];
}

interface BatchOption {
  id: string;
  name: string;
  status: string;
}

interface QuizDetailData {
  id: string;
  courseId: string;
  batchIds: string[];
  title: string;
  description: string | null;
  timeLimitMinutes: number;
  passingMarks: number;
  maxAttempts: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  course: {
    id: string;
    title: string;
    batches: BatchOption[];
  };
  questions: QuestionItem[];
  quizAttempts: QuizAttemptDetailItem[];
}

export default function TrainerQuizDetailClient({
  initialQuiz,
}: {
  initialQuiz: QuizDetailData;
}) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetailData>(initialQuiz);
  const [activeTab, setActiveTab] = useState<"questions" | "attempts" | "settings">("questions");

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    title: initialQuiz.title,
    description: initialQuiz.description || "",
    timeLimitMinutes: initialQuiz.timeLimitMinutes,
    passingMarks: initialQuiz.passingMarks,
    maxAttempts: initialQuiz.maxAttempts,
    status: initialQuiz.status,
    batchIds: initialQuiz.batchIds || [],
  });

  // Questions state for editing
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuiz.questions);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  // Search & filter in attempts
  const [attemptSearch, setAttemptSearch] = useState("");
  const [attemptFilter, setAttemptFilter] = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Loading and toasts
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Total Quiz Marks state & Auto-distribution
  const initialMarksSum = initialQuiz.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
  const [targetTotalMarks, setTargetTotalMarks] = useState<number>(initialMarksSum > 0 ? initialMarksSum : 100);
  const [autoDistributeMarks, setAutoDistributeMarks] = useState<boolean>(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to distribute marks equally across questions with remainder handling
  const distributeMarks = (total: number, qs: QuestionItem[]): QuestionItem[] => {
    const count = qs.length;
    if (count === 0) return qs;
    const safeTotal = Math.max(count, total || count);
    const baseMark = Math.floor(safeTotal / count);
    const remainder = safeTotal % count;

    return qs.map((q, idx) => ({
      ...q,
      marks: baseMark + (idx < remainder ? 1 : 0),
    }));
  };

  // Apply distribution immediately
  const handleApplyMarkDistribution = (totalToDistribute = targetTotalMarks) => {
    if (questions.length === 0) return;
    const updated = distributeMarks(totalToDistribute, questions);
    setQuestions(updated);
    setIsEditingQuestions(true);
    showToast("success", `Divided ${totalToDistribute} marks across ${questions.length} questions! Click 'Save Question Bank' to persist.`);
  };

  // KPIs
  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
  const totalAttempts = quiz.quizAttempts.length;
  const passedAttempts = quiz.quizAttempts.filter((a) => a.isPassed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const averageScore =
    totalAttempts > 0
      ? (quiz.quizAttempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts).toFixed(1)
      : "0";

  // Batch toggling in settings
  const toggleBatch = (batchId: string) => {
    setSettingsForm((prev) => {
      const exists = prev.batchIds.includes(batchId);
      return {
        ...prev,
        batchIds: exists ? prev.batchIds.filter((id) => id !== batchId) : [...prev.batchIds, batchId],
      };
    });
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/trainer/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settingsForm.title,
          description: settingsForm.description || null,
          timeLimitMinutes: Number(settingsForm.timeLimitMinutes),
          passingMarks: Number(settingsForm.passingMarks),
          maxAttempts: Number(settingsForm.maxAttempts),
          status: settingsForm.status,
          batchIds: settingsForm.batchIds,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update quiz settings");
      }
      setQuiz((prev) => ({
        ...prev,
        ...data.data,
      }));
      showToast("success", "Quiz settings updated successfully!");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Question to state
  const handleAddQuestion = (type: QuestionType = "MCQ") => {
    let initialOptions: OptionItem[] = [];
    if (type === "MCQ") {
      initialOptions = [
        { text: "", isCorrect: true, orderIndex: 1 },
        { text: "", isCorrect: false, orderIndex: 2 },
        { text: "", isCorrect: false, orderIndex: 3 },
        { text: "", isCorrect: false, orderIndex: 4 },
      ];
    } else if (type === "MULTIPLE_ANSWER") {
      initialOptions = [
        { text: "", isCorrect: true, orderIndex: 1 },
        { text: "", isCorrect: true, orderIndex: 2 },
        { text: "", isCorrect: false, orderIndex: 3 },
        { text: "", isCorrect: false, orderIndex: 4 },
      ];
    } else if (type === "TRUE_FALSE") {
      initialOptions = [
        { text: "True", isCorrect: true, orderIndex: 1 },
        { text: "False", isCorrect: false, orderIndex: 2 },
      ];
    }

    const newQ: QuestionItem = {
      question: "",
      type,
      difficulty: "MEDIUM",
      marks: Math.max(1, Math.floor(targetTotalMarks / (questions.length + 1))),
      explanation: "",
      correctAnswerText: "",
      orderIndex: questions.length + 1,
      options: initialOptions,
    };

    const nextQuestions = [...questions, newQ];
    if (autoDistributeMarks) {
      setQuestions(distributeMarks(targetTotalMarks, nextQuestions));
    } else {
      setQuestions(nextQuestions);
    }
    setIsEditingQuestions(true);
    setEditingQuestionIdx(questions.length);
  };

  // Remove Question
  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      showToast("error", "Quiz must contain at least 1 question");
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    if (autoDistributeMarks) {
      setQuestions(distributeMarks(targetTotalMarks, updated));
    } else {
      setQuestions(updated);
    }
    if (editingQuestionIdx === idx) {
      setEditingQuestionIdx(null);
    } else if (editingQuestionIdx !== null && editingQuestionIdx > idx) {
      setEditingQuestionIdx(editingQuestionIdx - 1);
    }
  };

  // Save All Questions to backend
  const handleSaveQuestions = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showToast("error", `Question ${i + 1} text is empty`);
        return;
      }
      if (q.type === "FILL_IN_BLANK") {
        if (!q.correctAnswerText || !q.correctAnswerText.trim()) {
          showToast("error", `Question ${i + 1} is Fill in the Blank and needs an expected correct answer`);
          return;
        }
      } else {
        if (q.options.length < 2) {
          showToast("error", `Question ${i + 1} needs at least 2 options`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            showToast("error", `Question ${i + 1}, Option ${j + 1} is empty`);
            return;
          }
        }
        if (!q.options.some((o) => o.isCorrect)) {
          showToast("error", `Question ${i + 1} has no correct answer chosen`);
          return;
        }
      }
    }

    setSavingQuestions(true);
    try {
      const res = await fetch(`/api/trainer/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questions.map((q, idx) => ({
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            marks: Number(q.marks),
            explanation: q.explanation || null,
            correctAnswerText: q.type === "FILL_IN_BLANK" ? q.correctAnswerText : null,
            orderIndex: idx + 1,
            options: q.type === "FILL_IN_BLANK" ? [] : q.options.map((opt, oIdx) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              orderIndex: oIdx + 1,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update questions");
      }

      setQuiz((prev) => ({
        ...prev,
        questions: data.data.questions,
      }));
      setQuestions(data.data.questions);
      setIsEditingQuestions(false);
      setEditingQuestionIdx(null);
      showToast("success", "Questions updated & saved successfully!");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save questions");
    } finally {
      setSavingQuestions(false);
    }
  };

  // Filtered attempts
  const filteredAttempts = quiz.quizAttempts.filter((a) => {
    const matchesSearch =
      a.user.name.toLowerCase().includes(attemptSearch.toLowerCase()) ||
      a.user.email.toLowerCase().includes(attemptSearch.toLowerCase());

    const matchesFilter =
      attemptFilter === "ALL" ||
      (attemptFilter === "PASSED" && a.isPassed) ||
      (attemptFilter === "FAILED" && !a.isPassed);

    return matchesSearch && matchesFilter;
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0 mins";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <Link
          href="/trainer/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes Catalog
        </Link>
      </div>

      {/* Compact Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <HelpCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Quiz Management Cockpit
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  quiz.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {quiz.status}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {quiz.title}
            </h1>
            <p className="text-slate-500 text-xs font-mono flex items-center gap-2">
              Course: <strong className="text-slate-800">{quiz.course.title}</strong>
              {quiz.batchIds.length > 0 && (
                <>
                  <span>•</span>
                  <span>Targeting {quiz.batchIds.length} Cohort Batches</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-purple-200/80 text-[#7C248C] shadow-2xs">
            Passing: {quiz.passingMarks}%
          </span>
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            {quiz.timeLimitMinutes} Mins
          </span>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Total Questions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1E2B88]">{totalQuestions}</span>
            <span className="text-[11px] font-mono text-slate-400">{totalMarks} Marks</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Student Attempts
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalAttempts}</span>
            <span className="text-[11px] font-mono text-slate-400">Total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed Count
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{passedAttempts}</span>
            <span className="text-[11px] font-mono text-slate-400">Students</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-600" /> Cohort Pass Rate
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{passRate}%</span>
            <span className="text-[11px] font-mono text-slate-400">Benchmark</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Avg Score
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{averageScore}%</span>
            <span className="text-[11px] font-mono text-slate-400">Across Cohort</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "questions"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#7C248C]" /> Question Bank & Studio ({totalQuestions})
        </button>

        <button
          onClick={() => setActiveTab("attempts")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "attempts"
              ? "border-cyan-600 text-cyan-800 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-600" /> Student Submissions & Scores ({totalAttempts})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "border-[#1E2B88] text-[#1E2B88] bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4 text-[#1E2B88]" /> Quiz Settings & Cohort Batches
        </button>
      </div>

      {/* ---------------- TAB 1: QUESTIONS BANK & EDITOR ---------------- */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#7C248C]" /> Interactive Question Studio
              </h2>
              <p className="text-xs text-slate-500">
                View questions, edit choices inline, add new formats, and sync updates directly.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isEditingQuestions ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions(quiz.questions);
                      setIsEditingQuestions(false);
                      setEditingQuestionIdx(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition"
                  >
                    Cancel Editing
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={savingQuestions}
                    className="px-5 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    {savingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Question Bank
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingQuestions(true)}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Question Bank
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestion("MCQ")}
                    className="px-4 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Auto-distribute Marks Toolbar Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 text-[#7C248C] flex items-center justify-center shrink-0 shadow-2xs">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span>Marks Distribution</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold">
                    Target: {targetTotalMarks} Marks
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    (Current sum: {totalMarks}m • ~{(targetTotalMarks / Math.max(1, questions.length)).toFixed(1)}m / Q)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Evenly divide total marks across all {questions.length} questions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Target:</span>
                <input
                  type="number"
                  min={questions.length}
                  max={1000}
                  value={targetTotalMarks}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 0);
                    setTargetTotalMarks(val);
                    if (autoDistributeMarks) {
                      handleApplyMarkDistribution(val);
                    }
                  }}
                  className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-[#7C248C] bg-purple-50/60 rounded border border-purple-200 focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  {[20, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setTargetTotalMarks(preset);
                        handleApplyMarkDistribution(preset);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                        targetTotalMarks === preset
                          ? "bg-[#7C248C] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyMarkDistribution(targetTotalMarks)}
                className="px-3 py-1.5 rounded-xl bg-[#7C248C] hover:bg-[#681d77] text-white text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Re-divide Equally
              </button>
            </div>
          </div>

          {/* Quick Add Bar when in edit mode */}
          {isEditingQuestions && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#7C248C] font-mono">
                Add New Question Format:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddQuestion("MCQ")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  + Single Choice
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("MULTIPLE_ANSWER")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  + Multiple Answer
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("TRUE_FALSE")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  + True / False
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("FILL_IN_BLANK")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-slate-800 text-xs font-bold transition shadow-2xs"
                >
                  + Fill in Blank
                </button>
              </div>
            </div>
          )}

          {/* Questions Render List */}
          <div className="space-y-5">
            {questions.map((q, qIdx) => {
              const isCardEditing = isEditingQuestions;

              return (
                <div
                  key={qIdx}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 relative"
                >
                  {/* Top Bar of Question Card */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C248C] font-mono font-black text-xs flex items-center justify-center">
                        Q{qIdx + 1}
                      </span>

                      {isCardEditing ? (
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newQs = [...questions];
                            const nType = e.target.value as QuestionType;
                            newQs[qIdx].type = nType;
                            if (nType === "TRUE_FALSE") {
                              newQs[qIdx].options = [
                                { text: "True", isCorrect: true, orderIndex: 1 },
                                { text: "False", isCorrect: false, orderIndex: 2 },
                              ];
                            } else if (nType === "FILL_IN_BLANK") {
                              newQs[qIdx].options = [];
                            } else if (newQs[qIdx].options.length < 2) {
                              newQs[qIdx].options = [
                                { text: "", isCorrect: true, orderIndex: 1 },
                                { text: "", isCorrect: false, orderIndex: 2 },
                              ];
                            }
                            setQuestions(newQs);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
                        >
                          <option value="MCQ">Single Choice</option>
                          <option value="MULTIPLE_ANSWER">Multiple Answer</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="FILL_IN_BLANK">Fill in Blank</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60">
                          {q.type === "MULTIPLE_ANSWER"
                            ? "Multiple Answer"
                            : q.type === "TRUE_FALSE"
                            ? "True / False"
                            : q.type === "FILL_IN_BLANK"
                            ? "Fill in Blank"
                            : "Single Choice (MCQ)"}
                        </span>
                      )}

                      {isCardEditing ? (
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const newQs = [...questions];
                            newQs[qIdx].difficulty = e.target.value as QuestionDifficulty;
                            setQuestions(newQs);
                          }}
                          className="px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-slate-400 font-bold">Marks:</span>
                        {isCardEditing ? (
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.marks}
                            onChange={(e) => {
                              const newQs = [...questions];
                              newQs[qIdx].marks = Number(e.target.value);
                              setQuestions(newQs);
                            }}
                            className="w-14 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold text-center"
                          />
                        ) : (
                          <strong className="text-slate-800">{q.marks}</strong>
                        )}
                      </div>

                      {isCardEditing && questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  {isCardEditing ? (
                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[qIdx].question = e.target.value;
                        setQuestions(newQs);
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C]"
                    />
                  ) : (
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {q.question}
                    </h3>
                  )}

                  {/* Options or Text Answer */}
                  {q.type === "FILL_IN_BLANK" ? (
                    <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/60 space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 block">Expected Text Answer:</span>
                      {isCardEditing ? (
                        <input
                          type="text"
                          value={q.correctAnswerText || ""}
                          onChange={(e) => {
                            const newQs = [...questions];
                            newQs[qIdx].correctAnswerText = e.target.value;
                            setQuestions(newQs);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-slate-900 text-xs"
                        />
                      ) : (
                        <div className="font-mono text-xs text-[#7C248C] font-bold bg-white px-3 py-2 rounded-xl border border-purple-200">
                          {q.correctAnswerText || "No answer text specified"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {isCardEditing && q.type !== "TRUE_FALSE" && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const newQs = [...questions];
                              newQs[qIdx].options.push({
                                text: "",
                                isCorrect: false,
                                orderIndex: newQs[qIdx].options.length + 1,
                              });
                              setQuestions(newQs);
                            }}
                            className="text-[11px] font-bold text-[#7C248C] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Choice
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                              opt.isCorrect
                                ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isCardEditing ? (
                                <input
                                  type={q.type === "MULTIPLE_ANSWER" ? "checkbox" : "radio"}
                                  name={`correct-card-${qIdx}`}
                                  checked={opt.isCorrect}
                                  onChange={() => {
                                    const newQs = [...questions];
                                    if (q.type === "MULTIPLE_ANSWER") {
                                      newQs[qIdx].options[oIdx].isCorrect = !newQs[qIdx].options[oIdx].isCorrect;
                                    } else {
                                      newQs[qIdx].options.forEach((o, i) => {
                                        o.isCorrect = i === oIdx;
                                      });
                                    }
                                    setQuestions(newQs);
                                  }}
                                  className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                                />
                              ) : (
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                    opt.isCorrect ? "bg-emerald-600 text-white" : "border border-slate-300"
                                  }`}
                                >
                                  {opt.isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              )}

                              {isCardEditing ? (
                                <input
                                  type="text"
                                  value={opt.text}
                                  disabled={q.type === "TRUE_FALSE"}
                                  onChange={(e) => {
                                    const newQs = [...questions];
                                    newQs[qIdx].options[oIdx].text = e.target.value;
                                    setQuestions(newQs);
                                  }}
                                  className="flex-1 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium"
                                />
                              ) : (
                                <span className="truncate">{opt.text}</span>
                              )}
                            </div>

                            {isCardEditing && q.type !== "TRUE_FALSE" && q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newQs = [...questions];
                                  newQs[qIdx].options = newQs[qIdx].options.filter((_, i) => i !== oIdx);
                                  setQuestions(newQs);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation Preview */}
                  {(q.explanation || isCardEditing) && (
                    <div className="pt-2 text-xs">
                      {isCardEditing ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">Explanation:</span>
                          <input
                            type="text"
                            placeholder="Explanation for student..."
                            value={q.explanation || ""}
                            onChange={(e) => {
                              const newQs = [...questions];
                              newQs[qIdx].explanation = e.target.value;
                              setQuestions(newQs);
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 font-mono text-[11px] leading-relaxed">
                          <strong className="text-slate-700">Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: STUDENT ATTEMPTS & SCORES ---------------- */}
      {activeTab === "attempts" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" /> Student Assessment Submissions ({quiz.quizAttempts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Detailed record of student scores, completion times, and answers.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or email..."
                  value={attemptSearch}
                  onChange={(e) => setAttemptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <select
                value={attemptFilter}
                onChange={(e) => setAttemptFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
              >
                <option value="ALL">All Results</option>
                <option value="PASSED">Passed Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>

          {filteredAttempts.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-mono">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Submission Date</th>
                      <th className="p-4">Time Spent</th>
                      <th className="p-4">Score (%)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAttempts.map((qa) => {
                      const isExpanded = expandedAttemptId === qa.id;

                      return (
                        <tr key={qa.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{qa.user.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{qa.user.email}</div>
                          </td>

                          <td className="p-4 font-mono text-slate-600">
                            {qa.submittedAt ? new Date(qa.submittedAt).toLocaleString() : "In Progress"}
                          </td>

                          <td className="p-4 font-mono text-slate-600">
                            {formatDuration(qa.timeTakenSec)}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black font-mono text-slate-900 text-sm">
                                {qa.score.toFixed(1)}%
                              </span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    qa.isPassed ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(qa.score, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            {qa.isPassed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> FAILED
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedAttemptId(isExpanded ? null : qa.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition inline-flex items-center gap-1"
                            >
                              {isExpanded ? "Hide Answers" : "View Answers"}
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expanded Attempt Answers Card */}
              {expandedAttemptId && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                  {(() => {
                    const currentAttempt = filteredAttempts.find((a) => a.id === expandedAttemptId);
                    if (!currentAttempt) return null;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
                            Answer Breakdown for {currentAttempt.user.name} ({currentAttempt.score}%)
                          </h4>
                          <span className="text-xs font-mono text-slate-500">
                            {currentAttempt.answers.length} Answers Recorded
                          </span>
                        </div>

                        {currentAttempt.answers.length > 0 ? (
                          <div className="space-y-3">
                            {currentAttempt.answers.map((ans, aIdx) => (
                              <div
                                key={ans.id}
                                className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-800">
                                    Q{aIdx + 1}. {ans.question?.question || "Question"}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                                      ans.isCorrect
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                    }`}
                                  >
                                    {ans.marksAwarded} / {ans.question?.marks || 0} Marks
                                  </span>
                                </div>

                                {ans.textAnswer ? (
                                  <div className="text-xs font-mono text-slate-600 pl-2">
                                    Submitted text: <strong className="text-slate-900">"{ans.textAnswer}"</strong>
                                  </div>
                                ) : (
                                  <div className="text-xs font-mono text-slate-500 pl-2">
                                    Selected Options:{" "}
                                    <strong className="text-slate-800">
                                      {ans.selectedOptionIds.length} option(s) chosen
                                    </strong>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 p-4 text-center">
                            No granular answer log available for this attempt.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No attempts recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once enrolled students take this quiz assessment, their submissions, scores, and timestamps will show up here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: QUIZ SETTINGS & COHORT SCOPING ---------------- */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-4 h-4 text-[#1E2B88]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-mono">
                General Parameters & Cohort Scoping
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Publish Status</label>
                <select
                  value={settingsForm.status}
                  onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
                >
                  <option value="PUBLISHED">Published (Visible to students)</option>
                  <option value="DRAFT">Draft (Hidden from students)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Description & Instructions</label>
              <textarea
                rows={3}
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-mono">Time Limit (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  required
                  value={settingsForm.timeLimitMinutes}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, timeLimitMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-mono">Passing Score (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={settingsForm.passingMarks}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, passingMarks: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-mono">Max Allowed Attempts</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={settingsForm.maxAttempts}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, maxAttempts: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>
            </div>

            {/* Batch Cohort Targeting */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">
                    Assigned Cohort Batches
                  </label>
                  <p className="text-[11px] text-slate-500">
                    If no batches are chosen, this quiz is accessible by all students enrolled in "{quiz.course.title}".
                  </p>
                </div>

                {quiz.course.batches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (settingsForm.batchIds.length === quiz.course.batches.length) {
                        setSettingsForm((prev) => ({ ...prev, batchIds: [] }));
                      } else {
                        setSettingsForm((prev) => ({
                          ...prev,
                          batchIds: quiz.course.batches.map((b) => b.id),
                        }));
                      }
                    }}
                    className="text-[11px] font-bold text-[#7C248C] hover:underline"
                  >
                    {settingsForm.batchIds.length === quiz.course.batches.length
                      ? "Clear All"
                      : "Select All Batches"}
                  </button>
                )}
              </div>

              {quiz.course.batches.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quiz.course.batches.map((b) => {
                    const isSelected = settingsForm.batchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBatch(b.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-purple-50/80 border-[#7C248C] text-[#7C248C] shadow-2xs font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold truncate">{b.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase">{b.status}</div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#7C248C] border-[#7C248C] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
                  No cohort batches currently assigned to this course.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-8 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Quiz Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
