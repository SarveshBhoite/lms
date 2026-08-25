"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, Sparkles, BookOpen } from "lucide-react";

export default function TrainerCourseCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(30);
  const [level, setLevel] = useState("BEGINNER");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [objectives, setObjectives] = useState("Build production-ready applications, Master relational databases");
  const [prerequisites, setPrerequisites] = useState("Basic programming fundamentals");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/trainer/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          durationHours: Number(durationHours),
          level,
          thumbnailUrl: thumbnailUrl || undefined,
          objectives: objectives.split(",").map((s) => s.trim()).filter(Boolean),
          prerequisites: prerequisites.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create course");
      }

      router.push("/trainer/courses");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      <Link href="/trainer/courses" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Course Catalog
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-white">Create New Course Container</h1>
        <p className="text-slate-400 text-sm mt-1">Design a new course curriculum with real PostgreSQL data persistence and RBAC authorization.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Course Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Systems & Microservices in Node.js"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Course Overview & Description</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what learners will accomplish, hands-on milestones, and technology stack..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Estimated Duration (Hours)</label>
            <input
              type="number"
              min={1}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Target Difficulty Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:ring-2 focus:ring-amber-500"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="ALL_LEVELS">All Levels</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Thumbnail URL (Optional)</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Learning Objectives (comma separated)</label>
            <input
              type="text"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Prerequisites (comma separated)</label>
            <input
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-xl shadow-amber-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Course Container
          </button>
        </div>
      </form>
    </div>
  );
}
