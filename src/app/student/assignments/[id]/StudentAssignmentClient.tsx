"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  FileCheck,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  MessageSquare,
  Award,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
  FileCode,
  Eye,
  X,
  AlertCircle,
  FolderGit2,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: string;
  submittedAt: string;
  notes?: string | null;
  feedback?: { marksAwarded: number; feedbackText: string; trainer: { name: string } } | null;
}

interface AssignmentDetailData {
  id: string;
  title: string;
  description: string;
  deadline: string;
  totalMarks: number;
  course: { id: string; title: string };
  submissions: SubmissionItem[];
}

// Deterministic hydration-safe date formatting helper
function formatDateSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function StudentAssignmentClient({
  initialAssignment,
  currentUserId,
}: {
  initialAssignment: AssignmentDetailData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssignmentDetailData>(initialAssignment);
  const latestSubmission = assignment.submissions[0] || null;

  const [fileUrlInput, setFileUrlInput] = useState(latestSubmission?.fileUrl || "");
  const [fileNameInput, setFileNameInput] = useState(latestSubmission?.fileName || "");
  const [notesInput, setNotesInput] = useState(latestSubmission?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-app document viewer state
  const [previewSubmissionUrl, setPreviewSubmissionUrl] = useState<{ url: string; title: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrlInput.trim()) {
      showToast("error", "Please provide a valid file or project URL");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: fileUrlInput.trim(),
          fileName: fileNameInput.trim() || "project_submission.pdf",
          notes: notesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit assignment");

      showToast("success", "Assignment project deliverable submitted successfully!");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const isEvaluated = latestSubmission?.status === "EVALUATED" && latestSubmission.feedback != null;
  const isRevision = latestSubmission?.status === "RESUBMISSION_REQUESTED";
  const isPendingReview = latestSubmission && !isEvaluated && !isRevision;

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-5xl w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#E01E6A] px-3 py-2 rounded-xl hover:bg-slate-100/80 transition group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Assignments</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-pink-50 text-[#E01E6A] border border-pink-200/80">
            {assignment.course.title}
          </span>
        </div>
      </div>

      {/* Assignment Overview Studio Card */}
      <div className="glass-card rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs relative">
        <div className="h-2 w-full jvm-gradient-bg" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                <FileCheck className="w-3.5 h-3.5 text-[#E01E6A]" />
                Project Deliverable Brief
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {assignment.title}
              </h1>
            </div>

            {/* Spec Badges */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
              <div className="px-4 py-2 rounded-2xl bg-pink-50 border border-pink-200/60 text-right">
                <div className="text-[10px] uppercase font-mono font-bold text-[#E01E6A]">Submission Deadline</div>
                <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#E01E6A]" />
                  {assignment.deadline ? formatDateSafe(assignment.deadline) : "Flexible"}
                </div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200/60 text-right">
                <div className="text-[10px] uppercase font-mono font-bold text-[#7C248C]">Total Weight</div>
                <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-[#7C248C]" />
                  {assignment.totalMarks} Points
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-normal">
            {assignment.description || "Implement the specified requirements and submit your solution link or deliverables below."}
          </div>
        </div>
      </div>

      {/* Evaluation & Feedback Card (if evaluated or revision requested) */}
      {latestSubmission && (
        <div
          className={`glass-card p-6 sm:p-7 rounded-3xl border transition-all ${
            isRevision
              ? "bg-amber-50/70 border-amber-300 text-amber-950"
              : isEvaluated
              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
              : "bg-purple-50/50 border-purple-200 text-purple-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isRevision
                    ? "bg-amber-500 text-white"
                    : isEvaluated
                    ? "bg-emerald-600 text-white"
                    : "jvm-gradient-bg text-white"
                }`}
              >
                {isRevision ? <AlertTriangle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isRevision
                    ? "Faculty Review: Revision Requested"
                    : isEvaluated
                    ? "Faculty Evaluation & Graded Score"
                    : "Submission Active: Under Faculty Review"}
                </h3>
                <p className="text-xs opacity-75 font-medium">
                  {isRevision
                    ? "Please review feedback remarks and provide an updated solution."
                    : isEvaluated
                    ? "Your submission has been formally scored and reviewed."
                    : "The instructional team is currently evaluating your code and solution."}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span
                className={`text-xs font-mono font-bold px-4 py-2 rounded-2xl border flex items-center gap-1.5 ${
                  isRevision
                    ? "bg-amber-500 text-white border-amber-600"
                    : isEvaluated
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-[#7C248C] border-purple-200 shadow-2xs"
                }`}
              >
                {latestSubmission.feedback
                  ? `${latestSubmission.feedback.marksAwarded} / ${assignment.totalMarks} Marks`
                  : latestSubmission.status}
              </span>
            </div>
          </div>

          {/* Feedback details */}
          {latestSubmission.feedback && (
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-2.5 text-xs text-slate-800 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Evaluated By:</span>
                <span className="font-bold text-slate-900">{latestSubmission.feedback.trainer?.name || "Lead Instructor"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 block">Trainer Remarks:</span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 italic text-slate-900 font-medium leading-relaxed">
                  &ldquo;{latestSubmission.feedback.feedbackText}&rdquo;
                </div>
              </div>
            </div>
          )}

          {isRevision && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300/80 text-xs font-medium text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Action Required: The faculty requested changes. Review their remarks above, refine your work, and upload your revised project URL below.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Submitted Artifact Viewer Bar (If already submitted) */}
      {latestSubmission && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-[#E01E6A] shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Current Submitted Solution</div>
              <div className="font-bold text-slate-900 text-sm truncate max-w-sm sm:max-w-md">
                {latestSubmission.fileName || latestSubmission.fileUrl}
              </div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Submitted: {formatDateSafe(latestSubmission.submittedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {/* Safe In-App Inspect Button (No download prompt) */}
            <button
              type="button"
              onClick={() => setPreviewSubmissionUrl({ url: latestSubmission.fileUrl, title: latestSubmission.fileName || assignment.title })}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#7C248C]" />
              <span>Inspect in Studio</span>
            </button>
          </div>
        </div>
      )}

      {/* Submission Workspace Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {latestSubmission ? "Update / Resubmit Solution" : "Submit Project Solution"}
              </h2>
              <p className="text-xs text-slate-500">
                Provide your GitHub repository, hosted demo link, or Google Drive / PDF URL.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Self-Verified Links
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Project Deliverable URL (GitHub, Hosted Demo, Google Drive, or PDF) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/username/project or https://drive.google.com/..."
              value={fileUrlInput}
              onChange={(e) => setFileUrlInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">File / Project Display Label</label>
              <input
                type="text"
                placeholder="e.g. FullStack_Capstone_Final.pdf"
                value={fileNameInput}
                onChange={(e) => setFileNameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Submission Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Features implemented, credentials, or remarks"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted submission evaluated securely by JVM faculty.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{latestSubmission ? "Update & Resubmit Deliverable" : "Submit Assignment Solution"}</span>
          </button>
        </div>
      </form>

      {/* ---------------- IN-APP DOCUMENT INSPECTION STUDIO MODAL ---------------- */}
      {previewSubmissionUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="w-full max-w-5xl h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Inspection Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl jvm-gradient-bg flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-white" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/20 text-pink-200">
                    JVM Protected Viewer
                  </span>
                  <h3 className="font-extrabold text-white text-sm sm:text-base truncate mt-0.5">
                    {previewSubmissionUrl.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSubmissionUrl(null)}
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-rose-600 hover:text-white flex items-center justify-center text-slate-200 transition cursor-pointer"
                  title="Close Studio Viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-App Viewer Content Container */}
            <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden relative flex flex-col">
              {(() => {
                const url = previewSubmissionUrl.url || "";
                const isPdf = url.toLowerCase().includes(".pdf");
                const isDrive = url.includes("drive.google.com");
                const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

                if (isDrive) {
                  const previewUrl = url.replace(/\/view.*$/, "/preview").replace(/\/edit.*$/, "/preview");
                  return (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full rounded-2xl bg-white border border-slate-200 shadow-inner"
                      title={previewSubmissionUrl.title}
                      allow="autoplay"
                    />
                  );
                }

                if (isImage) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-slate-50 rounded-2xl">
                      <img
                        src={url}
                        alt={previewSubmissionUrl.title}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-md pointer-events-none"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                  );
                }

                if (isPdf) {
                  const viewerUrl = url.startsWith("http")
                    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                    : `${url}#toolbar=0&navpanes=0`;

                  return (
                    <div className="w-full h-full rounded-2xl bg-white border border-slate-200 overflow-hidden relative shadow-inner">
                      <iframe
                        src={viewerUrl}
                        className="w-full h-full border-0"
                        title={previewSubmissionUrl.title}
                      />
                    </div>
                  );
                }

                return (
                  <iframe
                    src={url}
                    className="w-full h-full rounded-2xl bg-white border border-slate-200 shadow-inner"
                    title={previewSubmissionUrl.title}
                  />
                );
              })()}
            </div>

            {/* Bottom Inspection Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected Deliverable Inspection Active &bull; External Downloads Blocked</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSubmissionUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Close Studio Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

