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
} from "lucide-react";

interface SubmissionItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: string;
  submittedAt: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit assignment");

      showToast("success", "Assignment project submitted successfully!");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/student/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assignments
        </Link>
      </div>

      {/* Assignment Overview Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {assignment.course.title}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{assignment.title}</h1>
          </div>

          <div className="text-right font-mono text-xs space-y-1">
            <div className="text-rose-600 font-bold">Deadline: {new Date(assignment.deadline).toLocaleDateString()}</div>
            <div className="text-slate-500 font-bold">{assignment.totalMarks} Total Marks</div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100">
          {assignment.description}
        </p>
      </div>

      {/* Feedback Banner if Evaluated or Revision Requested */}
      {latestSubmission && (
        <div className={`p-6 rounded-3xl border space-y-3 ${
          latestSubmission.status === "RESUBMISSION_REQUESTED"
            ? "bg-amber-50/90 border-amber-300 text-amber-900"
            : latestSubmission.feedback
            ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
            : "bg-purple-50/70 border-purple-200 text-purple-900"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-[#7C248C]" /> 
              {latestSubmission.status === "RESUBMISSION_REQUESTED"
                ? "Trainer Review: Revision Requested"
                : latestSubmission.feedback
                ? "Trainer Evaluation & Grade"
                : "Submission Under Review"}
            </h3>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
              latestSubmission.status === "RESUBMISSION_REQUESTED"
                ? "bg-amber-500 text-white"
                : latestSubmission.feedback
                ? "bg-emerald-600 text-white"
                : "bg-purple-600 text-white"
            }`}>
              {latestSubmission.feedback
                ? `${latestSubmission.feedback.marksAwarded} / ${assignment.totalMarks} Marks`
                : latestSubmission.status}
            </span>
          </div>

          {latestSubmission.feedback && (
            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/60 text-xs space-y-1">
              <div className="font-semibold text-slate-700">
                Evaluator: <span className="text-slate-900 font-bold">{latestSubmission.feedback.trainer?.name || "Trainer"}</span>
              </div>
              <div className="text-slate-800">
                Remarks: <span className="italic font-medium text-slate-900">"{latestSubmission.feedback.feedbackText}"</span>
              </div>
            </div>
          )}

          {latestSubmission.status === "RESUBMISSION_REQUESTED" && (
            <p className="text-xs font-semibold text-amber-800">
              ⚠️ The trainer reviewed your solution and requested changes. Please review their remarks above and upload your revised work below.
            </p>
          )}
        </div>
      )}

      {/* Submission Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-rose-600" /> Upload / Submit Project Solution
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Project File URL / GitHub Link / Google Drive Link *</label>
            <input
              type="url"
              required
              placeholder="https://github.com/username/project or https://drive.google.com/..."
              value={fileUrlInput}
              onChange={(e) => setFileUrlInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">File Name / Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g. System_Design_Submission.pdf"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          {latestSubmission ? (
            <span className="text-[11px] font-mono text-slate-500">
              Last submitted on {new Date(latestSubmission.submittedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-400">Not submitted yet</span>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {latestSubmission ? "Update / Resubmit Solution" : "Submit Assignment Solution"}
          </button>
        </div>
      </form>
    </div>
  );
}
