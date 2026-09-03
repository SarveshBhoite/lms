"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  HelpCircle,
  FileCheck,
  Download,
  FileText,
  ExternalLink,
  Loader2,
  Check,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

interface LessonOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface LessonQuestion {
  id: string;
  question: string;
  type?: string;
  marks: number;
  options: LessonOption[];
}

interface LessonQuiz {
  id: string;
  title: string;
  description?: string | null;
  passingMarks: number;
  timeLimitMinutes: number;
  questions: LessonQuestion[];
  quizAttempts?: { score: number; isPassed: boolean }[];
}

interface LessonAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string | null;
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

interface CurrentLessonData {
  id: string;
  title: string;
  contentType: "VIDEO" | "DOCUMENT" | "PDF" | "PPT" | "LINK" | "TEXT" | "CODE" | "DATASET";
  contentUrl?: string | null;
  textContent?: string | null;
  durationMinutes: number;
  isFinalLesson?: boolean;
  resources: { id: string; title: string; fileType: string; fileUrl: string }[];
  quiz?: LessonQuiz | null;
  assignment?: LessonAssignment | null;
}

interface CourseModuleNav {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    durationMinutes: number;
    quiz?: { id: string } | null;
    assignment?: { id: string } | null;
  }[];
}

interface StudentLessonPlayerProps {
  course: {
    id: string;
    title: string;
    level: string;
    modules: CourseModuleNav[];
  };
  currentLesson: CurrentLessonData;
  completedLessonIds: string[];
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}

export default function StudentLessonPlayerClient({
  course,
  currentLesson,
  completedLessonIds: initialCompletedIds,
  prevLesson,
  nextLesson,
}: StudentLessonPlayerProps) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompletedIds);
  const isCompleted = completedIds.includes(currentLesson.id);

  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  // In-Lesson Quiz state
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<string, any>>({});
  const [lessonQuizResult, setLessonQuizResult] = useState<{ score: number; isPassed: boolean } | null>(() => {
    return currentLesson.quiz?.quizAttempts?.[0] || null;
  });
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // In-Lesson Assignment state
  const [lessonAssignmentUrl, setLessonAssignmentUrl] = useState("");
  const [lessonAssignmentName, setLessonAssignmentName] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any | null>(() => {
    return currentLesson.assignment?.submissions?.[0] || null;
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Submit Quiz
  const handleQuizSubmit = async (quizId: string) => {
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
        if (!completedIds.includes(currentLesson.id)) {
          if (!currentLesson.assignment || assignmentSubmission) {
            setCompletedIds((prev) => [...prev, currentLesson.id]);
          }
        }
      } else {
        showToast("error", `Score: ${data.data.score}%. Minimum ${currentLesson.quiz?.passingMarks}% needed to pass.`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Submit Assignment
  const handleAssignmentSubmit = async (assignmentId: string) => {
    if (!lessonAssignmentUrl.trim()) {
      showToast("error", "Please provide a solution link or URL");
      return;
    }
    setSubmittingAssignment(true);
    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: lessonAssignmentUrl.trim(),
          fileName: lessonAssignmentName.trim() || "lesson_solution.pdf",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit assignment");

      setAssignmentSubmission(data.data);
      showToast("success", "Project submitted! Requirement satisfied.");
      if (!completedIds.includes(currentLesson.id)) {
        if (!currentLesson.quiz || (lessonQuizResult && lessonQuizResult.isPassed)) {
          setCompletedIds((prev) => [...prev, currentLesson.id]);
        }
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit assignment");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Mark Lesson Complete
  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/student/lessons/${currentLesson.id}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to mark complete");

      if (!completedIds.includes(currentLesson.id)) {
        setCompletedIds((prev) => [...prev, currentLesson.id]);
      }
      showToast("success", "Lesson marked complete! You can now proceed.");

      if (nextLesson) {
        setTimeout(() => {
          router.push(`/student/courses/${course.id}/lessons/${nextLesson.id}`);
        }, 1200);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to mark complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  const isQuizSatisfied = !currentLesson.quiz || (lessonQuizResult && lessonQuizResult.isPassed);
  const isAssignmentSatisfied = !currentLesson.assignment || Boolean(assignmentSubmission);
  const canComplete = !isCompleted && isQuizSatisfied && isAssignmentSatisfied;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
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

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/student/courses/${course.id}`}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Course Index
            </Link>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#7C248C] block">
                {course.title}
              </span>
              <h1 className="text-base font-extrabold text-slate-900 truncate max-w-md sm:max-w-xl">
                {currentLesson.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkComplete}
              disabled={Boolean(markingComplete || isCompleted || !canComplete)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                  : !isQuizSatisfied || !isAssignmentSatisfied
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "jvm-gradient-bg jvm-gradient-hover text-white shadow-md shadow-purple-900/20 hover:scale-[1.02] cursor-pointer"
              }`}
            >
              {markingComplete ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCompleted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Completed
                </>
              ) : !isQuizSatisfied ? (
                <>
                  <HelpCircle className="w-4 h-4" /> Pass Quiz to Unlock
                </>
              ) : !isAssignmentSatisfied ? (
                <>
                  <FileCheck className="w-4 h-4" /> Submit Task to Unlock
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete & Next
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Full Content Reading & Studio Container */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        {/* Requirement Status Banner */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-purple-50 text-[#7C248C] border border-purple-200">
              {currentLesson.contentType}
            </span>
            <span className="font-mono text-slate-500">{currentLesson.durationMinutes} Minutes Reading</span>
          </div>

          <div className="flex items-center gap-3">
            {currentLesson.quiz && (
              <span
                className={`px-3 py-1 rounded-full font-mono font-bold text-[11px] border ${
                  lessonQuizResult?.isPassed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-purple-50 text-[#7C248C] border-purple-200"
                }`}
              >
                {lessonQuizResult?.isPassed ? "✓ Quiz Passed" : `Quiz: ${currentLesson.quiz.passingMarks}% Pass Criteria`}
              </span>
            )}

            {currentLesson.assignment && (
              <span
                className={`px-3 py-1 rounded-full font-mono font-bold text-[11px] border ${
                  assignmentSubmission
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-pink-50 text-[#E01E6A] border-pink-200"
                }`}
              >
                {assignmentSubmission ? "✓ Task Submitted" : "Assignment Required"}
              </span>
            )}

            <span
              className={`px-3 py-1 rounded-full font-bold text-[11px] border ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </span>
          </div>
        </div>

        {/* Video Player (If lesson is a video) */}
        {currentLesson.contentType === "VIDEO" && currentLesson.contentUrl && (
          <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-black">
            {currentLesson.contentUrl.includes("youtube.com") || currentLesson.contentUrl.includes("youtu.be") ? (
              <iframe
                src={currentLesson.contentUrl.replace("watch?v=", "embed/")}
                className="w-full aspect-video rounded-3xl"
                allowFullScreen
              />
            ) : (
              <video src={currentLesson.contentUrl} controls className="w-full aspect-video rounded-3xl" />
            )}
          </div>
        )}

        {/* Rich Lesson Notes HTML Display */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs">
          {currentLesson.textContent ? (
            <div
              className="prose prose-slate max-w-none text-slate-800 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: currentLesson.textContent }}
            />
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No textual notes provided for this lesson.
            </div>
          )}
        </div>

        {/* Downloadable Lesson Resources */}
        {currentLesson.resources.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-[#7C248C]" /> Lesson Downloadable Assets & Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentLesson.resources.map((res) => (
                <a
                  key={res.id}
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/60 rounded-2xl border border-slate-200 hover:border-purple-300 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#7C248C] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">{res.title}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg jvm-gradient-bg text-white text-[10px] font-bold shrink-0">
                    Download
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- IN-LESSON QUIZ SECTION ---------------- */}
        {currentLesson.quiz && (
          <div className="bg-white p-8 rounded-3xl border border-purple-200 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-purple-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C248C] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Lesson Assessment: {currentLesson.quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-evaluated checkpoint. Score $\ge$ {currentLesson.quiz.passingMarks}% to satisfy lesson completion.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                Pass Mark: {currentLesson.quiz.passingMarks}%
              </span>
            </div>

            {lessonQuizResult ? (
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between text-xs ${
                  lessonQuizResult.isPassed
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : "bg-rose-50 text-rose-900 border-rose-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {lessonQuizResult.isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold text-sm">
                      {lessonQuizResult.isPassed ? "Assessment Passed!" : "Assessment Not Passed"}
                    </div>
                    <div className="text-[11px] opacity-80">
                      You scored {lessonQuizResult.score}%. Passing criteria: {currentLesson.quiz.passingMarks}%.
                    </div>
                  </div>
                </div>

                {!lessonQuizResult.isPassed && (
                  <button
                    type="button"
                    onClick={() => setLessonQuizResult(null)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
                  >
                    Retake Assessment
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {currentLesson.quiz.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span className="text-sm">
                        {qIdx + 1}. {q.question}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{q.marks} pt(s)</span>
                    </div>

                    {q.type === "FILL_IN_BLANK" ? (
                      <input
                        type="text"
                        placeholder="Type answer here (case-insensitive)..."
                        value={lessonQuizAnswers[q.id] || ""}
                        onChange={(e) =>
                          setLessonQuizAnswers({ ...lessonQuizAnswers, [q.id]: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:border-[#7C248C]"
                      />
                    ) : q.type === "MULTIPLE_ANSWER" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
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
                              className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                                isChecked
                                  ? "bg-purple-50 border-[#7C248C] font-bold text-slate-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = lessonQuizAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setLessonQuizAnswers({ ...lessonQuizAnswers, [q.id]: opt.id })
                              }
                              className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                                isSelected
                                  ? "bg-purple-50 border-[#7C248C] font-bold text-slate-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    onClick={() => handleQuizSubmit(currentLesson.quiz!.id)}
                    disabled={submittingQuiz}
                    className="px-6 py-3 rounded-xl bg-[#7C248C] hover:bg-[#681c75] text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition"
                  >
                    {submittingQuiz && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Assessment & Auto-Evaluate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- IN-LESSON ASSIGNMENT SECTION ---------------- */}
        {currentLesson.assignment && (
          <div className="bg-white p-8 rounded-3xl border border-pink-200 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-pink-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E01E6A] flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Lesson Hands-on Task: {currentLesson.assignment.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submit your solution repository or drive link to fulfill this requirement.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200">
                {currentLesson.assignment.totalMarks} Marks
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {currentLesson.assignment.description}
            </div>

            {assignmentSubmission ? (
              <div className="p-5 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Submitted Project Solution:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#E01E6A] border border-pink-200">
                    {assignmentSubmission.status}
                  </span>
                </div>
                <a
                  href={assignmentSubmission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#7C248C] font-mono font-semibold underline flex items-center gap-1 text-xs"
                >
                  {assignmentSubmission.fileName || assignmentSubmission.fileUrl} <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {assignmentSubmission.feedback && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 mt-3">
                    <div className="font-bold text-emerald-900">
                      Instructor Grade: {assignmentSubmission.feedback.marksAwarded} / {currentLesson.assignment.totalMarks}
                    </div>
                    <div className="text-emerald-800 italic">
                      Remarks: "{assignmentSubmission.feedback.feedbackText}"
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Project Solution Link / Repository URL / Drive Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/... or https://drive.google.com/..."
                    value={lessonAssignmentUrl}
                    onChange={(e) => setLessonAssignmentUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Submission Title / Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lesson_Task_Solution.zip"
                    value={lessonAssignmentName}
                    onChange={(e) => setLessonAssignmentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A]"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleAssignmentSubmit(currentLesson.assignment!.id)}
                    disabled={submittingAssignment}
                    className="px-6 py-2.5 rounded-xl bg-[#E01E6A] hover:bg-[#c4155a] text-white font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50 transition"
                  >
                    {submittingAssignment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Submit Assignment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Pagination & Navigation */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Previous Lesson Link */}
          {prevLesson ? (
            <Link
              href={`/student/courses/${course.id}/lessons/${prevLesson.id}`}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 font-bold text-xs flex items-center justify-center sm:justify-start gap-2 shadow-xs transition hover:scale-[1.02]"
            >
              <ChevronLeft className="w-4 h-4" /> Previous: {prevLesson.title}
            </Link>
          ) : (
            <div />
          )}

          {/* Center / Right Action Cluster */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Mark Complete Button (Visible when lesson is NOT yet completed) */}
            {!isCompleted && (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={Boolean(markingComplete || !canComplete)}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
                  canComplete
                    ? "jvm-gradient-bg jvm-gradient-hover text-white shadow-purple-900/20 hover:scale-[1.02] cursor-pointer"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                {markingComplete ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !isQuizSatisfied ? (
                  <>
                    <HelpCircle className="w-4 h-4" /> Pass Quiz Above to Mark Complete
                  </>
                ) : !isAssignmentSatisfied ? (
                  <>
                    <FileCheck className="w-4 h-4" /> Submit Task Above to Mark Complete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Mark Lesson Complete
                  </>
                )}
              </button>
            )}

            {/* Next Lesson or Concluding Actions */}
            {nextLesson ? (
              <Link
                href={`/student/courses/${course.id}/lessons/${nextLesson.id}`}
                className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  isCompleted
                    ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20 hover:scale-[1.02]"
                    : "bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none opacity-60"
                }`}
              >
                Next: {nextLesson.title} <ChevronRight className="w-4 h-4" />
              </Link>
            ) : currentLesson.isFinalLesson ? (
              isCompleted && (
                <Link
                  href={`/student/courses/${course.id}`}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition hover:scale-[1.02]"
                >
                  🎉 Course Completed! Return to Index
                </Link>
              )
            ) : (
              isCompleted && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 font-bold hidden md:inline">
                    ✨ Up to Date • More Lessons Coming Soon
                  </span>
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    Return to Syllabus
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
