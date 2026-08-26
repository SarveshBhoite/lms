"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";

interface QuestionOptionInput {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionInput {
  question: string;
  type: "MCQ" | "TRUE_FALSE" | "FILL_IN_BLANK";
  marks: number;
  explanation: string;
  options: QuestionOptionInput[];
}

interface QuizItem {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingMarks: number;
  status: string;
  course: { id: string; title: string };
  questions: Array<{ id: string }>;
  quizAttempts: Array<{ id: string }>;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function TrainerQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [passingMarks, setPassingMarks] = useState(60);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      question: "Which hook is used for client-side state in Next.js?",
      type: "MCQ",
      marks: 1,
      explanation: "useState is the primary React hook for state.",
      options: [
        { text: "useState", isCorrect: true, orderIndex: 0 },
        { text: "useServer", isCorrect: false, orderIndex: 1 },
        { text: "useDatabase", isCorrect: false, orderIndex: 2 },
      ],
    },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, courseRes] = await Promise.all([
        fetch("/api/trainer/quizzes"),
        fetch("/api/trainer/courses"),
      ]);

      const quizData = await quizRes.json();
      if (quizData.success && quizData.quizzes) {
        setQuizzes(quizData.quizzes);
      }

      const courseData = await courseRes.json();
      if (courseData.success && courseData.courses) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseData.courses[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "MCQ",
        marks: 1,
        explanation: "",
        options: [
          { text: "Option A", isCorrect: true, orderIndex: 0 },
          { text: "Option B", isCorrect: false, orderIndex: 1 },
        ],
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const sanitizedQuestions = questions.map((q) => ({
        ...q,
        marks: Number(q.marks) || 1,
        options: q.options.filter((o) => o.text.trim().length > 0),
      }));

      const res = await fetch("/api/trainer/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          courseId: selectedCourseId,
          timeLimitMinutes: Number(timeLimit),
          passingMarks: Number(passingMarks),
          questions: sanitizedQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deploy quiz");
      }

      setModalOpen(false);
      setTitle("");
      setDescription("");
      setSuccessMsg(`Quiz "${title}" deployed and saved to database!`);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred while saving the assessment.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete quiz "${quizTitle}"?`)) return;

    try {
      const res = await fetch(`/api/trainer/quizzes?quizId=${quizId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Quiz "${quizTitle}" deleted successfully.`);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete quiz");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to delete quiz.");
      }
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Assessment Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quiz & Assessment Studio</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Build timed multi-choice, true/false, and fill-in-the-blank question banks with instant evaluation.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Assessment Quiz
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
          Loading assessments...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition shadow-xl relative group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {q.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {q.timeLimitMinutes} mins
                    </span>
                    <button
                      onClick={() => handleDeleteQuiz(q.id, q.title)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{q.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{q.description || "Knowledge check assessment."}</p>
                <p className="text-xs text-indigo-300 font-medium font-mono">{q.course.title}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>{q.questions.length} Questions</span>
                <span className="text-emerald-400 font-bold">{q.quizAttempts.length} Attempts Taken</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" /> Build New Question Bank Assessment
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 App Router & Server Actions Exam"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Instructions / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain scoring criteria, passing marks, and time constraints..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Course Track
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Timer Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Question Bank Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    Question Bank Items ({questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].question = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Enter question prompt..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                    />

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">Options (Check the correct answer):</span>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q_${qIdx}_correct`}
                            checked={opt.isCorrect}
                            onChange={() => {
                              const updated = [...questions];
                              updated[qIdx].options.forEach((o, i) => (o.isCorrect = i === optIdx));
                              setQuestions(updated);
                            }}
                            className="accent-emerald-500 cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].options[optIdx].text = e.target.value;
                              setQuestions(updated);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
