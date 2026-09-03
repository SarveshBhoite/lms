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
  isFinalLesson?: boolean;
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
  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments">("player");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
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
          <BookOpen className="w-4 h-4" /> Course Index & Syllabus
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
          <FileText className="w-4 h-4" /> About Course
        </button>
      </div>

      {/* ---------------- TAB 1: STRUCTURED COURSE INDEX & SYLLABUS ---------------- */}
      {activeTab === "player" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900">Curriculum & Sequential Path</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each lesson unlocks in sequential order. Click on any unlocked lesson to launch the dedicated full-screen study portal.
              </p>
            </div>

            {/* Quick Resume CTA */}
            {allLessons.length > 0 && (
              (() => {
                const nextIncomplete = allLessons.find((l) => !completedIds.includes(l.id) && isLessonUnlocked(l.id));
                const hasFinalLesson = allLessons.some((l) => l.isFinalLesson);
                const allDone = allLessons.length > 0 && completedIds.length >= allLessons.length;

                if (allDone) {
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <span>{hasFinalLesson ? "🎉 Course Fully Completed!" : "✨ Up to Date • More Lessons Coming Soon"}</span>
                    </div>
                  );
                }

                if (nextIncomplete) {
                  return (
                    <Link
                      href={`/student/courses/${course.id}/lessons/${nextIncomplete.id}`}
                      className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition"
                    >
                      <Play className="w-4 h-4 fill-white" /> Continue Learning
                    </Link>
                  );
                }

                return null;
              })()
            )}
          </div>

          <div className="space-y-4">
            {course.modules.map((m, mIdx) => {
              const moduleCompletedCount = m.lessons.filter((l) => completedIds.includes(l.id)).length;
              const isModuleComplete = m.lessons.length > 0 && moduleCompletedCount === m.lessons.length;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3"
                >
                  {/* Module Header Bar */}
                  <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isModuleComplete
                            ? "bg-emerald-600 text-white"
                            : "bg-[#7C248C] text-white"
                        }`}
                      >
                        {isModuleComplete ? "✓" : mIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#7C248C] uppercase tracking-wider">
                            Module {mIdx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">• {m.lessons.length} Lessons</span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base">{m.title}</h3>
                      </div>
                    </div>

                    {/* Module Progress Metric */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {moduleCompletedCount}/{m.lessons.length} Completed
                      </span>
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#7C248C] h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${m.lessons.length > 0 ? (moduleCompletedCount / m.lessons.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lessons List in Module */}
                  <div className="p-4 sm:p-5 divide-y divide-slate-100">
                    {m.lessons.map((l, lIdx) => {
                      const isCompleted = completedIds.includes(l.id);
                      const unlocked = isLessonUnlocked(l.id);

                      return (
                        <div
                          key={l.id}
                          className={`py-3.5 px-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                            !unlocked
                              ? "opacity-60 bg-slate-50/50 cursor-not-allowed"
                              : isCompleted
                              ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                              : "hover:bg-purple-50/40"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                !unlocked
                                  ? "bg-slate-200 text-slate-500"
                                  : isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-purple-100 text-[#7C248C]"
                              }`}
                            >
                              {!unlocked ? (
                                <span className="text-xs">🔒</span>
                              ) : isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">
                                  {mIdx + 1}.{lIdx + 1}
                                </span>
                                <h4
                                  className={`text-sm font-bold ${
                                    !unlocked
                                      ? "text-slate-400"
                                      : isCompleted
                                      ? "text-slate-800"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {l.title}
                                </h4>
                              </div>

                              {/* Progress / Component Badges */}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-slate-400">
                                  {l.durationMinutes} mins
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                                  {l.contentType}
                                </span>

                                {l.quiz && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-[#7C248C] font-bold flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3" /> Quiz: {l.quiz.passingMarks}%
                                  </span>
                                )}

                                {l.assignment && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-100 text-[#E01E6A] font-bold flex items-center gap-1">
                                    <FileCheck className="w-3 h-3" /> Hands-on Task
                                  </span>
                                )}

                                {l.isFinalLesson && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 font-extrabold flex items-center gap-1">
                                    🎓 Final Course Lesson
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0 w-full md:w-auto flex justify-end">
                            {unlocked ? (
                              <Link
                                href={`/student/courses/${course.id}/lessons/${l.id}`}
                                className={`w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                                  isCompleted
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    : "jvm-gradient-bg jvm-gradient-hover text-white shadow-sm hover:scale-[1.02]"
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{isCompleted ? "Review Lesson" : "Launch Lesson"}</span>
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <span>🔒 Locked</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
