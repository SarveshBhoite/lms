"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Calendar,
  Award,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  fileUrl: string;
  fileName: string;
  notes: string | null;
  status: string;
  submittedAt: string;
  user: { id: string; name: string; email: string };
  feedback: { marksAwarded: number; feedbackText: string } | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  totalMarks: number;
  course: { id: string; title: string };
  submissions: SubmissionItem[];
}

interface CourseOption {
  id: string;
  title: string;
}

export default function TrainerAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Create Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [totalMarks, setTotalMarks] = useState(100);

  // Grade Form
  const [marksAwarded, setMarksAwarded] = useState(95);
  const [feedbackText, setFeedbackText] = useState("Outstanding implementation of RBAC guards and Prisma queries.");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, courseRes] = await Promise.all([
        fetch("/api/trainer/assignments"),
        fetch("/api/trainer/courses"),
      ]);

      const assignData = await assignRes.json();
      if (assignData.success && assignData.assignments) {
        setAssignments(assignData.assignments);
      }

      const courseData = await courseRes.json();
      if (courseData.success && courseData.courses) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseData.courses[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/trainer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          courseId: selectedCourseId,
          deadline: new Date(deadline).toISOString(),
          totalMarks: Number(totalMarks),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create assignment milestone");
      }

      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setSuccessMsg(`Assignment "${title}" deployed and saved to database!`);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("An unexpected error occurred while saving the assignment.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    setSubmitting(true);
    setEvalError(null);

    try {
      const res = await fetch("/api/trainer/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          marksAwarded: Number(marksAwarded),
          feedbackText: feedbackText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish grade feedback");
      }

      setEvalModalOpen(false);
      setSuccessMsg(`Grade & feedback saved for ${activeSubmission.user.name}!`);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEvalError(err.message);
      } else {
        setEvalError("An unexpected error occurred while saving the grade.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Are you sure you want to delete assignment "${assignmentTitle}"?`)) return;

    try {
      const res = await fetch(`/api/trainer/assignments?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Assignment "${assignmentTitle}" deleted successfully.`);
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.error || "Failed to delete assignment");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("Failed to delete assignment.");
      }
      setTimeout(() => setCreateError(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <FileCheck className="w-3.5 h-3.5" /> Project Evaluation Lab
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Assignments & Lab Grading</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Deploy milestone assignments, review code repository submissions, and grade student projects with rich feedback.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Milestone Assignment
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
          Loading assignments and submissions...
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((a) => (
            <div key={a.id} className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-xl relative group">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-purple-400 block mb-1">
                    Course Track: {a.course.title}
                  </span>
                  <h3 className="font-bold text-lg text-white">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono text-xs text-slate-400 shrink-0">
                    <div>Deadline: <strong className="text-white">{new Date(a.deadline).toLocaleDateString()}</strong></div>
                    <div>Max Marks: <strong className="text-emerald-400">{a.totalMarks} pts</strong></div>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(a.id, a.title)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submissions Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase font-mono text-slate-400">
                  Student Submissions ({a.submissions.length})
                </span>

                {a.submissions.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-2">
                    No submissions received from students yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {a.submissions.map((sub) => (
                      <div key={sub.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {sub.user.name} <span className="text-slate-500 font-mono text-[11px]">({sub.user.email})</span>
                          </div>
                          <p className="text-slate-400 mt-0.5 font-mono text-[11px]">
                            URL: <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{sub.fileUrl}</a>
                          </p>
                          {sub.feedback && (
                            <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Graded: {sub.feedback.marksAwarded} / {a.totalMarks} pts • &quot;{sub.feedback.feedbackText}&quot;
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActiveSubmission(sub);
                            setEvalError(null);
                            if (sub.feedback) {
                              setMarksAwarded(sub.feedback.marksAwarded);
                              setFeedbackText(sub.feedback.feedbackText);
                            }
                            setEvalModalOpen(true);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer shrink-0"
                        >
                          <Award className="w-3.5 h-3.5" /> {sub.feedback ? "Re-evaluate" : "Evaluate & Grade"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" /> Deploy Milestone Assignment
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Milestone Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Capstone 2: Distributed Database Sharding"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Course Track
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Instructions & Requirements
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain submission deliverables, required repository links, and testing steps..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Maximum Points
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Modal */}
      {evalModalOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" /> Grade Student Project
              </h3>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div>Scholar: <strong className="text-white">{activeSubmission.user.name}</strong></div>
              <div>Link: <a href={activeSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{activeSubmission.fileUrl}</a></div>
            </div>

            {evalError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{evalError}</span>
              </div>
            )}

            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Points Awarded (out of 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={marksAwarded}
                  onChange={(e) => setMarksAwarded(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Feedback & Review Comments
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide constructive feedback, code quality analysis, and suggestions..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Grade Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
