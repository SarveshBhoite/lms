"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Upload, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function StudentAssignmentSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [projectUrl, setProjectUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
      <Link href="/student/assignments" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h1 className="text-2xl font-bold text-white">Capstone Milestone 1: Secure Auth & RBAC Architecture</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Implement a full authentication module with student/trainer/admin roles, Next.js Middleware guards, and verifiable token handling.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
          <span>Max Marks: <strong className="text-white">100 pts</strong></span>
          <span>Allowed: <strong className="text-white font-mono">ZIP, PDF, DOCX, GITHUB</strong></span>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Assignment Submitted!</h2>
          <p className="text-sm text-emerald-300">
            Your project submission has been received and routed to your lead instructor for grading.
          </p>
          <div className="pt-4">
            <Link
              href="/student/assignments"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Return to Assignments
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" /> Submit Your Solution
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              GitHub Repository or Cloud Drive URL
            </label>
            <input
              type="url"
              required
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://github.com/username/project-repo"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Submission Notes & Architecture Remarks
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your implementation, test commands, or special instructions for the instructor..."
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Solution"}
          </button>
        </form>
      )}
    </div>
  );
}
