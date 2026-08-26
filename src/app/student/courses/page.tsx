"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  Play,
  Award,
  Layers,
  CheckCircle2,
  Sparkles,
  Filter,
  Loader2,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  description: string;
  level: string;
  durationHours: number;
  thumbnailUrl: string | null;
  status: string;
  trainer: { name: string };
  modules: Array<{ lessons: Array<{ id: string }> }>;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/courses");
        const data = await res.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        } else {
          setCourses([
            {
              id: "c1",
              title: "Full-Stack Next.js 15 & Enterprise Architecture",
              description: "Master App Router, Server Actions, RBAC auth, Prisma ORM, and high-concurrency cloud scaling.",
              level: "INTERMEDIATE",
              durationHours: 42,
              thumbnailUrl: null,
              status: "PUBLISHED",
              trainer: { name: "Prof. Marcus Thorne" },
              modules: [{ lessons: [{ id: "l1" }] }],
            },
            {
              id: "c2",
              title: "PostgreSQL Relational Schema & Sharding",
              description: "Deep dive into ACID transactions, query optimization, connection pooling, and multi-tenant sharding.",
              level: "ADVANCED",
              durationHours: 35,
              thumbnailUrl: null,
              status: "PUBLISHED",
              trainer: { name: "Dr. Elena Vance" },
              modules: [{ lessons: [{ id: "l2" }] }],
            },
          ]);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "ALL" || c.level === selectedLevel;
    return matchesQuery && matchesLevel;
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Academic Curricula
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Course Catalog & Tracks</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Explore industry-aligned curriculums, master state-of-the-art tech stacks, and earn verified credentials.
          </p>
        </div>
      </div>

      {/* Global Search & Filters Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, tech stack, or topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
                selectedLevel === level
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
          Loading course catalog...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-2">
          <Search className="w-8 h-8 mx-auto text-slate-600 mb-1" />
          <p className="font-bold text-sm text-white">No matching courses found</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
            const firstLesson = course.modules[0]?.lessons[0];

            return (
              <div
                key={course.id}
                className="glass-panel rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-300 shadow-xl"
              >
                <div>
                  <div className="h-44 bg-slate-900 relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-indigo-400/40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] uppercase font-bold text-indigo-300 border border-indigo-500/30 font-mono">
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {course.durationHours} Hours
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" /> {totalLessons} Lessons
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center transition"
                    >
                      Syllabus
                    </Link>

                    <Link
                      href={firstLesson ? `/student/lessons/${firstLesson.id}` : `/student/courses/${course.id}`}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                    >
                      Enroll <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
