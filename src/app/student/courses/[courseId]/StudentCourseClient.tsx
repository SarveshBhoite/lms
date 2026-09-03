"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  Play,
  FileText,
  Video,
  Download,
  ExternalLink,
  Code,
  Database,
  HelpCircle,
  FileCheck,
  Clock,
  Loader2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

interface LessonQuiz {
  id: string;
  title: string;
  passingMarks: number;
  timeLimitMinutes: number;
  questions: {
    id: string;
    question: string;
    type?: string;
    marks: number;
    options: { id: string; text: string; orderIndex: number }[];
  }[];
  quizAttempts?: { score: number; isPassed: boolean }[];
}

interface LessonAssignment {
  id: string;
  title: string;
  description: string;
  deadline?: string | null;
  totalMarks: number;
  submissions?: {
    id: string;
    status: string;
    fileName: string;
    fileUrl: string;
    feedback?: { marksAwarded: number; feedbackText: string } | null;
  }[];
}

interface LessonItem {
  id: string;
  title: string;
  contentType: "VIDEO" | "DOCUMENT" | "PDF" | "PPT" | "LINK" | "TEXT" | "CODE" | "DATASET";
  contentUrl?: string | null;
  textContent?: string | null;
  durationMinutes: number;
  order: number;
  quiz?: LessonQuiz | null;
  assignment?: LessonAssignment | null;
}

interface ModuleItem {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: LessonItem[];
}

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  description?: string | null;
}

interface CourseDetailData {
  id: string;
  title: string;
  description: string;
  level: string;
  durationHours: number;
  trainer: { name: string; email: string };
  batch?: { name: string } | null;
  modules: ModuleItem[];
  learningResources: ResourceItem[];
  quizzes: { id: string; title: string; passingMarks: number; timeLimitMinutes: number; lessonId?: string | null }[];
  assignments: { id: string; title: string; deadline?: string | null; totalMarks: number; lessonId?: string | null }[];
  completedLessonIds: string[];
  progressPercent: number;
  lastAccessedLessonId?: string | null;
}

export default function StudentCourseClient({
  initialCourse,
  currentUserId,
}: {
  initialCourse: CourseDetailData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetailData>(initialCourse);
  const [completedIds, setCompletedIds] = useState<string[]>(initialCourse.completedLessonIds);
  const [progressPct, setProgressPct] = useState<number>(initialCourse.progressPercent);

  // Flatten all lessons in order
  const allLessons = course.modules.flatMap((m) => m.lessons);

  // Helper to determine if a lesson is unlocked
  // Rule: Lesson 0 is unlocked. Lesson N is unlocked if Lesson N-1 is in completedIds.
  const isLessonUnlocked = (lessonId: string) => {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return true;
    const prevLesson = allLessons[idx - 1];
    return completedIds.includes(prevLesson.id);
  };

  // Find initial accessible lesson
  const firstUnlocked = allLessons.find((l) => !completedIds.includes(l.id) && isLessonUnlocked(l.id)) || allLessons[0] || null;
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(firstUnlocked);
  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments">("player");
  const [markingComplete, setMarkingComplete] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-Lesson Quiz state
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<string, any>>({});
  const [lessonQuizResult, setLessonQuizResult] = useState<{ score: number; isPassed: boolean } | null>(() => {
    if (activeLesson?.quiz?.quizAttempts?.[0]) {
      return activeLesson.quiz.quizAttempts[0];
    }
    return null;
  });
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // In-Lesson Assignment state
  const [lessonAssignmentUrl, setLessonAssignmentUrl] = useState("");
  const [lessonAssignmentName, setLessonAssignmentName] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [lessonAssignmentSubmission, setLessonAssignmentSubmission] = useState<any | null>(() => {
    return activeLesson?.assignment?.submissions?.[0] || null;
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectLesson = (lesson: LessonItem) => {
    if (!isLessonUnlocked(lesson.id)) {
      showToast("error", "🔒 This lesson is locked. Complete previous lessons first!");
      return;
    }
    setActiveLesson(lesson);
    setLessonQuizAnswers({});
    setLessonQuizResult(lesson.quiz?.quizAttempts?.[0] || null);
    setLessonAssignmentUrl("");
    setLessonAssignmentName("");
    setLessonAssignmentSubmission(lesson.assignment?.submissions?.[0] || null);
  };

  // Submit in-lesson quiz
  const handleLessonQuizSubmit = async (quizId: string) => {
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: lessonQuizAnswers }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit quiz");

      setLessonQuizResult(data.data);
      if (data.data.isPassed) {
        showToast("success", `🎉 Passed! You scored ${data.data.score}%. Lesson requirements updated.`);
        if (activeLesson && !completedIds.includes(activeLesson.id)) {
          // If no assignment or assignment already submitted, mark lesson complete automatically
          if (!activeLesson.assignment || lessonAssignmentSubmission) {
            setCompletedIds((prev) => [...prev, activeLesson.id]);
          }
        }
      } else {
        showToast("error", `Score: ${data.data.score}%. Minimum ${activeLesson?.quiz?.passingMarks}% needed to pass.`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Submit in-lesson assignment
  const handleLessonAssignmentSubmit = async (assignmentId: string) => {
    if (!lessonAssignmentUrl.trim()) {
      showToast("error", "Please provide a project link or file URL");
      return;
    }
    setSubmittingAssignment(true);
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: lessonAssignmentUrl.trim(),
          fileName: lessonAssignmentName.trim() || "lesson_assignment_submission.pdf",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit assignment");

      setLessonAssignmentSubmission(data.data);
      showToast("success", "Project submitted! Requirement satisfied.");
      if (activeLesson && !completedIds.includes(activeLesson.id)) {
        // If no quiz or quiz already passed, mark lesson complete
        if (!activeLesson.quiz || (lessonQuizResult && lessonQuizResult.isPassed)) {
          setCompletedIds((prev) => [...prev, activeLesson.id]);
        }
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit assignment");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleMarkComplete = async (lessonId: string) => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/complete`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to mark complete");

      if (!completedIds.includes(lessonId)) {
        setCompletedIds((prev) => [...prev, lessonId]);
      }
      setProgressPct(data.data.progressPercent);
      showToast("success", "Lesson completed! Next lesson is now unlocked.");

      // Automatically advance to next lesson if available
      const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
      if (currentIdx >= 0 && currentIdx < allLessons.length - 1) {
        selectLesson(allLessons[currentIdx + 1]);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to mark complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
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

      {/* Navigation Top */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-purple-50 text-[#7C248C] border border-purple-200 uppercase">
              {course.level}
            </span>
            <span className="text-slate-500 font-semibold">Instructor: {course.trainer.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{course.title}</h1>
        </div>

        <div className="space-y-1 w-full md:w-64">
          <div className="flex justify-between text-xs font-mono">
            <span>Course Progress:</span>
            <strong className="text-[#7C248C]">{progressPct.toFixed(1)}%</strong>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#7C248C] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progressPct, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* ---------------- NAVIGATION TABS ---------------- */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("player")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "player"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Play className="w-4 h-4" /> Curriculum & Lesson Player
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Download className="w-4 h-4" /> Resources ({course.learningResources.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Standalone Quizzes ({course.quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Standalone Tasks ({course.assignments.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Overview
        </button>
      </div>

      {/* ---------------- TAB 1: PLAYER & LESSONS ---------------- */}
      {activeTab === "player" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video / Content Display Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <div className="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                      {activeLesson.contentType}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{activeLesson.title}</h2>
                  </div>

                  <button
                    onClick={() => handleMarkComplete(activeLesson.id)}
                    disabled={
                      Boolean(
                        markingComplete ||
                        completedIds.includes(activeLesson.id) ||
                        (activeLesson.quiz && (!lessonQuizResult || !lessonQuizResult.isPassed)) ||
                        (activeLesson.assignment && !lessonAssignmentSubmission)
                      )
                    }
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                      completedIds.includes(activeLesson.id)
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : activeLesson.quiz && (!lessonQuizResult || !lessonQuizResult.isPassed)
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : activeLesson.assignment && !lessonAssignmentSubmission
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "jvm-gradient-bg jvm-gradient-hover text-white shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    {markingComplete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : completedIds.includes(activeLesson.id) ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Mark Complete & Continue
                      </>
                    )}
                  </button>
                </div>

                {/* Lesson Player & Content Renderers */}
                <div className="space-y-6">
                  {/* If video lesson */}
                  {activeLesson.contentType === "VIDEO" && activeLesson.contentUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-black">
                      {activeLesson.contentUrl.includes("youtube.com") || activeLesson.contentUrl.includes("youtu.be") ? (
                        <iframe
                          src={activeLesson.contentUrl.replace("watch?v=", "embed/")}
                          className="w-full aspect-video rounded-2xl"
                          allowFullScreen
                        />
                      ) : (
                        <video src={activeLesson.contentUrl} controls className="w-full aspect-video rounded-2xl" />
                      )}
                    </div>
                  )}

                  {/* Rich HTML Content Body */}
                  {activeLesson.textContent ? (
                    <div
                      className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-slate-800 text-sm leading-relaxed prose prose-slate max-w-none shadow-xs"
                      dangerouslySetInnerHTML={{ __html: activeLesson.textContent }}
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                      No textual notes provided for this lesson.
                    </div>
                  )}

                  {/* ---------------- IN-LESSON QUIZ RUNNER ---------------- */}
                  {activeLesson.quiz && (
                    <div className="p-6 rounded-3xl bg-purple-50/70 border border-purple-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-[#7C248C]" />
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Lesson Quiz: {activeLesson.quiz.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white text-[#7C248C] border border-purple-200">
                          Passing Mark: {activeLesson.quiz.passingMarks}%
                        </span>
                      </div>

                      {lessonQuizResult ? (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                          lessonQuizResult.isPassed
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                            : "bg-rose-50 text-rose-900 border-rose-300"
                        }`}>
                          <div className="flex items-center gap-2">
                            {lessonQuizResult.isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            )}
                            <span className="font-bold">
                              {lessonQuizResult.isPassed ? "Assessment Passed!" : "Assessment Not Passed"} (Score: {lessonQuizResult.score}%)
                            </span>
                          </div>
                          {!lessonQuizResult.isPassed && (
                            <button
                              type="button"
                              onClick={() => setLessonQuizResult(null)}
                              className="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-[11px]"
                            >
                              Retake Quiz
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5 bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
                          {activeLesson.quiz.questions.map((q, qIdx) => (
                            <div key={q.id} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0 text-xs">
                              <div className="font-bold text-slate-900 flex justify-between">
                                <span>{qIdx + 1}. {q.question}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{q.marks} pt(s)</span>
                              </div>

                              {q.type === "FILL_IN_BLANK" ? (
                                <input
                                  type="text"
                                  placeholder="Type your answer (case-insensitive)..."
                                  value={lessonQuizAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setLessonQuizAnswers({ ...lessonQuizAnswers, [q.id]: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
                                />
                              ) : q.type === "MULTIPLE_ANSWER" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt) => {
                                    const selected: string[] = Array.isArray(lessonQuizAnswers[q.id])
                                      ? lessonQuizAnswers[q.id]
                                      : [];
                                    const isChecked = selected.includes(opt.id);
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          const next = isChecked
                                            ? selected.filter((id) => id !== opt.id)
                                            : [...selected, opt.id];
                                          setLessonQuizAnswers({ ...lessonQuizAnswers, [q.id]: next });
                                        }}
                                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                                          isChecked
                                            ? "bg-purple-50 border-[#7C248C] font-bold text-slate-900"
                                            : "bg-slate-50 border-slate-200 text-slate-700"
                                        }`}
                                      >
                                        <span>{opt.text}</span>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 text-[#7C248C] pointer-events-none"
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt) => {
                                    const isSelected = lessonQuizAnswers[q.id] === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                          setLessonQuizAnswers({ ...lessonQuizAnswers, [q.id]: opt.id })
                                        }
                                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                                          isSelected
                                            ? "bg-purple-50 border-[#7C248C] font-bold text-slate-900"
                                            : "bg-slate-50 border-slate-200 text-slate-700"
                                        }`}
                                      >
                                        <span>{opt.text}</span>
                                        <input
                                          type="radio"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="w-3.5 h-3.5 text-[#7C248C] pointer-events-none"
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleLessonQuizSubmit(activeLesson.quiz!.id)}
                              disabled={submittingQuiz}
                              className="px-5 py-2.5 rounded-xl bg-[#7C248C] hover:bg-[#681c75] text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50"
                            >
                              {submittingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Submit Quiz & Auto-Evaluate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------------- IN-LESSON ASSIGNMENT SUBMITTER ---------------- */}
                  {activeLesson.assignment && (
                    <div className="p-6 rounded-3xl bg-pink-50/70 border border-pink-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-[#E01E6A]" />
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            Lesson Assignment: {activeLesson.assignment.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white text-[#E01E6A] border border-pink-200">
                          Total Marks: {activeLesson.assignment.totalMarks}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700">{activeLesson.assignment.description}</p>

                      {lessonAssignmentSubmission ? (
                        <div className="p-4 rounded-2xl bg-white border border-pink-200 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Submitted File / URL:
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C248C] border border-purple-200">
                              {lessonAssignmentSubmission.status}
                            </span>
                          </div>
                          <a
                            href={lessonAssignmentSubmission.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#7C248C] font-mono font-semibold underline flex items-center gap-1 text-[11px]"
                          >
                            {lessonAssignmentSubmission.fileName || lessonAssignmentSubmission.fileUrl} <ExternalLink className="w-3 h-3" />
                          </a>
                          {lessonAssignmentSubmission.feedback && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 mt-2">
                              <div className="font-bold text-emerald-900">
                                Grade: {lessonAssignmentSubmission.feedback.marksAwarded} / {activeLesson.assignment.totalMarks}
                              </div>
                              <div className="text-emerald-800 italic">
                                Remarks: "{lessonAssignmentSubmission.feedback.feedbackText}"
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-pink-100 shadow-xs text-xs">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              Project Solution Link / Repository URL / Drive File *
                            </label>
                            <input
                              type="url"
                              required
                              placeholder="https://github.com/... or https://drive.google.com/..."
                              value={lessonAssignmentUrl}
                              onChange={(e) => setLessonAssignmentUrl(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A]"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              File Label / Submission Title (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Lesson_Task_Solution.zip"
                              value={lessonAssignmentName}
                              onChange={(e) => setLessonAssignmentName(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A]"
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleLessonAssignmentSubmit(activeLesson.assignment!.id)}
                              disabled={submittingAssignment}
                              className="px-5 py-2.5 rounded-xl bg-[#E01E6A] hover:bg-[#c4155a] text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50"
                            >
                              {submittingAssignment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Submit Assignment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dedicated Resources specifically assigned to this lesson */}
                  {course.learningResources.filter((r) => r.description?.includes(activeLesson.title)).length > 0 && (
                    <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#7C248C]" />
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase font-mono tracking-wider">
                          Downloadable Assets for this Lesson
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {course.learningResources
                          .filter((r) => r.description?.includes(activeLesson.title))
                          .map((res) => (
                            <a
                              key={res.id}
                              href={res.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-300 flex items-center justify-between gap-2 shadow-xs transition hover:scale-[1.01]"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <FileText className="w-4 h-4 text-[#7C248C] shrink-0" />
                                <span className="text-xs font-bold text-slate-800 truncate">{res.title}</span>
                              </div>
                              <span className="px-2 py-1 rounded-lg jvm-gradient-bg text-white text-[10px] font-bold shrink-0">
                                Download
                              </span>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                Select an unlocked lesson from the curriculum sidebar to begin learning.
              </div>
            )}
          </div>

          {/* Curriculum Sidebar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900">Curriculum & Sequential Path</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {course.modules.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                    {m.title}
                  </div>

                  <div className="space-y-1">
                    {m.lessons.map((l) => {
                      const isSelected = activeLesson?.id === l.id;
                      const isCompleted = completedIds.includes(l.id);
                      const unlocked = isLessonUnlocked(l.id);

                      return (
                        <button
                          key={l.id}
                          onClick={() => selectLesson(l)}
                          disabled={!unlocked}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition ${
                            isSelected
                              ? "bg-purple-50 border-[#7C248C] text-[#7C248C] font-bold shadow-xs"
                              : !unlocked
                              ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                              : isCompleted
                              ? "bg-emerald-50/60 border-emerald-200 text-slate-800 hover:bg-emerald-50"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {!unlocked ? (
                              <span className="text-slate-400 text-xs shrink-0">🔒</span>
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {l.quiz && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-[#7C248C] font-bold">
                                Quiz
                              </span>
                            )}
                            {l.assignment && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-pink-100 text-[#E01E6A] font-bold">
                                Task
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">{l.durationMinutes}m</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: RESOURCES ---------------- */}
      {activeTab === "resources" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Learning Resources & Code Datasets</h2>

          {course.learningResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.learningResources.map((res) => (
                <div key={res.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {res.type}
                    </span>
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      Download <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{res.title}</h3>
                  {res.description && <p className="text-xs text-slate-500">{res.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No learning resources uploaded for this course yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Available Course Quizzes</h2>

          {course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.quizzes.map((qz) => (
                <div key={qz.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500">Passing: {qz.passingMarks}%</span>
                    <span className="text-slate-500">{qz.timeLimitMinutes} Mins</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{qz.title}</h3>

                  <Link
                    href={`/student/quizzes/${qz.id}`}
                    className="block text-center w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs"
                  >
                    Attempt Quiz
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No quizzes configured for this course yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Course Assignments & Tasks</h2>

          {course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.assignments.map((asgn) => (
                <div key={asgn.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-rose-600 font-bold">
                      Deadline: {asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible Deadline"}
                    </span>
                    <span className="text-slate-500">{asgn.totalMarks} Marks</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{asgn.title}</h3>

                  <Link
                    href={`/student/assignments/${asgn.id}`}
                    className="block text-center w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs"
                  >
                    View & Submit Project
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No assignments configured for this course yet.</div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: OVERVIEW ---------------- */}
      {activeTab === "overview" && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Course Syllabus & Details</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
        </div>
      )}
    </div>
  );
}
