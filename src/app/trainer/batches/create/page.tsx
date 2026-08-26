"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Layers, Users, Loader2, CheckCircle2, AlertTriangle, Search, Lock } from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  isLocked: boolean;
  lockedBatchName?: string | null;
  lockedTrainerName?: string | null;
  profile?: { avatarUrl?: string | null; phone?: string | null } | null;
}

export default function TrainerCreateBatchPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    courseId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "UPCOMING",
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch("/api/trainer/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const courseMap = new Map<string, CourseItem>();
          data.data.forEach((b: any) => {
            if (b.course) courseMap.set(b.course.id, b.course);
          });

          fetch("/api/trainer/courses")
            .then((r) => r.json())
            .then((cData) => {
              if (cData.success && Array.isArray(cData.data)) {
                cData.data.forEach((c: any) => courseMap.set(c.id, { id: c.id, title: c.title }));
              }
              const courseList = Array.from(courseMap.values());
              setCourses(courseList);
              if (courseList.length > 0) {
                setForm((prev) => ({ ...prev, courseId: courseList[0].id }));
              }
            })
            .catch(() => {
              setCourses(Array.from(courseMap.values()));
            })
            .finally(() => setLoadingCourses(false));
        } else {
          setLoadingCourses(false);
        }
      })
      .catch(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (!form.courseId) return;
    setLoadingStudents(true);
    setSelectedStudentIds([]);
    fetch(`/api/trainer/courses/${form.courseId}/eligible-students`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAllStudents(data.data || []);
        } else {
          setAllStudents([]);
        }
      })
      .catch(() => setAllStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [form.courseId]);

  const toggleStudent = (id: string, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const availableStudents = allStudents.filter((s) => !s.isLocked);
  const lockedStudents = allStudents.filter((s) => s.isLocked);

  const handleSelectAllAvailable = () => {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.courseId || !form.startDate || !form.endDate) {
      showToast("error", "Please fill in all required batch fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trainer/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          courseId: form.courseId,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          studentIds: selectedStudentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create batch");

      showToast("success", `Batch "${form.name}" created successfully!`);
      setTimeout(() => {
        router.push(`/trainer/batches/${data.data.id}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  const filterFn = (s: StudentItem) =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.email.toLowerCase().includes(searchStudent.toLowerCase());

  const filteredAvailable = availableStudents.filter(filterFn);
  const filteredLocked = lockedStudents.filter(filterFn);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Batches
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-600" /> Create Academic Batch
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Configure cohort details and enroll eligible course students. You will automatically be assigned as batch instructor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Batch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Full-Stack Web Dev - Fall 2026 Cohort A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition shadow-xs"
              />
            </div>

            {/* Select Course */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Assigned Course *</label>
              {loadingCourses ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> Loading your assigned courses...
                </div>
              ) : (
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition shadow-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition shadow-xs"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">End Date *</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 transition shadow-xs"
              />
            </div>
          </div>

          {/* Student Roster Selection Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> Student Cohort Selection ({selectedStudentIds.length} Selected)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Available enrolled students can be selected. Students already in an active batch for this course are locked.
                </p>
              </div>

              {availableStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllAvailable}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
                >
                  {selectedStudentIds.length === availableStudents.length ? "Deselect All" : "Select All Available"}
                </button>
              )}
            </div>

            {/* Student Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            {loadingStudents ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> Fetching course students...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available Students List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available Students ({filteredAvailable.length})
                  </div>

                  {filteredAvailable.length > 0 ? (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                      {filteredAvailable.map((s) => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            onClick={() => toggleStudent(s.id, false)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              isChecked
                                ? "bg-amber-50 border-amber-300 text-slate-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              Eligible
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                      No unassigned available students found for this course.
                    </div>
                  )}
                </div>

                {/* Locked / Already Assigned Students List */}
                {filteredLocked.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-600 uppercase font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Already Assigned in Active Batch ({filteredLocked.length})
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-100/60">
                      {filteredLocked.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white/70 flex items-center justify-between opacity-75 cursor-not-allowed"
                        >
                          <div className="flex items-center gap-3">
                            <input type="checkbox" disabled checked={false} className="w-4 h-4 rounded text-slate-400" />
                            <div>
                              <div className="text-xs font-bold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{s.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" /> Assigned: {s.lockedBatchName} ({s.lockedTrainerName})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link
              href="/trainer/batches"
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              Create & Launch Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
