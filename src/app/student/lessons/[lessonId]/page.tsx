"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  CheckCircle2,
  FileText,
  FileCode,
  Download,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Award,
  Loader2,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";
import CustomVideoPlayer from "@/components/video-player";

interface ResourceItem {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface SyllabusLesson {
  id: string;
  title: string;
  durationMinutes: number;
  contentType: string;
}

interface SyllabusModule {
  id: string;
  title: string;
  lessons: SyllabusLesson[];
}

export default function StudentLessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [title, setTitle] = useState("Curriculum Lesson");
  const [description, setDescription] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [initialPlaybackSeconds, setInitialPlaybackSeconds] = useState(0);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [modules, setModules] = useState<SyllabusModule[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/lessons/${lessonId}`);
        const data = await res.json();
        if (data.success && data.lesson) {
          setTitle(data.lesson.title);
          setDescription(data.lesson.description);
          if (data.lesson.contentUrl) {
            setVideoUrl(data.lesson.contentUrl);
          }
          if (data.progress) {
            setInitialPlaybackSeconds(data.progress.playbackPositionSeconds || 0);
            setIsCompleted(data.progress.isCompleted || false);
          }
          if (data.completedLessonIds) {
            setCompletedLessonIds(data.completedLessonIds);
          }
          if (data.lesson.resources && data.lesson.resources.length > 0) {
            setResources(data.lesson.resources);
          } else {
            // Default sample resources if none attached
            setResources([
              {
                id: "res1",
                title: "Curriculum Lecture Notes & Architecture Diagrams.pdf",
                fileType: "PDF",
                fileSize: 2450000,
                fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              },
              {
                id: "res2",
                title: "Complete Code Solution & Environment Starter.zip",
                fileType: "ZIP",
                fileSize: 14200000,
                fileUrl: "https://github.com",
              },
            ]);
          }
          if (data.lesson.module?.course?.modules) {
            setModules(data.lesson.module.course.modules);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // Periodic video playback position persistence
  const handleProgressUpdate = async (seconds: number) => {
    // Only periodically sync (e.g. every 15 seconds)
    if (seconds > 0 && seconds % 15 === 0) {
      try {
        await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, playbackPositionSeconds: seconds }),
        });
      } catch {
        // ignore
      }
    }
  };

  const handleMarkComplete = async () => {
    try {
      setSavingProgress(true);
      const res = await fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, playbackPositionSeconds: initialPlaybackSeconds }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCompleted(true);
        setCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
        if (data.progress?.isCompleted) {
          setCourseCompleted(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setSavingProgress(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-5xl mx-auto glass-panel my-12 rounded-3xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
        Loading video stream & lesson assets...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link href="/student/courses" className="hover:text-white flex items-center gap-1.5 transition font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to My Courses
        </Link>
        <span className="font-mono text-indigo-300">Custom Video & Learning Player</span>
      </div>

      {courseCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-indigo-600/20 border border-emerald-500/40 text-center space-y-3 shadow-2xl">
          <Award className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-white">Congratulations! Curriculum 100% Completed!</h2>
          <p className="text-xs text-emerald-300 max-w-md mx-auto">
            You have successfully completed all lessons. Your official academic certificate has been minted.
          </p>
          <div className="pt-2">
            <Link
              href="/student/certificates"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
            >
              <Award className="w-4 h-4" /> View My Certificate
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lesson Player Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Video Player with Resume and Speed Controls */}
          <CustomVideoPlayer
            src={videoUrl}
            initialPlaybackSeconds={initialPlaybackSeconds}
            onProgressUpdate={handleProgressUpdate}
            onEnded={handleMarkComplete}
            poster="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80"
          />

          {/* Lesson Header & Complete Action */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                  Module Lecture Video
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
              </div>

              <button
                onClick={handleMarkComplete}
                disabled={savingProgress || isCompleted}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-xl cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-600 text-white border border-emerald-500/30 shadow-emerald-600/20"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30"
                }`}
              >
                {savingProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Lesson Completed!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
              {description ||
                "Master full-stack architecture, high-availability state synchronization, and secure multi-role authorization."}
            </p>
          </div>

          {/* Downloadable Learning Resources & Files */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" /> Downloadable Files & Course Assets
            </h3>
            <p className="text-xs text-slate-400">
              Supplemental slide decks, PDF reference guides, and source code datasets for this lesson.
            </p>

            <div className="space-y-3 pt-2">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
                      {res.fileType}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{res.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(res.fileSize)} • Cloud Storage Asset
                      </span>
                    </div>
                  </div>

                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Syllabus Sidebar */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 tracking-tight">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Curriculum Syllabus
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {modules.length > 0 ? (
                modules.map((mod, modIdx) => (
                  <div key={mod.id} className="space-y-2">
                    <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">
                      Module {modIdx + 1}: {mod.title}
                    </div>
                    <div className="space-y-1.5">
                      {mod.lessons.map((les) => {
                        const isDone = completedLessonIds.includes(les.id);
                        const isCurrent = les.id === lessonId;

                        return (
                          <Link
                            key={les.id}
                            href={`/student/lessons/${les.id}`}
                            className={`p-3 rounded-2xl flex items-center justify-between text-xs transition border block ${
                              isCurrent
                                ? "bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/40"
                                : isDone
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] font-mono opacity-80 ml-2 shrink-0">
                              {les.durationMinutes}m
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {[
                    { id: "1", title: "1. Next.js App Router Architecture", duration: "18m", done: true },
                    { id: "2", title: "2. Server Actions & Mutations", duration: "24m", done: isCompleted },
                    { id: "3", title: "3. Prisma Relational Modeling", duration: "32m", done: false },
                    { id: "4", title: "4. RBAC Middleware Session Encryption", duration: "22m", done: false },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl flex items-center justify-between text-xs border ${
                        item.done
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-slate-900/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80 ml-2 shrink-0">{item.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
