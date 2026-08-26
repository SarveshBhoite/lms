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
  Calendar,
  Clock,
  Check,
} from "lucide-react";

interface AssignmentDetails {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  totalMarks: number;
  deadline: string;
  allowedFileTypes: string[];
  course: { id: string; title: string };
  submission?: {
    id: string;
    fileUrl: string;
    notes: string | null;
    status: string;
    submittedAt: string;
    feedback?: {
      marksAwarded: number;
      feedbackText: string;
    } | null;
  } | null;
}

export default function StudentAssignmentSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [projectUrl, setProjectUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResubmission, setIsResubmission] = useState(false);

  const fetchAssignmentData = async () => {
    try {
      setPageLoading(true);
      const res = await fetch("/api/student/assignment-submit?assignmentId=" + assignmentId);
      const data = await res.json();

      if (data.success && data.assignment) {
        setAssignment(data.assignment);
        if (data.assignment.submission) {
          setProjectUrl(data.assignment.submission.fileUrl || "");
          setNotes(data.assignment.submission.notes || "");
          setSubmitted(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl.trim()) {
      setError("Please provide a valid project URL, GitHub link, or cloud file.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/student/assignment-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          projectUrl: projectUrl.trim(),
          notes: notes.trim(),
          fileName: "Project Solution Deliverable",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit assignment deliverable.");
      }

      setSubmitted(true);
      setIsResubmission(false);
      setSuccessMsg("Your project deliverable has been successfully submitted to your instructor!");
      await fetchAssignmentData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while submitting.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-4xl mx-auto glass-panel mt-12 rounded-3xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
        Loading assignment workspace...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-8">
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course Assignments
      </Link>

      {/* Assignment Details */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-wider block">
            Course Track: {assignment?.course?.title || "Full-Stack Web Development"}
          </span>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Deadline: {assignment?.deadline ? new Date(assignment.deadline).toLocaleDateString() : "TBD"}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          {assignment?.title || "Milestone Deliverable"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {assignment?.description || "Deploy and submit your technical project repository satisfying all milestone criteria."}
        </p>

        {assignment?.instructions && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <div className="text-[10px] font-bold uppercase font-mono text-indigo-400">
              Instructor Instructions & Evaluation Rubric:
            </div>
            <p className="whitespace-pre-line leading-relaxed font-sans">{assignment.instructions}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-3 text-xs text-slate-300 border-t border-slate-800/80 font-mono">
          <span>Max Marks: <strong className="text-emerald-400 font-bold">{assignment?.totalMarks || 100} pts</strong></span>
          <span>
            Allowed Formats:{" "}
            <strong className="text-indigo-300">
              {assignment?.allowedFileTypes?.join(", ") || "GITHUB_URL, LIVE_URL, ZIP, PDF"}
            </strong>
          </span>
        </div>
      </div>

      {/* Feedback Alert if Graded */}
      {assignment?.submission?.feedback && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 shadow-xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Award className="w-5 h-5 text-emerald-400" /> Instructor Evaluation: {assignment.submission.feedback.marksAwarded} /{" "}
            {assignment.totalMarks} Marks
          </div>
          <p className="text-xs text-slate-300">&ldquo;{assignment.submission.feedback.feedbackText}&rdquo;</p>
        </div>
      )}

      {submitted && !isResubmission ? (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/30 text-center space-y-4 bg-emerald-500/10 shadow-2xl">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-extrabold text-white">Assignment Submitted Successfully!</h2>
          <p className="text-xs sm:text-sm text-emerald-300 max-w-md mx-auto leading-relaxed">
            Your deliverable has been recorded and submitted to your faculty instructor for review.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto text-left text-xs font-mono">
            <span className="text-slate-500 block mb-1 uppercase font-bold text-[10px]">Submitted Deliverable URL:</span>
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

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              GitHub Repository / Live Demo / Cloud URL *
            </label>
            <input
              type="url"
              required
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://github.com/username/capstone-project or https://drive.google.com/..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Submission Remarks & Testing Notes (Optional)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your implementation features, test commands, and key accomplishments for the instructor..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
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

