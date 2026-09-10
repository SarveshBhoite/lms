"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  FileCheck,
  Award,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Users,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Save,
  Search,
  Filter,
  Check,
  FileText,
  AlertCircle,
  Download,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  notes?: string | null;
  status: string;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
  };
  feedback?: {
    id: string;
    marksAwarded: number;
    feedbackText: string;
    evaluatedAt: string;
    trainerName: string;
  } | null;
}

interface BatchOption {
  id: string;
  name: string;
  status: string;
}

interface AssignmentData {
  id: string;
  courseId: string;
  batchIds: string[];
  title: string;
  description: string;
  instructions?: string | null;
  deadline: string | null;
  totalMarks: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  createdAt: string;
  course: {
    id: string;
    title: string;
    batches: BatchOption[];
  };
  lesson?: {
    id: string;
    title: string;
    module: { title: string };
  } | null;
  submissions: SubmissionItem[];
}

export default function TrainerAssignmentEvaluateClient({
  initialAssignment,
}: {
  initialAssignment: AssignmentData;
}) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssignmentData>(initialAssignment);
  const [activeTab, setActiveTab] = useState<"submissions" | "settings">("submissions");

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    title: initialAssignment.title,
    description: initialAssignment.description,
    instructions: initialAssignment.instructions || "",
    deadline: initialAssignment.deadline ? initialAssignment.deadline.split("T")[0] : "",
    totalMarks: initialAssignment.totalMarks,
    allowedFileTypes: initialAssignment.allowedFileTypes.join(", "),
    maxFileSizeMb: initialAssignment.maxFileSizeMb,
    batchIds: initialAssignment.batchIds || [],
  });

  // Evaluation modal state
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<SubmissionItem | null>(null);
  const [marks, setMarks] = useState<number>(initialAssignment.totalMarks);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [evalStatus, setEvalStatus] = useState<string>("EVALUATED");

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "EVALUATED" | "RESUBMISSION_REQUESTED">("ALL");

  // Loading & toast states
  const [submittingEval, setSubmittingEval] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KPIs
  const totalSubmissions = assignment.submissions.length;
  const evaluatedSubmissions = assignment.submissions.filter((s) => s.status === "EVALUATED");
  const pendingSubmissions = assignment.submissions.filter((s) => s.status === "SUBMITTED");
  const revisionSubmissions = assignment.submissions.filter((s) => s.status === "RESUBMISSION_REQUESTED");

  const averageMarksAwarded =
    evaluatedSubmissions.length > 0
      ? (
          evaluatedSubmissions.reduce((acc, s) => acc + (s.feedback?.marksAwarded || 0), 0) /
          evaluatedSubmissions.length
        ).toFixed(1)
      : null;

  // Batch toggle in settings
  const toggleBatch = (batchId: string) => {
    setSettingsForm((prev) => {
      const exists = prev.batchIds.includes(batchId);
      return {
        ...prev,
        batchIds: exists ? prev.batchIds.filter((id) => id !== batchId) : [...prev.batchIds, batchId],
      };
    });
  };

  // Open modal
  const openEvaluationModal = (sub: SubmissionItem) => {
    setEvaluatingSubmission(sub);
    setMarks(sub.feedback ? sub.feedback.marksAwarded : assignment.totalMarks);
    setFeedbackText(sub.feedback ? sub.feedback.feedbackText : "Great work! Well implemented solution.");
    setEvalStatus(sub.status === "RESUBMISSION_REQUESTED" ? "RESUBMISSION_REQUESTED" : "EVALUATED");
  };

  // Submit evaluation
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSubmission) return;

    setSubmittingEval(true);
    try {
      const res = await fetch("/api/trainer/assignments/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: evaluatingSubmission.id,
          marksAwarded: Number(marks),
          feedbackText,
          status: evalStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to evaluate submission");
      }

      showToast("success", `Evaluation recorded for ${evaluatingSubmission.user.name}!`);

      // Update local state
      setAssignment((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) => {
          if (s.id === evaluatingSubmission.id) {
            return {
              ...s,
              status: evalStatus,
              feedback: {
                id: s.feedback?.id || "temp-id",
                marksAwarded: Number(marks),
                feedbackText,
                evaluatedAt: new Date().toISOString(),
                trainerName: "Lead Faculty",
              },
            };
          }
          return s;
        }),
      }));

      setEvaluatingSubmission(null);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save evaluation");
    } finally {
      setSubmittingEval(false);
    }
  };

  // Save Assignment Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const allowedTypes = settingsForm.allowedFileTypes
        .split(",")
        .map((s) => s.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean);

      const res = await fetch(`/api/trainer/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settingsForm.title,
          description: settingsForm.description,
          instructions: settingsForm.instructions,
          deadline: settingsForm.deadline ? new Date(settingsForm.deadline).toISOString() : null,
          totalMarks: Number(settingsForm.totalMarks),
          allowedFileTypes: allowedTypes.length > 0 ? allowedTypes : ["pdf", "zip", "docx"],
          maxFileSizeMb: Number(settingsForm.maxFileSizeMb),
          batchIds: settingsForm.batchIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update assignment settings");
      }

      setAssignment((prev) => ({
        ...prev,
        ...data.data,
      }));

      showToast("success", "Assignment settings and cohort scopes updated!");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = assignment.submissions.filter((sub) => {
    const matchesSearch =
      sub.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isOverdue = assignment.deadline ? new Date(assignment.deadline).getTime() < Date.now() : false;

  return (
    <div className="space-y-8">
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

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/trainer/assignments"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7C248C] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assignments Catalog
        </Link>
      </div>

      {/* Compact Studio Header Banner (~10% vh) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-pink-50/40 to-purple-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-pink-400/10 to-purple-500/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7C248C] to-[#E01E6A] border border-white/40 shrink-0 shadow-sm flex items-center justify-center text-white">
            <FileCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E01E6A] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#E01E6A]" /> Project Evaluation Cockpit
              </span>
              {assignment.lesson ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  Self-Paced Lesson Task
                </span>
              ) : (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    assignment.deadline
                      ? isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {assignment.deadline
                    ? isOverdue
                      ? "Deadline Passed"
                      : `Due: ${new Date(assignment.deadline).toLocaleDateString()}`
                    : "No Deadline"}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {assignment.title}
            </h1>
            <p className="text-slate-500 text-xs font-mono flex items-center gap-2 flex-wrap">
              <span>Course: <strong className="text-slate-800">{assignment.course.title}</strong></span>
              {assignment.lesson && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                    Lesson: {assignment.lesson.module?.title ? `${assignment.lesson.module.title} • ` : ""}{assignment.lesson.title}
                  </span>
                </>
              )}
              {assignment.batchIds.length > 0 && (
                <>
                  <span>•</span>
                  <span>Targeting {assignment.batchIds.length} Cohort Batches</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-pink-200/80 text-[#E01E6A] shadow-2xs">
            {assignment.totalMarks} Total Marks
          </span>
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            Max: {assignment.maxFileSizeMb}MB
          </span>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Submissions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{totalSubmissions}</span>
            <span className="text-[11px] font-mono text-slate-400">Total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Review
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{pendingSubmissions.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Ungraded</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Graded & Done
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{evaluatedSubmissions.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-500" /> Revisions
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{revisionSubmissions.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Requested</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#E01E6A]" /> Average Score
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#E01E6A]">
              {averageMarksAwarded !== null ? `${averageMarksAwarded}` : "—"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ {assignment.totalMarks}m</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "submissions"
              ? "border-[#E01E6A] text-[#E01E6A] bg-pink-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 text-[#E01E6A]" /> Student Deliverables & Gradebook ({totalSubmissions})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "border-[#7C248C] text-[#7C248C] bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4 text-[#7C248C]" /> Project Parameters & Cohort Scoping
        </button>
      </div>

      {/* ---------------- TAB 1: SUBMISSIONS & GRADEBOOK ---------------- */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, email, or submitted file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0 text-slate-500 text-xs font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Status:
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-[#E01E6A] cursor-pointer shrink-0"
              >
                <option value="ALL">All Submissions ({totalSubmissions})</option>
                <option value="SUBMITTED">Pending Review ({pendingSubmissions.length})</option>
                <option value="EVALUATED">Graded ({evaluatedSubmissions.length})</option>
                <option value="RESUBMISSION_REQUESTED">Revision Needed ({revisionSubmissions.length})</option>
              </select>
            </div>
          </div>

          {/* Submissions Table List */}
          {filteredSubmissions.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                    <tr>
                      <th className="p-4 font-bold">Student</th>
                      <th className="p-4 font-bold">Submitted Deliverable</th>
                      <th className="p-4 font-bold">Submission Date</th>
                      <th className="p-4 font-bold">Evaluation Status</th>
                      <th className="p-4 font-bold">Marks Awarded</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                              {sub.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{sub.user.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{sub.user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#E01E6A] hover:text-[#c4155a] font-bold flex items-center gap-1.5 transition"
                            title="Open / Download Deliverable"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">{sub.fileName}</span>
                            <Download className="w-3 h-3 text-slate-400" />
                          </a>
                          {sub.notes && (
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-1 italic">
                              "{sub.notes}"
                            </p>
                          )}
                        </td>

                        <td className="p-4 font-mono text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString()}{" "}
                          <span className="text-[10px] text-slate-400">
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono border ${
                              sub.status === "EVALUATED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : sub.status === "RESUBMISSION_REQUESTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {sub.status === "EVALUATED"
                              ? "GRADED"
                              : sub.status === "RESUBMISSION_REQUESTED"
                              ? "REVISION NEEDED"
                              : "PENDING REVIEW"}
                          </span>
                        </td>

                        <td className="p-4 font-mono">
                          {sub.feedback ? (
                            <div>
                              <strong className="text-emerald-700 text-sm font-extrabold">
                                {sub.feedback.marksAwarded} / {assignment.totalMarks}
                              </strong>
                              {sub.feedback.feedbackText && (
                                <p className="text-[10px] text-slate-500 font-sans line-clamp-1 mt-0.5">
                                  {sub.feedback.feedbackText}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans italic">Not graded yet</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => openEvaluationModal(sub)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer ${
                              sub.feedback
                                ? "bg-purple-50 hover:bg-purple-100 text-[#7C248C] border border-purple-200"
                                : "jvm-gradient-bg jvm-gradient-hover text-white"
                            }`}
                          >
                            {sub.feedback ? "Edit Grade" : "Evaluate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No submissions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "No student deliverables matched your search filters."
                  : "Once enrolled students upload their solution deliverables, they will appear here for grading."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: ASSIGNMENT SETTINGS & COHORT SCOPING ---------------- */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-4 h-4 text-[#7C248C]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-mono">
                Assignment Configuration & Batch Scoping
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 font-mono">Submission Deadline</label>
                <input
                  type="date"
                  value={settingsForm.deadline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Deliverables Description & Overview</label>
              <textarea
                rows={3}
                required
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Detailed Instructions & Grading Rubric</label>
              <textarea
                rows={4}
                value={settingsForm.instructions}
                onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-mono">Total Marks</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={settingsForm.totalMarks}
                  onChange={(e) => setSettingsForm({ ...settingsForm, totalMarks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-mono">Max File Size (MB)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={settingsForm.maxFileSizeMb}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxFileSizeMb: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-[#7C248C]"
                />
              </div>
            </div>

            {/* Batch Cohort Targeting */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">
                    Assigned Cohort Batches
                  </label>
                  <p className="text-[11px] text-slate-500">
                    If no batches are chosen, this project is accessible by all students enrolled in "{assignment.course.title}".
                  </p>
                </div>

                {assignment.course.batches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (settingsForm.batchIds.length === assignment.course.batches.length) {
                        setSettingsForm((prev) => ({ ...prev, batchIds: [] }));
                      } else {
                        setSettingsForm((prev) => ({
                          ...prev,
                          batchIds: assignment.course.batches.map((b) => b.id),
                        }));
                      }
                    }}
                    className="text-[11px] font-bold text-[#7C248C] hover:underline cursor-pointer"
                  >
                    {settingsForm.batchIds.length === assignment.course.batches.length
                      ? "Clear All"
                      : "Select All Batches"}
                  </button>
                )}
              </div>

              {assignment.course.batches.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {assignment.course.batches.map((b) => {
                    const isSelected = settingsForm.batchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBatch(b.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-pink-50/80 border-[#E01E6A] text-[#E01E6A] shadow-2xs font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold truncate">{b.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase">{b.status}</div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#E01E6A] border-[#E01E6A] text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
                  No cohort batches configured for this course.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Parameters & Scoping</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Evaluation & Grading Modal */}
      {evaluatingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEvaluation}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Grade Submission: {evaluatingSubmission.user.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">{evaluatingSubmission.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingSubmission(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Marks Awarded (Max: {assignment.totalMarks} Marks) *
                </label>
                <input
                  type="number"
                  required
                  max={assignment.totalMarks}
                  min={0}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#E01E6A] shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Evaluation Decision / Status *</label>
                <select
                  value={evalStatus}
                  onChange={(e) => setEvalStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#E01E6A] shadow-xs cursor-pointer"
                >
                  <option value="EVALUATED">Approved & Graded (Score Published)</option>
                  <option value="RESUBMISSION_REQUESTED">Needs Revision (Allow Student to Resubmit)</option>
                  <option value="SUBMITTED">Keep Under Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feedback Remarks & Critique *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed, constructive critique, highlighting strengths and improvements..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-[#E01E6A] shadow-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvaluatingSubmission(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEval}
                className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {submittingEval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                <span>Submit Evaluation & Notify</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

