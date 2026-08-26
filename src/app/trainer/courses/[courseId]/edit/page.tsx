"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export default function TrainerCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(40);
  const [level, setLevel] = useState("BEGINNER");
  const [status, setStatus] = useState("DRAFT");
  const [objectives, setObjectives] = useState("");
  const [prerequisites, setPrerequisites] = useState("");

  useEffect(() => {
    fetch(`/api/trainer/courses?courseId=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.course) {
          const c = data.course;
          setTitle(c.title);
          setDescription(c.description);
          setDurationHours(c.durationHours);
          setLevel(c.level);
          setStatus(c.status);
          setObjectives(Array.isArray(c.objectives) ? c.objectives.join("\n") : "");
          setPrerequisites(Array.isArray(c.prerequisites) ? c.prerequisites.join("\n") : "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const objList = objectives.split("\n").map((s) => s.trim()).filter(Boolean);
      const preList = prerequisites.split("\n").map((s) => s.trim()).filter(Boolean);

      const res = await fetch("/api/trainer/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          description,
          durationHours: Number(durationHours),
          level,
          status,
          objectives: objList,
          prerequisites: preList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update course");
      }

      setSuccessMsg("Course metadata updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this course? This action cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/trainer/courses?courseId=${courseId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        router.push("/trainer/courses");
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-4xl mx-auto glass-panel mt-12 rounded-3xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
        Loading course metadata...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl w-full mx-auto">
      <Link
        href={`/trainer/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Curriculum Studio
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Metadata Editor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Edit Course Information</h1>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Delete Course
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
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
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Course Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Duration (Hours)
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="UNPUBLISHED">UNPUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
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
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition"
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
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href={`/trainer/courses/${courseId}`}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2 transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
