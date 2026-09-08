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
  Calendar,
  Sparkles,
  Layers,
  UserCheck,
  Target,
  GraduationCap,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
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
  objectives?: string[];
  prerequisites?: string[];
  level: string;
  durationHours: number;
  trainer: {
    id: string;
    name: string;
    email: string;
    profile?: { designation?: string | null; bio?: string | null; avatarUrl?: string | null } | null;
  };
  batch?: { id: string; name: string; startDate?: string | null; endDate?: string | null } | null;
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

  const [activeTab, setActiveTab] = useState<"player" | "overview" | "resources" | "quizzes" | "assignments" | "liveClasses">("player");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalDurationMin = allLessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const totalDurationFormatted = course.durationHours > 0 ? `${course.durationHours} Hours` : `${Math.round(totalDurationMin / 60)} Hours`;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Alert */}
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

      {/* Navigation Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-600 hover:text-[#7C248C] hover:border-purple-200 transition shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {/* Modern Compact Banner Header (~10% vh) */}
      <div className="glass-card rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/20 px-6 py-4 sm:px-8 sm:py-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-purple-100 text-[#7C248C] text-[10px] border border-purple-200/60 uppercase shadow-2xs">
                {course.level} Level
              </span>
              <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 text-[10px] border border-slate-200/60">
                {course.batch?.name || "Assigned Cohort"}
              </span>
              <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> {totalDurationFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-xs text-slate-600 font-medium">
              Instructor: <strong className="text-[#7C248C]">{course.trainer.name}</strong>
              {course.trainer.profile?.designation && ` • ${course.trainer.profile.designation}`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Live Progress Indicator */}
            <div className="px-4 py-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-1.5 min-w-[180px]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Curriculum:</span>
                <strong className="text-slate-900 font-extrabold">{progressPct.toFixed(1)}%</strong>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="jvm-gradient-bg h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-400 font-mono text-right">
                {completedIds.length}/{allLessons.length} Lessons Finished
              </div>
            </div>

            {/* Top Banner Certificate Button if 100% completed */}
            {hasFinalLesson && isCourseComplete100 && (
              <div>
                {certificate ? (
                  <Link
                    href={`/verify/certificate/${certificate.certificateNumber || certificate.id}`}
                    className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" /> View Certificate
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateCertificate}
                    disabled={generatingCertificate}
                    className="px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] transition whitespace-nowrap cursor-pointer"
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
      </div>

      {/* ---------------- NAVIGATION TABS (SEGMENTED PILL TRACK) ---------------- */}
      <div className="p-1.5 rounded-3xl bg-slate-200/60 backdrop-blur-md border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveTab("player")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "player"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Syllabus & Modules ({allLessons.length})
        </button>

        <button
          onClick={() => setActiveTab("liveClasses")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "liveClasses"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Video className="w-4 h-4" /> Live Interactive Classes ({(course.liveClasses || []).length})
        </button>

        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "resources"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Download className="w-4 h-4" /> Study Materials ({course.learningResources.length})
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "quizzes"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Quizzes ({course.quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "assignments"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FileCheck className="w-4 h-4" /> Tasks & Projects ({course.assignments.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/25 font-black scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FileText className="w-4 h-4" /> About Course
        </button>
      </div>

      {/* ---------------- TAB 1: STRUCTURED COURSE INDEX & SYLLABUS ---------------- */}
      {activeTab === "player" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Curriculum & Sequential Path</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each lesson unlocks in sequential order. Click on any unlocked lesson to launch the study studio.
              </p>
            </div>

            {/* Quick Resume CTA */}
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
                          {generatingCertificate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
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
                  className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs space-y-3"
                >
                  {/* Module Header Bar */}
                  <div className="p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                          isModuleComplete
                            ? "bg-emerald-600 text-white"
                            : "jvm-gradient-bg text-white"
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
                          className="jvm-gradient-bg h-2 rounded-full transition-all duration-300"
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

                              {/* Component Badges */}
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

          {/* Certificate Module */}
          {hasFinalLesson && (
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
                certificate
                  ? "bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 border-purple-200 shadow-sm"
                  : isCourseComplete100
                  ? "bg-gradient-to-br from-emerald-50/70 via-white to-purple-50/50 border-emerald-300 shadow-sm"
                  : "bg-slate-50/70 border-slate-200 opacity-85"
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
                        ? `Issued on ${new Date(certificate.issueDate).toLocaleDateString()}. Includes tamper-proof QR verification.`
                        : isCourseComplete100
                        ? "You have successfully finished 100% of curriculum modules. Click below to generate your official certificate."
                        : `Complete 100% of all lessons (${completedIds.length}/${allLessons.length} done) to unlock and claim your certificate.`}
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

      {/* ---------------- TAB 2: LIVE CLASSES ---------------- */}
      {activeTab === "liveClasses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Video className="w-5 h-5 text-[#1E2B88]" /> Live Interactive Class Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join scheduled Google Meet broadcast sessions with your instructor and access past recordings.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-[#7C248C]">
              {(course.liveClasses || []).length} Total Classes
            </span>
          </div>

          {(course.liveClasses || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.liveClasses?.map((lc) => {
                const userAtt = lc.attendances?.[0];
                const startTimeMs = new Date(lc.startTime).getTime();
                const diffToStart = startTimeMs - Date.now();
                const isCompleted = lc.status === "COMPLETED";
                const isLive = lc.status === "LIVE" || (!isCompleted && diffToStart <= 10 * 60 * 1000);

                return (
                  <div
                    key={lc.id}
                    className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Visual Card Top Accent Ribbon */}
                    <div
                      className={`h-2.5 w-full ${
                        isLive
                          ? "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 animate-pulse"
                          : isCompleted
                          ? "bg-slate-300"
                          : "jvm-gradient-bg"
                      }`}
                    />

                    <div className="p-6 space-y-4">
                      {/* Status and Date Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full border shadow-2xs flex items-center gap-1.5 ${
                            isLive
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : isCompleted
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-purple-100 text-[#7C248C] border-purple-200/60"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isLive ? "bg-rose-600 animate-ping" : isCompleted ? "bg-slate-400" : "bg-[#7C248C]"
                            }`}
                          />
                          {isLive ? "BROADCAST LIVE" : isCompleted ? "SESSION COMPLETED" : "UPCOMING STUDIO"}
                        </span>

                        <div className="flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(lc.scheduledDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#7C248C] transition">
                          {lc.title}
                        </h3>
                        {lc.description && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                            {lc.description}
                          </p>
                        )}
                      </div>

                      {/* Instructor & Timings Container */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200/70 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4 text-[#7C248C]" />
                            <span className="font-mono text-[11px]">Timing:</span>
                          </div>
                          <strong className="text-slate-900 font-mono text-xs">
                            {new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {new Date(lc.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg jvm-gradient-bg text-white font-bold text-[10px] flex items-center justify-center">
                              {lc.trainer?.name?.charAt(0) || "T"}
                            </div>
                            <span className="text-slate-500 text-[11px]">Faculty Lead:</span>
                          </div>
                          <strong className="text-[#7C248C] text-xs font-bold">{lc.trainer?.name}</strong>
                        </div>
                      </div>

                      {/* Attendance Tracking Tag */}
                      {userAtt && (
                        <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-purple-50/70 border border-purple-200/50 font-mono">
                          <span className="text-slate-500 text-[11px]">My Attendance:</span>
                          <span className="font-bold text-[#7C248C] text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {userAtt.status} ({userAtt.isApproved ? "Verified" : "Pending"})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-6 pt-0">
                      {isLive ? (
                        <Link
                          href="/student/live-classes"
                          className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/25 transition hover:scale-[1.01]"
                        >
                          <Video className="w-4 h-4 fill-white animate-pulse" /> Enter Live Classroom Studio
                        </Link>
                      ) : isCompleted && lc.recordingUrl ? (
                        <a
                          href={lc.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center justify-center gap-2 transition border border-purple-200 shadow-2xs"
                        >
                          <Video className="w-4 h-4" /> Watch Class Recording <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Link
                          href="/student/live-classes"
                          className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition shadow-2xs"
                        >
                          <Clock className="w-4 h-4 text-slate-400" /> View Session Details & Link
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No live classes scheduled for this course yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: RESOURCES ---------------- */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Download className="w-5 h-5 text-[#7C248C]" /> Learning Resources, Code & Datasets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download project assets, source code repositories, and supplemental reference documents.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-[#7C248C]">
              {course.learningResources.length} Resources
            </span>
          </div>

          {course.learningResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.learningResources.map((res) => {
                const isCode = res.type?.toUpperCase().includes("CODE") || res.type?.toUpperCase().includes("REPO");
                const isDataset = res.type?.toUpperCase().includes("DATA");
                const isDoc = res.type?.toUpperCase().includes("PDF") || res.type?.toUpperCase().includes("DOC");

                return (
                  <div
                    key={res.id}
                    className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Top Accent Ribbon */}
                    <div className="h-2 w-full jvm-gradient-bg" />

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 shadow-2xs">
                          {res.type || "RESOURCE"}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 flex items-center justify-center">
                          {isCode ? (
                            <Code className="w-4 h-4 text-[#7C248C]" />
                          ) : isDataset ? (
                            <Database className="w-4 h-4 text-[#1E2B88]" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#E01E6A]" />
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-[#7C248C] transition">
                          {res.title}
                        </h3>
                        {res.description && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            {res.description}
                          </p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs font-mono text-slate-600 flex items-center justify-between">
                        <span className="text-slate-400">Resource Access:</span>
                        <span className="font-bold text-[#7C248C] flex items-center gap-1">
                          Verified Asset Available
                        </span>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.01]"
                      >
                        <Download className="w-4 h-4" /> Download Resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
              <Download className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No supplemental resources uploaded for this course yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: QUIZZES ---------------- */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#7C248C]" /> Standalone Course Assessments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Timed knowledge evaluations configured directly for this curriculum.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-[#7C248C]">
              {course.quizzes.length} Quizzes
            </span>
          </div>

          {course.quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.quizzes.map((qz) => (
                <div
                  key={qz.id}
                  className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  {/* Top Accent Ribbon */}
                  <div className="h-2 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60 font-bold text-[10px] shadow-2xs">
                        Passing Criterion: {qz.passingMarks}%
                      </span>
                      <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-[#7C248C]" /> {qz.timeLimitMinutes} Mins
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#7C248C] transition">
                        {qz.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Comprehensive multiple-choice evaluation designed to benchmark conceptual mastery.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/20 border border-slate-200/60 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Assessment Type:</span>
                        <strong className="text-slate-800">Objective Multiple Choice</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/student/quizzes`}
                      className="block text-center w-full py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 transition hover:scale-[1.01]"
                    >
                      Open Assessment Studio
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No standalone quizzes configured for this course yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 5: ASSIGNMENTS ---------------- */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#E01E6A]" /> Hands-on Course Projects & Tasks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit project deliverables and track instructor evaluation grades.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#E01E6A]">
              {course.assignments.length} Projects
            </span>
          </div>

          {course.assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.assignments.map((asgn) => (
                <div
                  key={asgn.id}
                  className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-pink-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  {/* Top Accent Ribbon */}
                  <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600" />

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#E01E6A] font-bold text-[10px] px-3 py-1 rounded-full bg-pink-50 border border-pink-200 shadow-2xs">
                        Deadline: {asgn.deadline ? new Date(asgn.deadline).toLocaleDateString() : "Flexible Schedule"}
                      </span>
                      <span className="text-slate-700 font-bold text-[11px] bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                        {asgn.totalMarks} Total Marks
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-[#E01E6A] transition">
                        {asgn.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Practical hands-on implementation task evaluated directly by your faculty mentor.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-pink-50/20 border border-slate-200/60 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Deliverable Format:</span>
                        <strong className="text-slate-800">Source Code / Document Upload</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/student/assignments`}
                      className="block text-center w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition hover:scale-[1.01]"
                    >
                      Open Project Workspace
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No standalone assignments configured for this course yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 6: ABOUT COURSE & DETAILS (RICH BREAKDOWN) ---------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Main Description & Highlights */}
          <div className="glass-card p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[11px] font-bold font-mono uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Course Overview & Syllabus
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">About {course.title}</h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal">
              {course.description || "Comprehensive academic course covering industry-aligned fundamentals and advanced topics."}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Difficulty</span>
                <div className="text-base font-extrabold text-slate-900">{course.level}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Duration</span>
                <div className="text-base font-extrabold text-slate-900">{totalDurationFormatted}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Curriculum</span>
                <div className="text-base font-extrabold text-slate-900">
                  {course.modules.length} Modules &bull; {allLessons.length} Lessons
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Credential</span>
                <div className="text-base font-extrabold text-emerald-700">Verified Certificate</div>
              </div>
            </div>
          </div>

          {/* Learning Objectives & Prerequisites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objectives */}
            <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#7C248C]" /> Key Learning Objectives
              </h3>
              {course.objectives && course.objectives.length > 0 ? (
                <ul className="space-y-2.5">
                  {course.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Master industry-standard concepts, hands-on architectural workflows, and real-world project development methodologies.
                </p>
              )}
            </div>

            {/* Prerequisites */}
            <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1E2B88]" /> Course Prerequisites
              </h3>
              {course.prerequisites && course.prerequisites.length > 0 ? (
                <ul className="space-y-2.5">
                  {course.prerequisites.map((prereq, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E2B88] shrink-0 mt-1.5" />
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Basic familiarity with computing and enthusiasm to learn modern technological concepts. All necessary tools are introduced throughout the curriculum.
                </p>
              )}
            </div>
          </div>

          {/* Instructor Bio Profile */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl jvm-gradient-bg text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm">
              {course.trainer.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#7C248C] font-bold">Course Faculty Lead</span>
              <h3 className="text-lg font-extrabold text-slate-900">{course.trainer.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{course.trainer.email}</p>
              {course.trainer.profile?.bio && (
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{course.trainer.profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
