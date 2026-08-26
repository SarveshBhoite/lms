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
  Database,
  CheckSquare,
  ToggleLeft,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Filter,
  ListOrdered,
} from "lucide-react";

type QuestionCategory = "MCQ" | "MULTIPLE_ANSWER" | "TRUE_FALSE" | "FILL_IN_BLANK";

interface QuestionOptionInput {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionInput {
  question: string;
  type: QuestionCategory;
  marks: number;
  explanation: string;
  options: QuestionOptionInput[];
}

interface QuizOptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  question: string;
  type: string;
  marks: number;
  explanation?: string | null;
  options: QuizOptionItem[];
}

interface QuizItem {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingMarks: number;
  status: string;
  course: { id: string; title: string };
  questions: QuestionItem[];
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
  const [activeTab, setActiveTab] = useState<"QUIZZES" | "QUESTION_BANK">("QUIZZES");
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [bankFilterType, setBankFilterType] = useState<string>("ALL");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [passingMarks, setPassingMarks] = useState(60);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      question: "Which hook is used for client-side state in Next.js / React?",
      type: "MCQ",
      marks: 1,
      explanation: "useState manages isolated component state.",
      options: [
        { text: "useState", isCorrect: true, orderIndex: 0 },
        { text: "useServer", isCorrect: false, orderIndex: 1 },
        { text: "useDatabase", isCorrect: false, orderIndex: 2 },
        { text: "useSQL", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      question: "Which of the following are valid Next.js route handlers? (Multiple-answer)",
      type: "MULTIPLE_ANSWER",
      marks: 2,
      explanation: "GET and POST are supported standard HTTP verbs in Next.js route handlers.",
      options: [
        { text: "GET", isCorrect: true, orderIndex: 0 },
        { text: "POST", isCorrect: true, orderIndex: 1 },
        { text: "QUERY", isCorrect: false, orderIndex: 2 },
        { text: "FETCH", isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      question: "Server components in Next.js execute exclusively on the server runtime.",
      type: "TRUE_FALSE",
      marks: 1,
      explanation: "React Server Components are executed on the Node/Edge server runtime.",
      options: [
        { text: "True", isCorrect: true, orderIndex: 0 },
        { text: "False", isCorrect: false, orderIndex: 1 },
      ],
    },
    {
      question: "The file used to define root layout in Next.js app directory is ________.tsx",
      type: "FILL_IN_BLANK",
      marks: 1,
      explanation: "layout.tsx defines root and nested boundary layouts.",
      options: [{ text: "layout", isCorrect: true, orderIndex: 0 }],
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

  const addQuestion = (type: QuestionCategory = "MCQ") => {
    let defaultOptions: QuestionOptionInput[] = [];

    if (type === "MCQ" || type === "MULTIPLE_ANSWER") {
      defaultOptions = [
        { text: "Option A", isCorrect: true, orderIndex: 0 },
        { text: "Option B", isCorrect: false, orderIndex: 1 },
        { text: "Option C", isCorrect: false, orderIndex: 2 },
        { text: "Option D", isCorrect: false, orderIndex: 3 },
      ];
    } else if (type === "TRUE_FALSE") {
      defaultOptions = [
        { text: "True", isCorrect: true, orderIndex: 0 },
        { text: "False", isCorrect: false, orderIndex: 1 },
      ];
    } else if (type === "FILL_IN_BLANK") {
      defaultOptions = [{ text: "Correct Answer Phrase", isCorrect: true, orderIndex: 0 }];
    }

    setQuestions([
      ...questions,
      {
        question: "",
        type,
        marks: 1,
        explanation: "",
        options: defaultOptions,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleTypeChange = (idx: number, newType: QuestionCategory) => {
    const updated = [...questions];
    updated[idx].type = newType;

    if (newType === "TRUE_FALSE") {
      updated[idx].options = [
        { text: "True", isCorrect: true, orderIndex: 0 },
        { text: "False", isCorrect: false, orderIndex: 1 },
      ];
    } else if (newType === "FILL_IN_BLANK") {
      updated[idx].options = [{ text: "", isCorrect: true, orderIndex: 0 }];
    } else if (updated[idx].options.length < 2) {
      updated[idx].options = [
        { text: "Option A", isCorrect: true, orderIndex: 0 },
        { text: "Option B", isCorrect: false, orderIndex: 1 },
      ];
    }
    setQuestions(updated);
  };

  const addOptionToQuestion = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({
      text: `Option ${String.fromCharCode(65 + updated[qIdx].options.length)}`,
      isCorrect: false,
      orderIndex: updated[qIdx].options.length,
    });
    setQuestions(updated);
  };

  const removeOptionFromQuestion = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 1) return;
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== optIdx);
    setQuestions(updated);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const sanitizedQuestions = questions.map((q) => ({
        question: q.question.trim(),
        type: q.type === "MULTIPLE_ANSWER" ? "MCQ" : q.type, // Maps properly to backend enum
        marks: Number(q.marks) || 1,
        explanation: q.explanation.trim() || undefined,
        options: q.options
          .filter((o) => o.text.trim().length > 0)
          .map((o, i) => ({ ...o, orderIndex: i })),
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
      setSuccessMsg(`Assessment "${title}" published and registered to Question Bank!`);
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

  // Aggregated Question Bank Items across all deployed quizzes
  const allBankQuestions = quizzes.flatMap((q) =>
    q.questions.map((ques) => ({
      ...ques,
      quizTitle: q.title,
      courseTitle: q.course.title,
    }))
  );

  const filteredBankQuestions = allBankQuestions.filter(
    (bq) => bankFilterType === "ALL" || bq.type === bankFilterType
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Assessment & Question Bank Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quizzes & Question Bank
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Build and manage comprehensive question banks with single-choice MCQs, multiple-answer selections, True/False evaluations, and fill-in-the-blank queries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("QUIZZES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                activeTab === "QUIZZES"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 inline mr-1.5" /> Quizzes ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab("QUESTION_BANK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                activeTab === "QUESTION_BANK"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5 inline mr-1.5" /> Question Bank ({allBankQuestions.length})
            </button>
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
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
          Loading assessments & question bank repository...
        </div>
      ) : activeTab === "QUIZZES" ? (
        quizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">No Assessment Quizzes Created Yet</h3>
            <p className="text-xs text-slate-400">
              Click &quot;Create Assessment Quiz&quot; to build your first question bank test.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quizzes.map((q) => {
              const isExpanded = expandedQuizId === q.id;
              const mcqCount = q.questions.filter((ques) => ques.type === "MCQ").length;
              const tfCount = q.questions.filter((ques) => ques.type === "TRUE_FALSE").length;
              const fibCount = q.questions.filter((ques) => ques.type === "FILL_IN_BLANK").length;

              return (
                <div
                  key={q.id}
                  className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-5 hover:border-emerald-500/40 transition shadow-2xl relative group"
                >
                  <div className="space-y-4">
                    {/* Header: Status, Time, Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {q.status}
                        </span>
                        <span className="text-xs text-indigo-300 font-mono font-semibold">
                          {q.course.title}
                        </span>
                      </div>

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

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {q.description || "Comprehensive test assessment from authoring studio."}
                      </p>
                    </div>

                    {/* Question Breakdown Pills: MCQ, Multiple-Answer, True/False, Fill-in-the-blank */}
                    <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[9px] text-slate-400 font-mono uppercase">Total Qs</div>
                        <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {q.questions.length}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[9px] text-slate-400 font-mono uppercase">MCQ / Multi</div>
                        <div className="text-sm font-extrabold text-indigo-300 font-mono mt-0.5">
                          {mcqCount}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[9px] text-slate-400 font-mono uppercase">True/False</div>
                        <div className="text-sm font-extrabold text-cyan-300 font-mono mt-0.5">
                          {tfCount}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[9px] text-slate-400 font-mono uppercase">Fill Blank</div>
                        <div className="text-sm font-extrabold text-amber-300 font-mono mt-0.5">
                          {fibCount}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Question Review Drawer */}
                    {q.questions.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedQuizId(isExpanded ? null : q.id)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center justify-between transition cursor-pointer"
                        >
                          <span>Review Question Items ({q.questions.length})</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 max-h-56 overflow-y-auto">
                            {q.questions.map((ques, idx) => (
                              <div
                                key={ques.id}
                                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-amber-400 font-bold text-[11px]">
                                    Q{idx + 1}. [{ques.type}]
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">{ques.marks} Marks</span>
                                </div>
                                <p className="font-semibold text-white">{ques.question}</p>
                                <div className="space-y-1 pt-1">
                                  {ques.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={`text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded ${
                                        opt.isCorrect
                                          ? "text-emerald-300 bg-emerald-500/10 font-bold"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      <span>{opt.isCorrect ? "✓" : "•"}</span>
                                      <span>{opt.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Award className="w-4 h-4" /> Pass mark: {q.passingMarks}%
                    </span>
                    <span className="text-indigo-300 font-bold">
                      {q.quizAttempts?.length || 0} Student Attempts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* QUESTION BANK REPOSITORY TAB */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono uppercase">Filter by Question Type:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {["ALL", "MCQ", "TRUE_FALSE", "FILL_IN_BLANK"].map((ft) => (
                <button
                  key={ft}
                  onClick={() => setBankFilterType(ft)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                    bankFilterType === ft
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {ft === "ALL" ? "All Formats" : ft}
                </button>
              ))}
            </div>
          </div>

          {filteredBankQuestions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
              <Database className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">No Questions in Selected Filter</h3>
              <p className="text-xs text-slate-400">
                Deploy quizzes above to automatically populate your reusable question bank repository.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBankQuestions.map((bq, i) => (
                <div
                  key={bq.id || i}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-emerald-500/30 transition shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {bq.type}
                    </span>
                    <span className="text-slate-400 font-bold">{bq.marks} Mark(s)</span>
                  </div>

                  <p className="text-sm font-bold text-white">{bq.question}</p>

                  <div className="space-y-1 pt-1 border-t border-slate-850">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Answers:</span>
                    {bq.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`text-xs px-2.5 py-1 rounded-lg flex items-center justify-between ${
                          opt.isCorrect
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold"
                            : "bg-slate-900/60 text-slate-400"
                        }`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && <span className="text-[10px] uppercase font-mono">Correct</span>}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Quiz: {bq.quizTitle}</span>
                    <span>Track: {bq.courseTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assessment Creator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" /> Build Question Bank Assessment
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
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
                  placeholder="e.g. Next.js 15 Full-Stack Comprehensive Exam"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Instructions / Overview
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain scoring criteria, passing marks, and time limits..."
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

              {/* Question Bank Manager & Multi-Format Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    Question Bank Items ({questions.length})
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addQuestion("MCQ")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-emerald-300 font-bold cursor-pointer"
                    >
                      + MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("MULTIPLE_ANSWER")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-indigo-300 font-bold cursor-pointer"
                    >
                      + Multi-Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("TRUE_FALSE")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-cyan-300 font-bold cursor-pointer"
                    >
                      + True/False
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("FILL_IN_BLANK")}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300 font-bold cursor-pointer"
                    >
                      + Fill-in-Blank
                    </button>
                  </div>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">Question #{qIdx + 1}</span>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleTypeChange(qIdx, e.target.value as QuestionCategory)
                          }
                          className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-[11px] font-bold"
                        >
                          <option value="MCQ">MCQ (Single Answer)</option>
                          <option value="MULTIPLE_ANSWER">Multiple-Answer MCQ</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="FILL_IN_BLANK">Fill-in-the-blank</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <span>Marks:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={q.marks}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].marks = Number(e.target.value) || 1;
                              setQuestions(updated);
                            }}
                            className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-white font-mono text-xs"
                          />
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                    />

                    {/* Options Builder depending on question type */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {q.type === "MULTIPLE_ANSWER"
                            ? "Options (Check all correct answers):"
                            : q.type === "MCQ"
                            ? "Options (Select the single correct answer):"
                            : q.type === "TRUE_FALSE"
                            ? "Select True or False as the answer:"
                            : "Correct exact string / keyword answer:"}
                        </span>

                        {(q.type === "MCQ" || q.type === "MULTIPLE_ANSWER") && (
                          <button
                            type="button"
                            onClick={() => addOptionToQuestion(qIdx)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono font-bold cursor-pointer"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>

                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          {q.type === "MULTIPLE_ANSWER" ? (
                            <input
                              type="checkbox"
                              checked={opt.isCorrect}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].options[optIdx].isCorrect = e.target.checked;
                                setQuestions(updated);
                              }}
                              className="accent-indigo-500 cursor-pointer w-4 h-4"
                            />
                          ) : (
                            <input
                              type="radio"
                              name={`q_${qIdx}_correct`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIdx].options.forEach((o, i) => (o.isCorrect = i === optIdx));
                                setQuestions(updated);
                              }}
                              className="accent-emerald-500 cursor-pointer w-4 h-4"
                            />
                          )}

                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].options[optIdx].text = e.target.value;
                              setQuestions(updated);
                            }}
                            placeholder={
                              q.type === "FILL_IN_BLANK"
                                ? "Enter expected answer phrase..."
                                : `Option ${optIdx + 1}`
                            }
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                          />

                          {(q.type === "MCQ" || q.type === "MULTIPLE_ANSWER") &&
                            q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOptionFromQuestion(qIdx, optIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].explanation = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Optional explanation for student feedback after submission..."
                      className="w-full px-3 py-1.5 bg-slate-950/70 border border-slate-850 rounded-lg text-slate-400 text-xs italic"
                    />
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy & Save to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

