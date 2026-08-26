"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function TrainerCourseCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(40);
  const [level, setLevel] = useState("BEGINNER");
  const [objectives, setObjectives] = useState("");
  const [prerequisites, setPrerequisites] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const objList = objectives.split("\n").map((s) => s.trim()).filter(Boolean);
      const preList = prerequisites.split("\n").map((s) => s.trim()).filter(Boolean);

      const res = await fetch("/api/trainer/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          durationHours: Number(durationHours),
          level,
          objectives: objList.length > 0 ? objList : ["Master foundational concepts", "Build scalable solutions"],
          prerequisites: preList.length > 0 ? preList : ["Basic programming experience"],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create course");
      }

      router.push(`/trainer/courses/${data.data.id}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl w-full mx-auto">
      <Link
        href="/trainer/courses"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Course Initialization
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create New Course Track</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Set up high-level curriculum metadata. You can add syllabus modules, video lessons, and attachments in the next step.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Course Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Cloud Architecture & Kubernetes"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Course Description & Executive Overview
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed overview of what students will master in this curriculum track..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Duration (Estimated Total Hours)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Difficulty Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
                <option value="ALL_LEVELS">ALL_LEVELS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Learning Objectives (1 per line)
              </label>
              <textarea
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Master multi-tier cloud deployments&#10;Implement RBAC and OAuth2 proxies"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Prerequisites (1 per line)
              </label>
              <textarea
                rows={3}
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="Familiarity with modern JavaScript/TypeScript&#10;Understanding of relational databases"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href="/trainer/courses"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Course Container"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
