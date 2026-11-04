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
  Image as ImageIcon,
  Link as LinkIcon,
  Paperclip,
} from "lucide-react";

interface AttachedAsset {
  id: string;
  url: string;
  name: string;
  type: "FILE" | "IMAGE" | "LINK";
}

interface SubmissionItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: string;
  submissionType?: string;
  attachmentUrls?: string[];
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

  const [submissionTab, setSubmissionTab] = useState<"FILE" | "IMAGE" | "LINK">("FILE");
  
  // Multi-attachment items list
  const [attachedAssets, setAttachedAssets] = useState<AttachedAsset[]>(() => {
    if (latestSubmission) {
      if (latestSubmission.attachmentUrls && latestSubmission.attachmentUrls.length > 0) {
        return latestSubmission.attachmentUrls.map((url, idx) => ({
          id: `initial-${idx}`,
          url,
          name: idx === 0 && latestSubmission.fileName ? latestSubmission.fileName : `Asset ${idx + 1}`,
          type: url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? "IMAGE" : url.startsWith("http") && !url.includes("imagekit") && !url.includes("cloudinary") ? "LINK" : "FILE",
        }));
      }
      if (latestSubmission.fileUrl) {
        return [{
          id: "initial-0",
          url: latestSubmission.fileUrl,
          name: latestSubmission.fileName || "Primary Deliverable",
          type: latestSubmission.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? "IMAGE" : latestSubmission.fileUrl.startsWith("http") && !latestSubmission.fileUrl.includes("imagekit") && !latestSubmission.fileUrl.includes("cloudinary") ? "LINK" : "FILE",
        }];
      }
    }
    return [];
  });

  const [linkInput, setLinkInput] = useState("");
  const [linkLabelInput, setLinkLabelInput] = useState("");
  const [notesInput, setNotesInput] = useState(latestSubmission?.notes || "");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-app document viewer state
  const [previewSubmissionUrl, setPreviewSubmissionUrl] = useState<{ url: string; title: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "FILE" | "IMAGE") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "assignments");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "File upload failed");
      }

      const newAsset: AttachedAsset = {
        id: `upload-${Date.now()}`,
        url: data.url,
        name: file.name,
        type: fileType,
      };

      setAttachedAssets((prev) => [...prev, newAsset]);
      showToast("success", `File "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) {
      showToast("error", "Please provide a valid web URL");
      return;
    }
    try {
      new URL(linkInput.trim());
    } catch {
      showToast("error", "Invalid URL format. Please start with http:// or https://");
      return;
    }

    const newAsset: AttachedAsset = {
      id: `link-${Date.now()}`,
      url: linkInput.trim(),
      name: linkLabelInput.trim() || linkInput.trim(),
      type: "LINK",
    };

    setAttachedAssets((prev) => [...prev, newAsset]);
    setLinkInput("");
    setLinkLabelInput("");
    showToast("success", "Project link added to submission package!");
  };

  const handleRemoveAsset = (id: string) => {
    setAttachedAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attachedAssets.length === 0) {
      showToast("error", "Please upload at least one PDF/document, image, or project link");
      return;
    }

    setSubmitting(true);
    try {
      const primaryAsset = attachedAssets[0];
      const allUrls = attachedAssets.map((a) => a.url);

      const res = await fetch(`/api/student/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: primaryAsset.url,
          fileName: primaryAsset.name || "assignment_package",
          notes: notesInput.trim() || undefined,
          submissionType: primaryAsset.type,
          attachmentUrls: allUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit assignment");

      showToast("success", "Assignment project package submitted successfully!");
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
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-[#E01E6A] shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-400">Current Submitted Solution Package</div>
                <div className="font-bold text-slate-900 text-sm truncate max-w-sm sm:max-w-md">
                  {latestSubmission.fileName || latestSubmission.fileUrl}
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Submitted: {formatDateSafe(latestSubmission.submittedAt)}</span>
                  {latestSubmission.attachmentUrls && latestSubmission.attachmentUrls.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                      {latestSubmission.attachmentUrls.length} Files Attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPreviewSubmissionUrl({ url: latestSubmission.fileUrl, title: latestSubmission.fileName || assignment.title })}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#7C248C]" />
                <span>Inspect Primary</span>
              </button>
            </div>
          </div>

          {latestSubmission.attachmentUrls && latestSubmission.attachmentUrls.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {latestSubmission.attachmentUrls.map((attUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewSubmissionUrl({ url: attUrl, title: `Attachment #${i + 1}` })}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/70 text-purple-800 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                  <span>Item #{i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submission Workspace Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {latestSubmission ? "Update / Resubmit Solution" : "Submit Project Solution"}
              </h2>
              <p className="text-xs text-slate-500">
                Upload PDFs, documents, screenshots/images, or provide project links & GitHub repositories.
              </p>
            </div>
          </div>

          {/* Submission Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSubmissionTab("FILE")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                submissionTab === "FILE"
                  ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" /> PDF / Doc
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab("IMAGE")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                submissionTab === "IMAGE"
                  ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Image / Notes
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab("LINK")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                submissionTab === "LINK"
                  ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Web / Repo Link
            </button>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Active Attached Assets List (Multi-Submission Badge Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-2">
                <span>Submitted Assets & Artifacts</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#7C248C] font-mono text-[10px] font-bold">
                  {attachedAssets.length} attached
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                You can attach multiple PDFs, photos, and links
              </span>
            </div>

            {attachedAssets.length > 0 ? (
              <div className="space-y-2">
                {attachedAssets.map((asset, idx) => (
                  <div
                    key={asset.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {asset.type === "IMAGE" ? (
                          <ImageIcon className="w-4 h-4 text-[#E01E6A]" />
                        ) : asset.type === "LINK" ? (
                          <LinkIcon className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {asset.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewSubmissionUrl({ url: asset.url, title: asset.name })}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No files or links added yet. Use the tabs below to add your project deliverables.</span>
              </div>
            )}
          </div>

          {/* TAB 1: PDF / DOCUMENT UPLOAD */}
          {submissionTab === "FILE" && (
            <div className="space-y-3 pt-2">
              <label className="font-bold text-slate-700 block">
                Attach Document (PDF, Word, PPT, ZIP)
              </label>

              <div className="p-5 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl bg-purple-50/30 text-center transition">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.txt"
                  onChange={(e) => handleFileUpload(e, "FILE")}
                  className="hidden"
                  disabled={uploadingFile}
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    {uploadingFile ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Paperclip className="w-6 h-6" />
                    )}
                  </div>
                  <div className="font-bold text-slate-800 text-xs">
                    {uploadingFile ? "Uploading document to cloud storage..." : "Click to select and attach document"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PDF, DOCX, PPTX, ZIP files are stored securely in cloud
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGE UPLOAD */}
          {submissionTab === "IMAGE" && (
            <div className="space-y-3 pt-2">
              <label className="font-bold text-slate-700 block">
                Attach Image / Handwritten Notes (PNG, JPG, WebP)
              </label>

              <div className="p-5 border-2 border-dashed border-pink-200 hover:border-pink-400 rounded-2xl bg-pink-50/30 text-center transition">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "IMAGE")}
                  className="hidden"
                  disabled={uploadingFile}
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#E01E6A] flex items-center justify-center">
                    {uploadingFile ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="font-bold text-slate-800 text-xs">
                    {uploadingFile ? "Uploading image to cloud storage..." : "Click to select and attach photo / diagram"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    High resolution images uploaded securely to cloud
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: WEB / REPO / CLOUD LINK */}
          {submissionTab === "LINK" && (
            <div className="space-y-3 pt-2">
              <label className="font-bold text-slate-700 block">
                Attach Project Repository or Hosted Demo Link
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://github.com/username/project or https://drive.google.com/..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Link label (e.g. GitHub Repository, Live Demo URL)"
                    value={linkLabelInput}
                    onChange={(e) => setLinkLabelInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="font-bold text-slate-700 block mb-1.5">Submission Notes & Remarks (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Key remarks, features completed, credentials or instructions for faculty"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted submission evaluated securely by JVM faculty.</span>
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingFile}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{latestSubmission ? "Update & Resubmit Deliverable" : "Submit Assignment Solution"}</span>
          </button>
        </div>
      </form>

      {/* ---------------- IN-APP DOCUMENT INSPECTION STUDIO MODAL ---------------- */}
      {previewSubmissionUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in">
          <div className="w-full max-w-5xl h-[88vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Inspection Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
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
                  return (
                    <div className="w-full h-full rounded-2xl bg-white border border-slate-200 overflow-hidden relative shadow-inner">
                      <iframe
                        src={`${url}#toolbar=1&navpanes=0`}
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
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono shrink-0">
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

