"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Layers,
  Users,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  Sparkles,
  Calendar,
  GraduationCap,
  ChevronDown,
  Check,
  Video,
  HelpCircle,
  FileCheck,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  level?: string;
  durationHours?: number;
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

  // Form State
  const [form, setForm] = useState({
    name: "",
    courseId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "UPCOMING",
  });

  // Post-Creation Redirect Direction
  const [nextAction, setNextAction] = useState<"cockpit" | "live-class" | "quiz" | "assignment">("cockpit");

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FAST LOAD: Fetch courses directly from /api/trainer/courses in a single fast call
  useEffect(() => {
    fetch("/api/trainer/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
          if (data.data.length > 0) {
            setForm((prev) => ({
              ...prev,
              courseId: prev.courseId || data.data[0].id,
            }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch courses:", err);
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  // Fast Student Loading for selected course
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

      const createdBatchId = data.data.id;
      showToast("success", `Batch "${form.name}" created successfully! Redirecting...`);

      setTimeout(() => {
        if (nextAction === "live-class") {
          router.push(`/trainer/live-classes?batchId=${createdBatchId}&courseId=${form.courseId}`);
        } else if (nextAction === "quiz") {
          router.push(`/trainer/quizzes/create?courseId=${form.courseId}`);
        } else if (nextAction === "assignment") {
          router.push(`/trainer/assignments/create?courseId=${form.courseId}`);
        } else {
          router.push(`/trainer/batches/${createdBatchId}`);
        }
        router.refresh();
      }, 750);
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
  const selectedCourseObj = courses.find((c) => c.id === form.courseId);

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

      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <Link
          href="/trainer/batches"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Batches
        </Link>
      </div>

      {/* Compact Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2B88] to-[#7C248C] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Cohort Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
                New Launch
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Create & Setup Academic Batch
            </h1>
            <p className="text-slate-500 text-xs font-mono">
              Configure batch schedule, select course, assign students, and choose immediate post-creation workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Batch Core Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Batch Information & Schedule
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Batch Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Batch / Cohort Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass Web Engineering - Fall 2026 Cohort"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
                />
              </div>

              {/* Custom Styled Select Course Dropdown */}
              <div className="space-y-2 relative" ref={courseDropdownRef}>
                <label className="text-xs font-bold text-slate-700">Assigned Course *</label>
                {loadingCourses ? (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#7C248C]" /> Loading assigned courses...
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#7C248C] flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GraduationCap className="w-4 h-4 text-[#7C248C] shrink-0" />
                        <span className="truncate">{selectedCourseObj?.title || "Select course..."}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isCourseDropdownOpen ? "rotate-180 text-[#7C248C]" : ""
                        }`}
                      />
                    </button>

                    {isCourseDropdownOpen && (
                      <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                        {courses.map((c) => {
                          const isSelected = c.id === form.courseId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setForm({ ...form, courseId: c.id });
                                setIsCourseDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition text-xs ${
                                isSelected
                                  ? "bg-purple-50 text-[#7C248C] font-black"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="truncate">{c.title}</span>
                              {isSelected && <Check className="w-4 h-4 text-[#7C248C] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7C248C]" /> Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7C248C]" /> Expected End Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Student Roster Selection Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Student Cohort Selection ({selectedStudentIds.length} Selected)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Select eligible students enrolled in this course to immediately populate this cohort.
                  </p>
                </div>
              </div>

              {availableStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllAvailable}
                  className="text-xs font-bold text-[#7C248C] hover:underline transition"
                >
                  {selectedStudentIds.length === availableStudents.length ? "Deselect All" : "Select All Available"}
                </button>
              )}
            </div>

            {/* Student Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter students by name or email..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white shadow-xs"
              />
            </div>

            {loadingStudents ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#7C248C]" /> Fetching eligible course students...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available Students List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available Course Students ({filteredAvailable.length})
                  </div>

                  {filteredAvailable.length > 0 ? (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                      {filteredAvailable.map((s) => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            onClick={() => toggleStudent(s.id, false)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              isChecked
                                ? "bg-purple-50 border-purple-300 text-slate-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-[#7C248C] accent-[#7C248C]"
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
                      No unassigned eligible students found for this course.
                    </div>
                  )}
                </div>

                {/* Locked / Already Assigned Students List */}
                {filteredLocked.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-600 uppercase font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Already Assigned in Active Cohort ({filteredLocked.length})
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
                            <Lock className="w-3 h-3 text-amber-600" /> Cohort: {s.lockedBatchName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Next Immediate Workflow Setup */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  What would you like to set up immediately after creation?
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  Select your next action. You will be automatically navigated to the corresponding form with this batch pre-selected.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div
                onClick={() => setNextAction("cockpit")}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  nextAction === "cockpit"
                    ? "bg-purple-50 border-[#7C248C] shadow-xs"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-100 text-[#7C248C]">
                    <Layers className="w-4 h-4" />
                  </div>
                  {nextAction === "cockpit" && <Check className="w-4 h-4 text-[#7C248C]" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Batch Cockpit</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Go directly to the full batch dashboard.</p>
                </div>
              </div>

              <div
                onClick={() => setNextAction("live-class")}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  nextAction === "live-class"
                    ? "bg-cyan-50 border-cyan-600 shadow-xs"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                    <Video className="w-4 h-4" />
                  </div>
                  {nextAction === "live-class" && <Check className="w-4 h-4 text-cyan-700" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Schedule Live Class</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Launch live Google Meet scheduler for this batch.</p>
                </div>
              </div>

              <div
                onClick={() => setNextAction("quiz")}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  nextAction === "quiz"
                    ? "bg-purple-50 border-[#7C248C] shadow-xs"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-100 text-[#7C248C]">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  {nextAction === "quiz" && <Check className="w-4 h-4 text-[#7C248C]" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Create Assessment Quiz</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Build a quiz for this course & cohort.</p>
                </div>
              </div>

              <div
                onClick={() => setNextAction("assignment")}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  nextAction === "assignment"
                    ? "bg-rose-50 border-rose-600 shadow-xs"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  {nextAction === "assignment" && <Check className="w-4 h-4 text-rose-700" />}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Add Assignment</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Post an assignment project for students.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/trainer/batches"
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>
                {nextAction === "cockpit" && "Create Batch & Open Cockpit"}
                {nextAction === "live-class" && "Create Batch & Schedule Class"}
                {nextAction === "quiz" && "Create Batch & Create Quiz"}
                {nextAction === "assignment" && "Create Batch & Add Assignment"}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
