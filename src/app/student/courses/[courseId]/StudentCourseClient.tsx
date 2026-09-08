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
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";

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
  liveClasses?: {
    id: string;
    title: string;
    description?: string | null;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    lateCutoffMinutes: number;
    meetUrl?: string | null;
    recordingUrl?: string | null;
    status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
    trainer: { name: string; email: string };
    attendances: { id: string; status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT"; isApproved: boolean }[];
  }[];
  completedLessonIds: string[];
  progressPercent: number;
  lastAccessedLessonId?: string | null;
  certificate?: {
    id: string;
    certificateNumber: string;
    issueDate: string;
    qrCodeUrl?: string | null;
  } | null;
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
  const [certificate, setCertificate] = useState<any | null>(initialCourse.certificate || null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  // Flatten all lessons in order
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const hasFinalLesson = allLessons.some((l) => l.isFinalLesson);
  const allDone = allLessons.length > 0 && completedIds.length >= allLessons.length;
  const isCourseComplete100 = hasFinalLesson && allDone;

  // Helper to determine if a lesson is unlocked
  // Rule: Lesson 0 is unlocked. Lesson N is unlocked if Lesson N-1 is in completedIds.
  const isLessonUnlocked = (lessonId: string) => {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return true;
    const prevLesson = allLessons[idx - 1];
    return completedIds.includes(prevLesson.id);
  };

  const handleGenerateCertificate = async () => {
    if (!isCourseComplete100) return;
    setGeneratingCertificate(true);
    try {
      const res = await fetch("/api/student/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate certificate");

      setCertificate(data.data);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast("success", "🎉 Certificate issued! Click View Certificate to inspect or download.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to generate certificate");
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Find initial accessible lesson
  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments" | "liveClasses">("player");
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="space-y-1 w-full sm:w-48">
            <div className="flex justify-between text-xs font-mono">
              <span>Course Progress:</span>
              <strong className="text-[#7C248C]">{progressPct.toFixed(1)}%</strong>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#7C248C] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progressPct, 100)}%` }}></div>
            </div>
          </div>

          {/* Top Banner Certificate Button if 100% completed */}
          {hasFinalLesson && isCourseComplete100 && (
            <div>
              {certificate ? (
                <Link
                  href={`/verify/certificate/${certificate.certificateNumber || certificate.id}`}
                  className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition whitespace-nowrap"
                >
                  <Award className="w-4 h-4" /> View Certificate
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateCertificate}
                  disabled={generatingCertificate}
                  className="px-4 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition whitespace-nowrap cursor-pointer"
                >
                  {generatingCertificate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )}
                  <span>Generate Certificate</span>
                </button>
              )}
            </div>
          )}
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
          onClick={() => setActiveTab("liveClasses")}
          className={`px-5 py-3 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "liveClasses"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/60 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Video className="w-4 h-4" /> Live Classes ({(course.liveClasses || []).length})
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

            {/* Quick Resume / Certificate Top CTA */}
            {allLessons.length > 0 && (
              (() => {
                const nextIncomplete = allLessons.find((l) => !completedIds.includes(l.id) && isLessonUnlocked(l.id));

                if (isCourseComplete100) {
                  return (
                    <div className="flex items-center gap-2.5">
                      {certificate ? (
                        <Link
                          href={`/verify/certificate/${certificate.certificateNumber || certificate.id}`}
                          className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition"
                        >
                          <Award className="w-4 h-4" /> View Certificate
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerateCertificate}
                          disabled={generatingCertificate}
                          className="px-5 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition cursor-pointer"
                        >
                          {generatingCertificate ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )}
                          <span>Generate Certificate</span>
                        </button>
                      )}
                    </div>
                  );
                }

                if (allDone) {
                  return (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <span>✨ Up to Date • More Lessons Coming Soon</span>
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

          {/* ---------------- FINAL COURSE COMPLETION & CERTIFICATE MODULE ---------------- */}
          {hasFinalLesson && (
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
                certificate
                  ? "bg-gradient-to-br from-purple-50 via-white to-pink-50 border-purple-200 shadow-md shadow-purple-900/10"
                  : isCourseComplete100
                  ? "bg-gradient-to-br from-emerald-50 via-white to-purple-50 border-emerald-300 shadow-md shadow-emerald-900/10"
                  : "bg-slate-50 border-slate-200 opacity-85"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                      certificate
                        ? "bg-purple-100 text-[#7C248C] border-purple-200 shadow-inner"
                        : isCourseComplete100
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-inner animate-bounce"
                        : "bg-slate-200 text-slate-400 border-slate-300"
                    }`}
                  >
                    <Award className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] border border-purple-200">
                        Official Academic Credential
                      </span>
                      {certificate && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {certificate.certificateNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {certificate
                        ? "Official Course Certificate Issued"
                        : isCourseComplete100
                        ? "🎉 Course Completed! Claim Your Certificate"
                        : "Official Course Completion Certificate"}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xl">
                      {certificate
                        ? `Issued on ${new Date(certificate.issueDate).toLocaleDateString()}. Includes tamper-proof QR code and official digital verification.`
                        : isCourseComplete100
                        ? "You have successfully finished 100% of curriculum modules and met all passing requirements. Click below to generate your official certificate."
                        : `Complete 100% of all lessons, quizzes, and tasks (${completedIds.length}/${allLessons.length} done) to unlock and generate your accredited certificate.`}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {certificate ? (
                    <Link
                      href={`/verify/certificate/${certificate.certificateNumber || certificate.id}`}
                      className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition"
                    >
                      <Award className="w-4 h-4" /> View & Download Certificate
                    </Link>
                  ) : isCourseComplete100 ? (
                    <button
                      type="button"
                      onClick={handleGenerateCertificate}
                      disabled={generatingCertificate}
                      className="px-6 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/25 hover:scale-[1.03] active:scale-[0.98] transition cursor-pointer"
                    >
                      {generatingCertificate ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating Certificate...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" /> Generate Certificate Now
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                      <span>🔒 Locked (Complete 100% of Lessons)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

      {/* ---------------- TAB 2: LIVE CLASSES ---------------- */}
      {activeTab === "liveClasses" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Live Interactive Classes</h2>
              <p className="text-xs text-slate-500">
                Join live Google Meet sessions scheduled for this course and access class recordings.
              </p>
            </div>
          </div>

          {(course.liveClasses || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.liveClasses?.map((lc) => {
                const userAtt = lc.attendances?.[0];
                const startTimeMs = new Date(lc.startTime).getTime();
                const diffToStart = startTimeMs - Date.now();
                const isCompleted = lc.status === "COMPLETED";
                const isLive = lc.status === "LIVE" || (!isCompleted && diffToStart <= 10 * 60 * 1000);

                return (
                  <div key={lc.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isLive
                              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                              : isCompleted
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-purple-50 text-[#7C248C] border-purple-200"
                          }`}
                        >
                          {isLive ? "LIVE NOW" : isCompleted ? "COMPLETED" : "UPCOMING"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(lc.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{lc.title}</h3>
                        {lc.description && <p className="text-xs text-slate-500 mt-0.5">{lc.description}</p>}
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 text-xs font-mono space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Scheduled Time:</span>
                          <strong className="text-slate-900">
                            {new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Instructor:</span>
                          <strong className="text-[#7C248C]">{lc.trainer?.name}</strong>
                        </div>
                      </div>

                      {userAtt && (
                        <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-purple-50/50 border border-purple-100 font-mono">
                          <span className="text-slate-500">My Attendance:</span>
                          <span className="font-bold text-purple-700">
                            {userAtt.status} ({userAtt.isApproved ? "✓ Verified" : "⏳ Pending"})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      {isLive ? (
                        <Link
                          href="/student/live-classes"
                          className="w-full py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                        >
                          <Video className="w-3.5 h-3.5" /> Launch Class Portal & Check In
                        </Link>
                      ) : isCompleted && lc.recordingUrl ? (
                        <a
                          href={lc.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Video className="w-3.5 h-3.5" /> Watch Recording <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href="/student/live-classes"
                          className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Clock className="w-3.5 h-3.5" /> View Class Details
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No live classes scheduled for this course yet.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: RESOURCES ---------------- */}
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
