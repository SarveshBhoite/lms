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

  // Find initial lesson to play
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const defaultLesson =
    allLessons.find((l) => l.id === course.lastAccessedLessonId) || allLessons[0] || null;

  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(defaultLesson);
  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments">("player");
  const [markingComplete, setMarkingComplete] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
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
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(progressPct, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("player")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "player"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Play className="w-4 h-4" /> Learning Player
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "resources"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Download className="w-4 h-4" /> Learning Resources ({course.learningResources.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "quizzes"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({course.quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "assignments"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Assignments ({course.assignments.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
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
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {activeLesson.contentType}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{activeLesson.title}</h2>
                  </div>

                  <button
                    onClick={() => handleMarkComplete(activeLesson.id)}
                    disabled={markingComplete || completedIds.includes(activeLesson.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                      completedIds.includes(activeLesson.id)
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
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
                        <CheckCircle2 className="w-4 h-4" /> Mark Complete
                      </>
                    )}
                  </button>
                </div>

                {/* Lesson Player Renderers */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[300px] flex flex-col justify-center items-center">
                  {activeLesson.contentType === "VIDEO" && activeLesson.contentUrl ? (
                    activeLesson.contentUrl.includes("youtube.com") || activeLesson.contentUrl.includes("youtu.be") ? (
                      <iframe
                        src={activeLesson.contentUrl.replace("watch?v=", "embed/")}
                        className="w-full aspect-video rounded-xl"
                        allowFullScreen
                      />
                    ) : (
                      <video src={activeLesson.contentUrl} controls className="w-full aspect-video rounded-xl" />
                    )
                  ) : activeLesson.contentType === "TEXT" && activeLesson.textContent ? (
                    <div className="w-full text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans p-4 bg-white rounded-xl border border-slate-200">
                      {activeLesson.textContent}
                    </div>
                  ) : activeLesson.contentUrl ? (
                    <div className="text-center space-y-3 p-6">
                      <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                      <div className="text-xs text-slate-600">This lesson contains external document / material resource.</div>
                      <a
                        href={activeLesson.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
                      >
                        Open Resource Link <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No content uploaded for this lesson yet.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
                Select a lesson from the curriculum sidebar to begin watching.
              </div>
            )}
          </div>

          {/* Curriculum Sidebar */}
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
                      const isCompleted = completedIds.includes(l.id);

                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveLesson(l)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">{l.durationMinutes}m</span>
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
