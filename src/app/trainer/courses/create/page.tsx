"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

export default function TrainerCourseCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(30);
  const [level, setLevel] = useState("BEGINNER");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [objectives, setObjectives] = useState("Build production-ready applications, Master core concepts");
  const [prerequisites, setPrerequisites] = useState("Basic programming fundamentals");
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit.");
      return;
    }

    setUploadLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload image to Cloudinary");
      }

      setThumbnailUrl(json.url);
      setSuccessToast("Thumbnail uploaded successfully to Cloudinary!");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadLoading(false);
    }
  };

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
      {successToast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      <Link
        href="/trainer/courses"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course Catalog
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-900">Create New Course Curriculum</h1>
        <p className="text-slate-600 text-sm mt-1">
          Design a new course curriculum with real PostgreSQL data persistence and Cloudinary thumbnail storage.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Course Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Systems & Microservices in Java"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#7C248C]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Course Overview & Description *</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what learners will accomplish, hands-on milestones, and technology stack..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#7C248C]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Estimated Duration (Hours) *</label>
            <input
              type="number"
              min={1}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Target Difficulty Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="ALL_LEVELS">All Levels</option>
            </select>
          </div>
        </div>

        {/* Thumbnail Image Upload (Cloudinary) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Course Thumbnail Image</label>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {thumbnailUrl ? (
              <div className="relative w-32 h-24 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 group shadow-xs">
                <img
                  src={thumbnailUrl}
                  alt="Course Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl("")}
                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-bold"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="w-32 h-24 rounded-2xl border-2 border-dashed border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <ImageIcon className="w-8 h-8 stroke-1 text-slate-400" />
                <span className="text-[10px] mt-1">No image</span>
              </div>
            )}

            <div className="flex-1 space-y-2 w-full">
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 hover:border-purple-300 bg-white text-slate-700 font-bold text-xs cursor-pointer transition shadow-xs hover:bg-purple-50/50">
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#7C248C] animate-spin" />
                    <span>Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-[#7C248C]" />
                    <span>Upload Image from Device</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadLoading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="Or paste external image URL directly..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#7C248C]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Learning Objectives (comma separated)</label>
            <input
              type="text"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Prerequisites (comma separated)</label>
            <input
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Course
          </button>
        </div>
      </form>
    </div>
  );
}
