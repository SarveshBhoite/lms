"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
}

export default function TrainerCreateQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    timeLimitMinutes: 30,
    passingMarks: 60,
    maxAttempts: 3,
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
  });

  const [questions, setQuestions] = useState([
    {
      question: "",
      type: "MCQ",
      difficulty: "MEDIUM",
      marks: 5,
      explanation: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch("/api/trainer/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
          if (data.data.length > 0) {
            setForm((prev) => ({ ...prev, courseId: data.data[0].id }));
          }
        }
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "MCQ",
        difficulty: "MEDIUM",
        marks: 5,
        explanation: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex].text = text;
    setQuestions(newQs);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const newQs = [...questions];
    newQs[qIndex].options.forEach((opt, i) => {
      opt.isCorrect = i === oIndex;
    });
    setQuestions(newQs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.title) {
      showToast("error", "Please fill in course and quiz title");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trainer/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create quiz");

      showToast("success", `Quiz "${form.title}" created successfully!`);
      setTimeout(() => {
        router.push("/trainer/quizzes");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/quizzes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" /> Create Quiz Assessment
          </h1>
          <p className="text-slate-600 text-xs mt-1">Configure quiz parameters and add multiple-choice questions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Course *</label>
              {loadingCourses ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">Loading courses...</div>
              ) : (
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-500 shadow-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Quiz Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. JavaScript Async & Promises Assessment"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Time Limit (Minutes)</label>
              <input
                type="number"
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Passing Score (%)</label>
              <input
                type="number"
                value={form.passingMarks}
                onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Quiz Questions ({questions.length})</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-700 font-mono">Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIdx)} className="text-rose-600 text-xs">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder="Question text..."
                  value={q.question}
                  onChange={(e) => {
                    const newQs = [...questions];
                    newQs[qIdx].question = e.target.value;
                    setQuestions(newQs);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
                />

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIdx, oIdx)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt.text}
                        onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl bg-white border text-xs text-slate-900 shadow-xs ${
                          opt.isCorrect ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save & Publish Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
