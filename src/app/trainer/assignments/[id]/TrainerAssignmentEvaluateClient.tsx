"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Award, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

interface SubmissionItem {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  notes?: string | null;
  status: string;
  submittedAt: string;
  user: { id: string; name: string; email: string };
  feedback?: { marksAwarded: number; feedbackText: string } | null;
}

interface AssignmentData {
  id: string;
  title: string;
  totalMarks: number;
  submissions: SubmissionItem[];
}

export default function TrainerAssignmentEvaluateClient({ initialAssignment }: { initialAssignment: AssignmentData }) {
  const router = useRouter();
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<SubmissionItem | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openEvaluationModal = (sub: SubmissionItem) => {
    setEvaluatingSubmission(sub);
    setMarks(sub.feedback ? sub.feedback.marksAwarded : initialAssignment.totalMarks);
    setFeedbackText(sub.feedback ? sub.feedback.feedbackText : "Great work!");
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSubmission) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/trainer/assignments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: evaluatingSubmission.id,
          marksAwarded: Number(marks),
          feedbackText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to evaluate submission");

      showToast("success", "Submission evaluated and feedback saved!");
      setEvaluatingSubmission(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Student Submissions ({initialAssignment.submissions.length})</h2>

        {initialAssignment.submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Submission File</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Marks & Feedback</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {initialAssignment.submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{sub.user.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{sub.user.email}</div>
                    </td>
                    <td className="p-4 font-mono">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                      >
                        {sub.fileName} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        sub.status === "EVALUATED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">
                      {sub.feedback ? (
                        <div className="text-emerald-700 font-bold">
                          {sub.feedback.marksAwarded} / {initialAssignment.totalMarks} Marks
                        </div>
                      ) : (
                        <span className="text-slate-400">Not graded</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEvaluationModal(sub)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                      >
                        {sub.feedback ? "Edit Grade" : "Evaluate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">No student submissions received for this assignment yet.</div>
        )}
      </div>

      {/* Evaluation Modal */}
      {evaluatingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEvaluation} className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Evaluate Submission: {evaluatingSubmission.user.name}</h3>
              <button type="button" onClick={() => setEvaluatingSubmission(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Marks Awarded (Max: {initialAssignment.totalMarks}) *
                </label>
                <input
                  type="number"
                  required
                  max={initialAssignment.totalMarks}
                  min={0}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback & Comments *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide constructive feedback for the student..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEvaluatingSubmission(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Evaluation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
