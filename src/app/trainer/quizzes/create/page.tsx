"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  HelpCircle,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Clock,
  Award,
  BookOpen,
  Info,
  Check,
  Calculator,
} from "lucide-react";

interface CourseBatchItem {
  id: string;
  name: string;
  status: string;
}

interface CourseItem {
  id: string;
  title: string;
  batches?: CourseBatchItem[];
}

type QuestionType = "MCQ" | "MULTIPLE_ANSWER" | "TRUE_FALSE" | "FILL_IN_BLANK";
type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

interface OptionFormItem {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormItem {
  question: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation: string;
  correctAnswerText: string;
  options: OptionFormItem[];
}

export default function TrainerCreateQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    courseId: preselectedCourseId,
    batchIds: [] as string[],
    title: "",
    description: "",
    timeLimitMinutes: 30,
    passingMarks: 60,
    maxAttempts: 3,
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
  });

  const [questions, setQuestions] = useState<QuestionFormItem[]>([
    {
      question: "",
      type: "MCQ",
      difficulty: "MEDIUM",
      marks: 100,
      explanation: "",
      correctAnswerText: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  // Total Quiz Marks state & Auto-distribution
  const [targetTotalMarks, setTargetTotalMarks] = useState<number>(100);
  const [autoDistributeMarks, setAutoDistributeMarks] = useState<boolean>(true);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to distribute marks equally across questions with remainder handling
  const distributeMarks = (total: number, qs: QuestionFormItem[]): QuestionFormItem[] => {
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
    showToast("success", `Divided ${totalToDistribute} marks across ${questions.length} questions!`);
  };

  useEffect(() => {
    fetch("/api/trainer/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
          if (data.data.length > 0) {
            const initialCourseId = preselectedCourseId && data.data.some((c: CourseItem) => c.id === preselectedCourseId)
              ? preselectedCourseId
              : data.data[0].id;
            setForm((prev) => ({ ...prev, courseId: initialCourseId }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => setLoadingCourses(false));
  }, [preselectedCourseId]);

  // Selected course object
  const selectedCourse = courses.find((c) => c.id === form.courseId);
  const courseBatches = selectedCourse?.batches || [];

  // Toggle batch selection
  const toggleBatch = (batchId: string) => {
    setForm((prev) => {
      const exists = prev.batchIds.includes(batchId);
      return {
        ...prev,
        batchIds: exists ? prev.batchIds.filter((id) => id !== batchId) : [...prev.batchIds, batchId],
      };
    });
  };

  // Add question
  const addQuestion = (type: QuestionType = "MCQ") => {
    let initialOptions: OptionFormItem[] = [];
    if (type === "MCQ") {
      initialOptions = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
    } else if (type === "MULTIPLE_ANSWER") {
      initialOptions = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
    } else if (type === "TRUE_FALSE") {
      initialOptions = [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ];
    }

    const newQ: QuestionFormItem = {
      question: "",
      type,
      difficulty: "MEDIUM",
      marks: Math.max(1, Math.floor(targetTotalMarks / (questions.length + 1))),
      explanation: "",
      correctAnswerText: "",
      options: initialOptions,
    };

    const newQuestions = [...questions, newQ];
    if (autoDistributeMarks) {
      setQuestions(distributeMarks(targetTotalMarks, newQuestions));
    } else {
      setQuestions(newQuestions);
    }
  };

  // Remove question
  const removeQuestion = (qIndex: number) => {
    if (questions.length === 1) {
      showToast("error", "Quiz must contain at least 1 question");
      return;
    }
    const filtered = questions.filter((_, idx) => idx !== qIndex);
    if (autoDistributeMarks) {
      setQuestions(distributeMarks(targetTotalMarks, filtered));
    } else {
      setQuestions(filtered);
    }
  };

  // Change question type
  const handleTypeChange = (qIndex: number, newType: QuestionType) => {
    const newQs = [...questions];
    const q = newQs[qIndex];
    q.type = newType;

    if (newType === "TRUE_FALSE") {
      q.options = [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ];
      q.correctAnswerText = "";
    } else if (newType === "FILL_IN_BLANK") {
      q.options = [];
      q.correctAnswerText = q.correctAnswerText || "";
    } else if (newType === "MULTIPLE_ANSWER") {
      if (q.options.length < 2) {
        q.options = [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ];
      }
      q.correctAnswerText = "";
    } else {
      // MCQ
      if (q.options.length < 2) {
        q.options = [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ];
      } else {
        // Ensure only one is correct
        let hasCorrect = false;
        q.options.forEach((opt, idx) => {
          if (opt.isCorrect && !hasCorrect) {
            hasCorrect = true;
          } else {
            opt.isCorrect = false;
          }
        });
        if (!hasCorrect && q.options.length > 0) {
          q.options[0].isCorrect = true;
        }
      }
      q.correctAnswerText = "";
    }

    setQuestions(newQs);
  };

  // Add option to question
  const addOption = (qIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQs);
  };

  // Remove option from question
  const removeOption = (qIndex: number, optIndex: number) => {
    const newQs = [...questions];
    if (newQs[qIndex].options.length <= 2) {
      showToast("error", "Multiple choice questions require at least 2 options");
      return;
    }
    const wasCorrect = newQs[qIndex].options[optIndex].isCorrect;
    newQs[qIndex].options = newQs[qIndex].options.filter((_, idx) => idx !== optIndex);
    // If we removed the only correct one, set the first option as correct
    if (wasCorrect && !newQs[qIndex].options.some((o) => o.isCorrect) && newQs[qIndex].options.length > 0) {
      newQs[qIndex].options[0].isCorrect = true;
    }
    setQuestions(newQs);
  };

  // Update option text
  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  // Toggle option correct (Single choice for MCQ/TRUE_FALSE, checkbox for MULTIPLE_ANSWER)
  const toggleOptionCorrect = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    const q = newQs[qIndex];

    if (q.type === "MULTIPLE_ANSWER") {
      q.options[oIndex].isCorrect = !q.options[oIndex].isCorrect;
    } else {
      q.options.forEach((opt, idx) => {
        opt.isCorrect = idx === oIndex;
      });
    }

    setQuestions(newQs);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.courseId) {
      showToast("error", "Please select a course for this assessment");
      return;
    }

    if (!form.title.trim()) {
      showToast("error", "Please provide a quiz title");
      return;
    }

    // Validate questions
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
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          showToast("error", `Question ${i + 1} has no correct answer selected`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trainer/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: form.courseId,
          batchIds: form.batchIds,
          title: form.title,
          description: form.description || null,
          timeLimitMinutes: Number(form.timeLimitMinutes),
          passingMarks: Number(form.passingMarks),
          maxAttempts: Number(form.maxAttempts),
          status: form.status,
          questions: questions.map((q) => ({
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            marks: Number(q.marks),
            explanation: q.explanation || null,
            correctAnswerText: q.type === "FILL_IN_BLANK" ? q.correctAnswerText : null,
            options: q.type === "FILL_IN_BLANK" ? [] : q.options,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create quiz");
      }

      showToast("success", `Quiz "${form.title}" created successfully!`);
      setTimeout(() => {
        router.push("/trainer/quizzes");
        router.refresh();
      }, 900);
    } catch (err: any) {
      showToast("error", err.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const totalMarks = questions.reduce((acc, q) => acc + Number(q.marks || 0), 0);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl w-full mx-auto">
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
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Quiz Builder Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                Standalone Assessment
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Create Course Quiz & Assessment
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Build rich questions (MCQ, Multi-Answer, True/False, Fill-in-the-Blank), set limits, and target cohorts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 text-xs font-mono text-slate-700">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Questions</span>
            <strong className="text-[#7C248C] font-extrabold text-sm">{questions.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
            <strong className="text-slate-900 font-extrabold text-sm">{totalMarks}</strong>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Core Configuration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-[#7C248C]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-mono">
              1. Assessment Parameters & Scope
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Target Course *</span>
                <span className="text-[10px] text-slate-400 font-mono">Select curriculum</span>
              </label>
              {loadingCourses ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Loading assigned courses...
                </div>
              ) : (
                <select
                  value={form.courseId}
                  onChange={(e) => {
                    setForm({ ...form, courseId: e.target.value, batchIds: [] });
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quiz Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Quiz Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Term Comprehensive Assessment"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Instructions & Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Provide context, syllabus topics covered, and guidelines for students..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
            />
          </div>

          {/* Numerical Parameters: Total Marks, Duration, Passing Marks, Max Attempts, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#7C248C] font-mono flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Total Marks *
                </label>
              </div>
              <input
                type="number"
                min={questions.length}
                max={1000}
                required
                value={targetTotalMarks}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 0);
                  setTargetTotalMarks(val);
                  if (autoDistributeMarks) {
                    setQuestions(distributeMarks(val, questions));
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-[#7C248C] text-xs font-mono font-black focus:outline-none focus:border-[#7C248C]"
              />
              <div className="flex items-center gap-1 pt-0.5">
                {[20, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTargetTotalMarks(preset);
                      if (autoDistributeMarks) {
                        setQuestions(distributeMarks(preset, questions));
                      }
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono">Time Limit (Mins)</label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono">Passing Mark (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={form.passingMarks}
                onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono">Max Attempts</label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={form.maxAttempts}
                onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono">Publish Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
              >
                <option value="PUBLISHED">Published (Visible)</option>
                <option value="DRAFT">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Batch Scoping Selector */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 block">
                  Cohort Batch Targeting (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Select specific batches to restrict access. If no batches are selected, all students enrolled in this course will have access.
                </p>
              </div>

              {courseBatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (form.batchIds.length === courseBatches.length) {
                      setForm((prev) => ({ ...prev, batchIds: [] }));
                    } else {
                      setForm((prev) => ({ ...prev, batchIds: courseBatches.map((b) => b.id) }));
                    }
                  }}
                  className="text-[11px] font-bold text-[#7C248C] hover:underline"
                >
                  {form.batchIds.length === courseBatches.length ? "Clear All" : "Select All Batches"}
                </button>
              )}
            </div>

            {courseBatches.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {courseBatches.map((b) => {
                  const isSelected = form.batchIds.includes(b.id);
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
                          isSelected ? "bg-[#7C248C] border-[#7C248C] text-white" : "border-slate-300 bg-white"
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
                No cohort batches currently assigned to this course. Quiz will be available to all enrolled students.
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Question Studio */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#7C248C]" /> Question Bank Studio ({questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Add varied question formats with marks, difficulty levels, and solution explanations.
              </p>
            </div>

            {/* Add Question Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => addQuestion("MCQ")}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Single Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion("MULTIPLE_ANSWER")}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Multiple Answer
              </button>
              <button
                type="button"
                onClick={() => addQuestion("TRUE_FALSE")}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> True / False
              </button>
              <button
                type="button"
                onClick={() => addQuestion("FILL_IN_BLANK")}
                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Fill in Blank
              </button>
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
                  <span>Marks Distribution Mode</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold">
                    Target: {targetTotalMarks} Marks
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    (~{(targetTotalMarks / Math.max(1, questions.length)).toFixed(1)} marks / question)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Total marks are split equally across all questions. You can also customize individual question marks below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={autoDistributeMarks}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAutoDistributeMarks(checked);
                    if (checked) {
                      handleApplyMarkDistribution(targetTotalMarks);
                    }
                  }}
                  className="rounded text-[#7C248C] focus:ring-[#7C248C] w-3.5 h-3.5"
                />
                <span>Auto-divide on add/remove</span>
              </label>

              <button
                type="button"
                onClick={() => handleApplyMarkDistribution(targetTotalMarks)}
                className="px-3 py-1.5 rounded-xl bg-[#7C248C] hover:bg-[#681d77] text-white text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Re-divide Equally Now
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5 relative group"
              >
                {/* Header bar of Question */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-purple-100 text-[#7C248C] font-mono font-black text-xs flex items-center justify-center">
                      Q{qIdx + 1}
                    </span>

                    {/* Question Type Selector */}
                    <select
                      value={q.type}
                      onChange={(e) => handleTypeChange(qIdx, e.target.value as QuestionType)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#7C248C]"
                    >
                      <option value="MCQ">Single Choice (MCQ)</option>
                      <option value="MULTIPLE_ANSWER">Multiple Answer (Checkboxes)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_IN_BLANK">Fill in the Blank</option>
                    </select>

                    {/* Difficulty */}
                    <select
                      value={q.difficulty}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[qIdx].difficulty = e.target.value as QuestionDifficulty;
                        setQuestions(newQs);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-400 font-bold">Marks:</span>
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
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Question Prompt *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter question statement or problem scenario..."
                    value={q.question}
                    onChange={(e) => {
                      const newQs = [...questions];
                      newQs[qIdx].question = e.target.value;
                      setQuestions(newQs);
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                  />
                </div>

                {/* Question Options or Text Answer depending on Type */}
                {q.type === "FILL_IN_BLANK" ? (
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/60 space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Expected Correct Answer Text *</span>
                      <span className="text-[10px] text-slate-500 font-mono">Case-insensitive auto-match</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Polymorphism or console.log"
                      value={q.correctAnswerText}
                      onChange={(e) => {
                        const newQs = [...questions];
                        newQs[qIdx].correctAnswerText = e.target.value;
                        setQuestions(newQs);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-purple-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C]"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {q.type === "MULTIPLE_ANSWER"
                          ? "Options (Check all correct solutions):"
                          : "Options (Select the single correct answer):"}
                      </span>

                      {q.type !== "TRUE_FALSE" && (
                        <button
                          type="button"
                          onClick={() => addOption(qIdx)}
                          className="text-[11px] font-bold text-[#7C248C] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Choice
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-2xl border transition flex items-center gap-2.5 ${
                            opt.isCorrect
                              ? "bg-emerald-50/60 border-emerald-300 text-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type={q.type === "MULTIPLE_ANSWER" ? "checkbox" : "radio"}
                            name={`correct-${qIdx}`}
                            checked={opt.isCorrect}
                            onChange={() => toggleOptionCorrect(qIdx, oIdx)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                            title="Mark as correct answer"
                          />

                          <input
                            type="text"
                            required
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt.text}
                            disabled={q.type === "TRUE_FALSE"}
                            onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C]"
                          />

                          {q.type !== "TRUE_FALSE" && q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIdx, oIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation Field */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-600 font-mono">
                    Solution Explanation (Displayed to students after submission)
                  </label>
                  <input
                    type="text"
                    placeholder="Why this answer is correct or context for student revision..."
                    value={q.explanation}
                    onChange={(e) => {
                      const newQs = [...questions];
                      newQs[qIdx].explanation = e.target.value;
                      setQuestions(newQs);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Total Evaluation Questions: <strong className="text-slate-900">{questions.length}</strong> | Cumulative Score:{" "}
            <strong className="text-[#7C248C]">{totalMarks} Marks</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/trainer/quizzes"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Assessment...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Save & Publish Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
