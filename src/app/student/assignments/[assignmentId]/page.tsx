"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Award,
} from "lucide-react";

export default function StudentAssignmentSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [projectUrl, setProjectUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResubmission, setIsResubmission] = useState(false);

  // Past feedback mock/db state
  const [pastFeedback, setPastFeedback] = useState<{
    marks: number;
    total: number;
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/student/assignment-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          projectUrl,
          notes,
          fileName: "Project Deliverable / GitHub Repository",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit assignment");
      }

      setSubmitted(true);
      setIsResubmission(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while submitting.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      {/* Assignment Details */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-wider block mb-1">
          Technical Milestone
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Capstone Milestone 1: Authentication & RBAC Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Build and deploy a full authentication module featuring student and admin roles, Next.js Middleware guards, and verifiable token handling. Include instructions for local reproduction and testing credentials.
        </p>

        <div className="flex flex-wrap gap-4 pt-3 text-xs text-slate-300 border-t border-slate-800/80 font-mono">
          <span>Max Marks: <strong className="text-white">100 pts</strong></span>
          <span>Accepted Formats: <strong className="text-white">GitHub Repo, Vercel URL, Cloud Drive</strong></span>
        </div>
      </div>

      {pastFeedback && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 shadow-xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Award className="w-5 h-5 text-emerald-400" /> Instructor Evaluation: {pastFeedback.marks} /{" "}
            {pastFeedback.total} Marks
          </div>
          <p className="text-xs text-slate-300">&ldquo;{pastFeedback.text}&rdquo;</p>
        </div>
      )}

      {submitted && !isResubmission ? (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/30 text-center space-y-4 bg-emerald-500/10 shadow-2xl">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-extrabold text-white">Assignment Submitted Successfully!</h2>
          <p className="text-xs sm:text-sm text-emerald-300 max-w-md mx-auto leading-relaxed">
            Your deliverable has been recorded in the institute repository and routed to your faculty lead for review.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto text-left text-xs font-mono">
            <span className="text-slate-500 block mb-1 uppercase font-bold text-[10px]">Submitted URL:</span>
            <a
              href={projectUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline flex items-center gap-1 break-all"
            >
              {projectUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsResubmission(true)}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Submit Revised Version
            </button>

            <Link
              href="/student/assignments"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20"
            >
              Return to Assignments
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              {isResubmission ? "Submit Updated Milestone Deliverable" : "Submit Your Deliverable"}
            </h2>

            {isResubmission && (
              <button
                type="button"
                onClick={() => setIsResubmission(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel Resubmission
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              GitHub Repository / Cloud Drive URL
            </label>
            <input
              type="url"
              required
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://github.com/username/capstone-project"
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Submission Remarks & Release Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your design choices, environment setup instructions, and key accomplishments for the instructor..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isResubmission ? (
              "Upload Revised Solution to Instructor"
            ) : (
              "Submit Milestone for Faculty Evaluation"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
