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
  Lock,
  ShieldAlert,
  Award,
  ArrowRight,
} from "lucide-react";
import { LessonUnlockStatus } from "@/lib/quizUnlock";

interface LessonItem {
  id: string;
  title: string;
  contentType: "VIDEO" | "DOCUMENT" | "PDF" | "PPT" | "LINK" | "TEXT" | "CODE" | "DATASET";
  contentUrl?: string | null;
  textContent?: string | null;
  durationMinutes: number;
  order: number;
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
  quizzes: { id: string; title: string; passingMarks: number; timeLimitMinutes: number }[];
  assignments: { id: string; title: string; deadline: string; totalMarks: number }[];
  completedLessonIds: string[];
  progressPercent: number;
  lastAccessedLessonId?: string | null;
  unlockStatuses?: Record<string, LessonUnlockStatus>;
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
  const [unlockStatuses, setUnlockStatuses] = useState<Record<string, LessonUnlockStatus>>(
    initialCourse.unlockStatuses || {}
  );

  // Find initial lesson to play (first unlocked or last accessed)
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const defaultLesson =
    allLessons.find((l) => {
      const status = unlockStatuses[l.id];
      return status ? status.isUnlocked && !status.isCompleted : false;
    }) ||
    allLessons.find((l) => l.id === course.lastAccessedLessonId) ||
    allLessons[0] ||
    null;

  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(defaultLesson);
  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments">("player");
  const [markingComplete, setMarkingComplete] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeUnlockStatus = activeLesson ? unlockStatuses[activeLesson.id] : null;
  const isCurrentLessonUnlocked = activeUnlockStatus ? activeUnlockStatus.isUnlocked : true;

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

      // Re-fetch unlock statuses to open up the next lesson
      const unlockRes = await fetch(`/api/student/courses/${course.id}/unlock-status`);
      if (unlockRes.ok) {
        const unlockData = await unlockRes.json();
        if (unlockData.success) {
          setUnlockStatuses(unlockData.data);
        }
      }

      showToast("success", "Lesson marked complete!");
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
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {course.batch?.name || "Enrolled Cohort"}
            </span>
            <span className="text-slate-500">Instructor: {course.trainer.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{course.title}</h1>
        </div>

        <div className="space-y-1 w-full md:w-64">
          <div className="flex justify-between text-xs font-mono">
            <span>Course Progress:</span>
            <strong className="text-indigo-700">{progressPct.toFixed(1)}%</strong>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#7C248C] h-2 rounded-full" style={{ width: `${Math.min(progressPct, 100)}%` }}></div>
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
          <Play className="w-4 h-4" /> Learning Player
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Download className="w-4 h-4" /> Learning Resources ({course.learningResources.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({course.quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Assignments ({course.assignments.length})
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
                    disabled={markingComplete || completedIds.includes(activeLesson.id) || !isCurrentLessonUnlocked}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                      !isCurrentLessonUnlocked
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : completedIds.includes(activeLesson.id)
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : "jvm-gradient-bg jvm-gradient-hover text-white shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    {markingComplete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !isCurrentLessonUnlocked ? (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" /> Locked
                      </>
                    ) : completedIds.includes(activeLesson.id) ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Mark Complete
                      </>
                    )}
                  </button>
                </div>

                {/* LOCKED STATE BANNER */}
                {!isCurrentLessonUnlocked ? (
                  <div className="p-8 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-amber-950 uppercase tracking-wide">
                          Lesson Locked
                        </h3>
                        <p className="text-xs text-amber-800 mt-0.5">
                          {activeUnlockStatus?.lockReason || "Complete the previous lesson and pass its required quiz to unlock."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED LESSON PLAYER CONTENT */
                  <div className="space-y-6">
                    {/* Attached Lesson Quiz Banner */}
                    {activeUnlockStatus?.attachedQuiz && (
                      <div
                        className={`p-5 rounded-2xl border space-y-3 ${
                          activeUnlockStatus.attachedQuiz.isPassed
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                            : activeUnlockStatus.attachedQuiz.userAttemptsCount >= activeUnlockStatus.attachedQuiz.maxAttempts
                            ? "bg-rose-50/80 border-rose-200 text-rose-900"
                            : "bg-purple-50/80 border-purple-200 text-purple-950"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                activeUnlockStatus.attachedQuiz.isPassed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : activeUnlockStatus.attachedQuiz.userAttemptsCount >= activeUnlockStatus.attachedQuiz.maxAttempts
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-purple-100 text-[#7C248C]"
                              }`}
                            >
                              <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-xs uppercase font-mono tracking-wider">
                                  Lesson Quiz: {activeUnlockStatus.attachedQuiz.title}
                                </h4>
                                {activeUnlockStatus.attachedQuiz.isRequiredForUnlock && (
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Required for Next Lesson
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5">
                                Passing Marks: <strong className="font-mono">{activeUnlockStatus.attachedQuiz.passingMarks}%</strong> | Attempts:{" "}
                                <strong className="font-mono">
                                  {activeUnlockStatus.attachedQuiz.userAttemptsCount}/{activeUnlockStatus.attachedQuiz.maxAttempts}
                                </strong>
                                {activeUnlockStatus.attachedQuiz.userBestScore !== null && (
                                  <span>
                                    {" "}
                                    | Best Score: <strong className="font-mono">{activeUnlockStatus.attachedQuiz.userBestScore}%</strong>
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={`/student/quizzes/${activeUnlockStatus.attachedQuiz.id}`}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                              activeUnlockStatus.attachedQuiz.isPassed
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                                : activeUnlockStatus.attachedQuiz.canAttempt
                                ? "jvm-gradient-bg text-white shadow-md hover:scale-[1.02] cursor-pointer"
                                : "bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none"
                            }`}
                          >
                            {activeUnlockStatus.attachedQuiz.isPassed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Passed <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            ) : activeUnlockStatus.attachedQuiz.canAttempt ? (
                              <>
                                Attempt Quiz <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              "Max Attempts Reached"
                            )}
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Video Player */}
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

                    {/* Text Body */}
                    {activeLesson.textContent ? (
                      <div
                        className="p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-slate-800 text-sm leading-relaxed prose prose-slate max-w-none shadow-xs"
                        dangerouslySetInnerHTML={{ __html: activeLesson.textContent }}
                      />
                    ) : !activeLesson.contentUrl ? (
                      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                        No content has been published for this lesson yet.
                      </div>
                    ) : null}

                    {/* Resources */}
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
                )}
              </div>
            ) : (
              <div className="glass-card bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                Select a lesson from the curriculum sidebar to begin learning.
              </div>
            )}
          </div>

          {/* Curriculum Sidebar with Unlock Indicators */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900">Modules & Lessons Stream</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {course.modules.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                    {m.title}
                  </div>

                  <div className="space-y-1">
                    {m.lessons.map((l) => {
                      const isSelected = activeLesson?.id === l.id;
                      const status = unlockStatuses[l.id];
                      const isUnlocked = status ? status.isUnlocked : true;
                      const isCompleted = completedIds.includes(l.id) || Boolean(status?.isCompleted);
                      const hasQuiz = Boolean(status?.attachedQuiz);

                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            if (isUnlocked) setActiveLesson(l);
                          }}
                          disabled={!isUnlocked}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition ${
                            !isUnlocked
                              ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed"
                              : isSelected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {!isUnlocked ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {hasQuiz && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                  status?.attachedQuiz?.isPassed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                Quiz
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
                    <span className="text-rose-600 font-bold">Deadline: {new Date(asgn.deadline).toLocaleDateString()}</span>
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
