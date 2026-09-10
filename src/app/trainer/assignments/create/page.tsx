"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  Award,
  BookOpen,
  Check,
  Calculator,
  UploadCloud,
  FileText,
} from "lucide-react";

interface CourseBatchItem {
  id: string;
  name: string;
  status: string;
}

interface CourseItem {
  id: string;
  title: string;
  batches?: CourseBatchItem[];
}

export default function TrainerCreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    courseId: preselectedCourseId,
    batchIds: [] as string[],
    title: "",
    description: "",
    instructions: "",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalMarks: 100,
    maxFileSizeMb: 25,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch("/api/trainer/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
          if (data.data.length > 0) {
            const initialCourseId =
              preselectedCourseId && data.data.some((c: CourseItem) => c.id === preselectedCourseId)
                ? preselectedCourseId
                : data.data[0].id;
            setForm((prev) => ({ ...prev, courseId: initialCourseId }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => setLoadingCourses(false));
  }, [preselectedCourseId]);

  // Selected course object & batches
  const selectedCourse = courses.find((c) => c.id === form.courseId);
  const courseBatches = selectedCourse?.batches || [];

  const handleBatchToggle = (batchId: string) => {
    setForm((prev) => {
      const exists = prev.batchIds.includes(batchId);
      return {
        ...prev,
        batchIds: exists ? prev.batchIds.filter((id) => id !== batchId) : [...prev.batchIds, batchId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.title.trim() || !form.description.trim()) {
      showToast("error", "Please fill in all required assignment fields");
      return;
    }

    setSubmitting(true);
    try {
      // Allow all commonly used file formats by default
      const allAllowedTypes = [
        "pdf", "zip", "rar", "7z", "tar.gz",
        "docx", "doc", "pptx", "ppt", "xlsx", "xls",
        "txt", "csv", "json", "md",
        "png", "jpg", "jpeg", "webp", "gif",
        "py", "java", "js", "ts", "html", "css", "cpp", "c", "sql"
      ];

      const res = await fetch("/api/trainer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          allowedFileTypes: allAllowedTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create assignment");
      }

      showToast("success", `Assignment "${form.title}" created successfully!`);
      setTimeout(() => {
        router.push("/trainer/assignments");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      {/* Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-pink-50/40 to-purple-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-pink-400/10 to-purple-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7C248C] to-[#E01E6A] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <FileCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E01E6A] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#E01E6A]" /> Project Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200 text-[10px] font-mono font-bold uppercase">
                Standalone Assessment
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Create Course Project & Assignment
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Define project briefs, submission parameters, deadlines, and cohort scoping.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 text-xs font-mono text-slate-700">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
            <strong className="text-[#E01E6A] font-extrabold text-sm">{form.totalMarks}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Size</span>
            <strong className="text-slate-900 font-extrabold text-sm">{form.maxFileSizeMb}MB</strong>
          </div>
        </div>
      </div>

      {/* Main Assignment Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Core Configuration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-[#7C248C]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-mono">
              1. Project Parameters & Cohort Scope
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Target Course *</span>
                <span className="text-[10px] text-slate-400 font-mono">Select curriculum</span>
              </label>
              {loadingCourses ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Loading assigned courses...
                </div>
              ) : (
                <select
                  value={form.courseId}
                  onChange={(e) => {
                    setForm({ ...form, courseId: e.target.value, batchIds: [] });
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignment Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Project / Assignment Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Build a Microservices Backend with Docker & JWT"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Project Overview & Deliverables Summary *</label>
            <textarea
              rows={3}
              required
              placeholder="Explain the assignment objectives, real-world scenario, and primary deliverables expected from students..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
            />
          </div>

          {/* Detailed Instructions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Detailed Instructions & Evaluation Rubric (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="List step-by-step milestones, grading rubrics (e.g. 40% Architecture, 30% Testing, 30% Documentation), and repository link format..."
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition font-mono"
            />
          </div>

          {/* Numerical Parameters: Total Marks, Deadline, File Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#E01E6A] font-mono flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Total Marks *
                </label>
              </div>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: Math.max(1, Number(e.target.value) || 0) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/60 border border-pink-200 text-[#E01E6A] text-xs font-mono font-black focus:outline-none focus:border-[#E01E6A]"
              />
              <div className="flex items-center gap-1 pt-0.5">
                {[20, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm({ ...form, totalMarks: preset })}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition ${
                      form.totalMarks === preset
                        ? "bg-[#E01E6A] text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Submission Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
              />
              <p className="text-[10px] text-slate-400 font-mono">Leave empty for flexible self-paced projects</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" /> Max File Size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={form.maxFileSizeMb}
                onChange={(e) => setForm({ ...form, maxFileSizeMb: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
              />
              <p className="text-[10px] text-slate-400 font-mono">Default: 25MB (Max: 100MB)</p>
            </div>
          </div>

          {/* Batch Scoping Selector */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 block">
                  Cohort Batch Targeting (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Select specific cohort batches to restrict project visibility. If none are checked, all enrolled students in the course will have access.
                </p>
              </div>

              {courseBatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (form.batchIds.length === courseBatches.length) {
                      setForm({ ...form, batchIds: [] });
                    } else {
                      setForm({ ...form, batchIds: courseBatches.map((b) => b.id) });
                    }
                  }}
                  className="text-xs font-bold text-[#7C248C] hover:underline cursor-pointer"
                >
                  {form.batchIds.length === courseBatches.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {courseBatches.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {courseBatches.map((b) => {
                  const isSelected = form.batchIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBatchToggle(b.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-pink-50/80 border-[#E01E6A] text-[#E01E6A] shadow-2xs font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold truncate">{b.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase">{b.status}</div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[#E01E6A] border-[#E01E6A] text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
                No cohort batches currently assigned to this course. Assignment will be accessible by all enrolled students.
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <Link
            href="/trainer/assignments"
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-black text-xs tracking-wider uppercase shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            <span>{submitting ? "Publishing Assignment..." : "Publish Course Assignment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

