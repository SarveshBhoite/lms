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
  Paperclip,
  FolderGit2,
  FileCode,
  Sparkles,
  Info,
  Clock,
  UploadCloud,
  FileText,
  Layers,
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
  instructions: string | null;
  deadline: string;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
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

  // Create Form State
  const [isProject, setIsProject] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [totalMarks, setTotalMarks] = useState(100);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["PDF", "ZIP", "GITHUB_URL"]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentsList, setAttachmentsList] = useState<string[]>([]);

  // Grade Form State
  const [marksAwarded, setMarksAwarded] = useState(95);
  const [feedbackText, setFeedbackText] = useState("Excellent implementation of modular architectures & schema guards.");

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

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    setAttachmentsList([...attachmentsList, attachmentUrl.trim()]);
    setAttachmentUrl("");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachmentsList(attachmentsList.filter((_, i) => i !== idx));
  };

  const toggleAllowedType = (type: string) => {
    if (allowedTypes.includes(type)) {
      if (allowedTypes.length > 1) {
        setAllowedTypes(allowedTypes.filter((t) => t !== type));
      }
    } else {
      setAllowedTypes([...allowedTypes, type]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError(null);

    try {
      const fullTitle = isProject ? `[Capstone Project] ${title.trim()}` : title.trim();

      const combinedInstructions = [
        instructions.trim(),
        attachmentsList.length > 0
          ? `\nReference Attachments:\n${attachmentsList.map((url) => `- ${url}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/trainer/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fullTitle,
          description: description.trim(),
          instructions: combinedInstructions,
          courseId: selectedCourseId,
          deadline: new Date(deadline).toISOString(),
          totalMarks: Number(totalMarks),
          allowedFileTypes: allowedTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create assignment");
      }

      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setInstructions("");
      setAttachmentsList([]);
      setSuccessMsg(
        `${isProject ? "Project" : "Assignment"} "${fullTitle}" deployed with full rubric and requirements!`
      );
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("An unexpected error occurred while saving.");
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
    if (!confirm(`Are you sure you want to delete "${assignmentTitle}"?`)) return;

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
            <FileCheck className="w-3.5 h-3.5" /> Project & Milestone Evaluation Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Assignments & Capstone Projects
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Author milestone assignments, set project specifications, define submission requirements, attach reference resources, and evaluate student deliverables with scoring marks.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Assignment / Project
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
          Loading assignments and capstone submissions...
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Assignments or Projects Created Yet</h3>
          <p className="text-xs text-slate-400">
            Click &quot;Create Assignment / Project&quot; above to deploy your first assessment task.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((a) => {
            const isCapProject = a.title.toLowerCase().includes("project") || a.title.toLowerCase().includes("capstone");

            return (
              <div
                key={a.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5 shadow-2xl relative group hover:border-purple-500/30 transition"
              >
                {/* Header Row: Title, Course, Marks, Deadline */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                          isCapProject
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {isCapProject ? "Project Track" : "Milestone Assignment"}
                      </span>
                      <span className="text-xs font-mono font-semibold text-amber-400">
                        Course: {a.course.title}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-xl text-white tracking-tight">{a.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{a.description}</p>
                  </div>

                  <div className="flex items-center gap-4 self-end lg:self-center">
                    <div className="text-right font-mono text-xs text-slate-400 shrink-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deadline: <strong className="text-white">{new Date(a.deadline).toLocaleDateString()}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Total Marks: <strong className="text-emerald-400 font-bold">{a.totalMarks} Pts</strong></span>
                      </div>
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

                {/* Instructions, Submission Requirements & Attachments Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Instructions */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-purple-400" /> Detailed Instructions:
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {a.instructions || a.description}
                    </p>
                  </div>

                  {/* Submission Requirements & Accepted File Formats */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5 text-cyan-400" /> Submission Requirements:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(a.allowedFileTypes || ["PDF", "ZIP", "GITHUB_URL"]).map((type, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-indigo-300 font-mono text-[11px] font-bold"
                        >
                          ✓ {type}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Max file size: {a.maxFileSizeMb || 25} MB • Evaluation rubric based on {a.totalMarks} marks.
                    </div>
                  </div>
                </div>

                {/* Student Submissions Matrix */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" /> Student Submissions ({a.submissions.length})
                    </span>
                  </div>

                  {a.submissions.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-3 px-4 rounded-2xl bg-slate-900/40 border border-slate-850 text-center">
                      No submissions received from learners yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 rounded-2xl bg-slate-900/50 border border-slate-800/80 overflow-hidden">
                      {a.submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/80 transition"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-white flex items-center gap-2">
                              {sub.user.name}{" "}
                              <span className="text-slate-500 font-mono text-[11px]">({sub.user.email})</span>
                            </div>
                            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                              <ExternalLink className="w-3 h-3 text-indigo-400" />
                              <span>Deliverable URL / File: </span>
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 underline truncate max-w-sm"
                              >
                                {sub.fileUrl}
                              </a>
                            </div>
                            {sub.feedback && (
                              <div className="text-emerald-400 font-bold flex items-center gap-1 font-mono pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Graded: {sub.feedback.marksAwarded} / {a.totalMarks} Pts • &quot;{sub.feedback.feedbackText}&quot;
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
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer shrink-0"
                          >
                            <Award className="w-3.5 h-3.5" /> {sub.feedback ? "Re-evaluate" : "Grade & Review"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment / Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" /> Deploy Assignment / Project
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
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

            <form onSubmit={handleCreateAssignment} className="space-y-5">
              {/* Type Switcher: Milestone Assignment vs Capstone Project */}
              <div className="flex gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProject(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    !isProject ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Milestone Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setIsProject(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    isProject ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400"
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5 inline mr-1.5" /> Capstone Project
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  {isProject ? "Project Title" : "Assignment Title"}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isProject
                      ? "e.g. Distributed Multi-Region Database Sharding System"
                      : "e.g. Next.js 15 Server Actions & RBAC Guards"
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                    Course Track
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

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
                    Total Marks (Points)
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

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Overview & Scope Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an executive summary of this project assignment..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                  Detailed Instructions & Grading Rubric
                </label>
                <textarea
                  rows={4}
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="1. Clone the starter repository...&#10;2. Implement unit tests...&#10;3. Submit live demo URL and GitHub pull request."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              {/* Submission Requirements Checklist */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Submission Requirements (Accepted Deliverable Types)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["GITHUB_URL", "LIVE_URL", "ZIP", "PDF", "DOCUMENT"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleAllowedType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
                        allowedTypes.includes(type)
                          ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {allowedTypes.includes(type) ? "✓ " : "+ "}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments / Reference Resources */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Attachments & Reference Material URLs
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://github.com/... or https://docs.google.com/..."
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    + Add Link
                  </button>
                </div>

                {attachmentsList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {attachmentsList.map((att, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-indigo-300 font-mono"
                      >
                        <span className="truncate max-w-md">{att}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(i)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                <Award className="w-5 h-5 text-purple-400" /> Grade Student Deliverable
              </h3>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div>Scholar: <strong className="text-white">{activeSubmission.user.name}</strong></div>
              <div>
                Deliverable Link:{" "}
                <a href={activeSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 underline">
                  {activeSubmission.fileUrl}
                </a>
              </div>
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

