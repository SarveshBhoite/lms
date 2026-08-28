"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code,
  Eye,
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  FileCode,
  Link as LinkIcon,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  FolderOpen,
  FileSpreadsheet,
  Download,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List as ListIcon,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Terminal,
} from "lucide-react";

export interface LessonResource {
  id?: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface HtmlLessonEditorProps {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonId?: string; // If editing
  initialData?: {
    title: string;
    description: string;
    contentType: "TEXT" | "VIDEO" | "PDF" | "PPT" | "DOC" | "CODE" | "LINK";
    contentUrl: string;
    textContent: string; // HTML content
    durationMinutes: number;
    isFreePreview: boolean;
    resources: LessonResource[];
  };
  backUrl: string; // e.g. /admin/courses/[id] or /trainer/courses/[id]
  apiBaseUrl: string; // e.g. /api/admin/courses/[id]/modules/[moduleId]/lessons
}

const DEFAULT_HTML_TEMPLATE = `<h2>1. Introduction to the Topic</h2>
<p>Welcome to this lesson! In this session, you will learn the core fundamentals and explore practical, hands-on examples.</p>

<div style="background: linear-gradient(135deg, rgba(30,43,136,0.06), rgba(124,36,140,0.06)); padding: 20px; border-radius: 16px; border-left: 4px solid #7C248C; margin: 20px 0;">
  <strong style="color: #1E2B88; font-size: 15px;">💡 Key Learning Objective</strong>
  <p style="margin: 6px 0 0 0; color: #475569;">Understand architectural best practices and write scalable code with industry standards.</p>
</div>

<h3>2. Core Concepts & Implementation</h3>
<p>Below is a structured code sample demonstrating the concept in action:</p>

<pre><code class="language-javascript">// Example Implementation
function processTransaction(payload) {
  console.log("Processing payload with JVM standards...", payload);
  return { status: "SUCCESS", timestamp: new Date() };
}</code></pre>

<h3>3. Step-by-Step Breakdown</h3>
<ul>
  <li><strong>Step 1:</strong> Initialize configuration and environment settings.</li>
  <li><strong>Step 2:</strong> Execute business logic with strict error handling.</li>
  <li><strong>Step 3:</strong> Persist state changes into PostgreSQL database.</li>
</ul>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
  <span style="font-weight: 700; color: #0f172a;">⚠️ Note for Learners:</span>
  <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Make sure to review the attached downloadable lesson resources and source code archives below before attempting the quiz!</p>
</div>`;

export default function HtmlLessonEditor({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  lessonId,
  initialData,
  backUrl,
  apiBaseUrl,
}: HtmlLessonEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 15);
  const [isFreePreview, setIsFreePreview] = useState(initialData?.isFreePreview || false);
  const [contentType, setContentType] = useState(initialData?.contentType || "TEXT");
  const [contentUrl, setContentUrl] = useState(initialData?.contentUrl || "");
  const [htmlContent, setHtmlContent] = useState(initialData?.textContent || DEFAULT_HTML_TEMPLATE);

  // Lesson-specific Resources
  const [resources, setResources] = useState<LessonResource[]>(initialData?.resources || []);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeView, setActiveView] = useState<"split" | "editor" | "preview">("split");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to insert HTML tags into textarea at cursor position
  const insertHtmlSnippet = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = htmlContent.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;

    const newContent =
      htmlContent.substring(0, start) + replacement + htmlContent.substring(end);
    setHtmlContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  // Upload image to Cloudinary and insert <img> tag into HTML
  const handleInsertImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file.");
      return;
    }

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload image");
      }

      const imgTag = `\n<figure style="margin: 20px 0; text-align: center;">\n  <img src="${json.url}" alt="${file.name}" style="max-width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); margin: 0 auto; display: block;" />\n  <figcaption style="font-size: 12px; color: #64748b; margin-top: 8px;">${file.name}</figcaption>\n</figure>\n`;

      insertHtmlSnippet(imgTag);
      showToast("success", "Image uploaded & embedded into HTML!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Upload file resource for this lesson to Cloudinary
  const handleAddLessonResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResource(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload/resource", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload resource file");
      }

      const newRes: LessonResource = {
        title: file.name,
        fileType: file.type || "FILE",
        fileSize: file.size,
        fileUrl: json.url,
      };

      setResources((prev) => [...prev, newRes]);
      showToast("success", `Resource "${file.name}" uploaded for this lesson!`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload resource");
    } finally {
      setUploadingResource(false);
      e.target.value = "";
    }
  };

  const removeResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  // Save / Update Lesson
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("error", "Please provide a lesson title.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        contentType,
        contentUrl: contentUrl || null,
        textContent: htmlContent,
        durationMinutes: Number(durationMinutes),
        isFreePreview,
      };

      const url = lessonId ? `${apiBaseUrl}/${lessonId}` : apiBaseUrl;
      const method = lessonId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save lesson");
      }

      const savedLessonId = lessonId || json.data?.id;

      // If there are new resources to sync
      if (savedLessonId && resources.length > 0) {
        for (const r of resources) {
          if (!r.id) {
            // New uploaded resource
            await fetch(`${apiBaseUrl}/${savedLessonId}/resources`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: r.title,
                fileType: r.fileType,
                fileSize: r.fileSize,
                fileUrl: r.fileUrl,
                isPublic: false,
              }),
            });
          }
        }
      }

      showToast("success", lessonId ? "Lesson updated successfully!" : "Lesson created successfully!");
      setTimeout(() => {
        router.push(backUrl);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while saving the lesson");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Top Studio Header */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href={backUrl}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Course</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                {courseTitle}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-bold text-slate-600 truncate max-w-xs">{moduleTitle}</span>
            </div>
            <h1 className="text-sm font-extrabold text-slate-900 truncate">
              {lessonId ? `Edit Lesson: ${title || "Untitled"}` : "Create New Lesson Studio"}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveView("split")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeView === "split" ? "bg-white text-[#7C248C] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveView("editor")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeView === "editor" ? "bg-white text-[#7C248C] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Editor Only
            </button>
            <button
              onClick={() => setActiveView("preview")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeView === "preview" ? "bg-white text-[#7C248C] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{lessonId ? "Save Changes" : "Publish Lesson"}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col p-6 max-w-[1700px] w-full mx-auto space-y-6">
        {/* Lesson Metadata Panel */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-bold text-slate-700">Lesson Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 01 - Deep Dive into PostgreSQL Indexing & Optimization"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Estimated Duration (Minutes)</label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
            />
          </div>
        </div>

        {/* Split Editor + Live Preview Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* LEFT: HTML CODE & RICH TAGS TOOLBAR */}
          {(activeView === "split" || activeView === "editor") && (
            <div className="glass-card rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col overflow-hidden">
              {/* HTML Snippet Toolbar */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<h2>", "</h2>", "Section Heading")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Heading 2"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<h3>", "</h3>", "Subheading")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Heading 3"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<strong>", "</strong>", "bold text")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<em>", "</em>", "italic text")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<ul>\n  <li>", "</li>\n  <li>Point 2</li>\n</ul>", "Point 1")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Bullet List"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlSnippet("<pre><code class=\"language-javascript\">\n", "\n</code></pre>", "// Your code here")}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Code Block"
                >
                  <Terminal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertHtmlSnippet(
                      '<div style="background: linear-gradient(135deg, rgba(30,43,136,0.06), rgba(124,36,140,0.06)); padding: 18px; border-radius: 16px; border-left: 4px solid #7C248C; margin: 18px 0;">\n  <strong style="color: #1E2B88;">💡 Pro Tip:</strong>\n  <p style="margin: 4px 0 0 0; color: #475569;">',
                      "</p>\n</div>",
                      "Add your important key takeaway note here..."
                    )
                  }
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 hover:text-[#7C248C] text-slate-700 font-bold transition"
                  title="Callout Box"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Upload & Insert Image to HTML */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-[#7C248C] border border-purple-200 hover:bg-purple-100 font-bold text-xs cursor-pointer transition">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingImage ? "Uploading..." : "Insert Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleInsertImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Code Textarea */}
              <div className="flex-1 p-4 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Write pure HTML content for this lesson..."
                  className="flex-1 w-full min-h-[480px] font-mono text-xs text-slate-800 bg-slate-900/5 p-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#7C248C] leading-relaxed resize-y"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* RIGHT: REAL-TIME PORTAL LIVE PREVIEW */}
          {(activeView === "split" || activeView === "preview") && (
            <div className="glass-card rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#7C248C]" />
                  <span className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider">
                    Student Portal Live View
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Exact Student Lesson Experience</span>
              </div>

              {/* Rendered HTML Container */}
              <div className="flex-1 p-8 overflow-y-auto max-h-[700px] prose prose-slate max-w-none">
                {contentType === "VIDEO" && contentUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-black">
                    {contentUrl.includes("youtube.com") || contentUrl.includes("youtu.be") ? (
                      <iframe
                        src={contentUrl.replace("watch?v=", "embed/")}
                        className="w-full aspect-video rounded-2xl"
                        allowFullScreen
                      />
                    ) : (
                      <video src={contentUrl} controls className="w-full aspect-video rounded-2xl" />
                    )}
                  </div>
                )}

                <div
                  className="space-y-4 text-slate-800 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Lesson Downloadable Resources Section */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#7C248C]" /> Lesson Downloadable Assets & Resources
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach PDFs, dataset CSVs, code archives, or presentation slides visible specifically to students viewing this lesson.
              </p>
            </div>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs cursor-pointer transition shadow-xs hover:scale-[1.02]">
              {uploadingResource ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{uploadingResource ? "Uploading to Cloudinary..." : "Upload Lesson Resource"}</span>
              <input
                type="file"
                disabled={uploadingResource}
                onChange={handleAddLessonResource}
                className="hidden"
              />
            </label>
          </div>

          {resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {resources.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-900 text-xs truncate">{res.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(res.fileSize / 1024).toFixed(1)} KB • {res.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white hover:bg-purple-50 text-slate-700 hover:text-[#7C248C] transition"
                      title="Preview Resource"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeResource(idx)}
                      className="p-2 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              No specific files attached to this lesson yet. Upload PDF documents, cheat sheets, or source code files above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
