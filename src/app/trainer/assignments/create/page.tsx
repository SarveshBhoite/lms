"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
}

export default function TrainerCreateAssignmentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    instructions: "",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalMarks: 100,
    allowedFileTypes: "pdf, zip, docx, pptx",
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
            setForm((prev) => ({ ...prev, courseId: data.data[0].id }));
          }
        }
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.title || !form.description || !form.deadline) {
      showToast("error", "Please fill in all required assignment fields");
      return;
    }

    setSubmitting(true);
    try {
      const allowedTypes = form.allowedFileTypes.split(",").map((s) => s.trim());

      const res = await fetch("/api/trainer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          allowedFileTypes: allowedTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create assignment");

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
    <div className="p-6 sm:p-10 space-y-8 max-w-3xl w-full mx-auto">
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-rose-600" /> Create New Assignment
          </h1>
          <p className="text-slate-600 text-xs mt-1">Configure assignment title, total marks, and deadline for your course.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Course *</label>
            {loadingCourses ? (
              <div className="p-3 rounded-xl bg-slate-50 text-slate-500 border border-slate-200">Loading courses...</div>
            ) : (
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Build a RESTful API with Authentication"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Detailed explanation of assignment requirements..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Deadline *</label>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Total Marks</label>
              <input
                type="number"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
