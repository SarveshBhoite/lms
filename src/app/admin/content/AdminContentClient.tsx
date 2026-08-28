"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  Video,
  FileCode,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface ResourceData {
  id: string;
  lessonId: string;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
}

interface CourseOption {
  id: string;
  title: string;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
  }[];
}

export default function AdminContentClient({
  initialCourses,
  initialResources,
}: {
  initialCourses: CourseOption[];
  initialResources: ResourceData[];
}) {
  const [resources, setResources] = useState<ResourceData[]>(initialResources);
  const [courses] = useState<CourseOption[]>(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [selectedModuleId, setSelectedModuleId] = useState(courses[0]?.modules[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState(courses[0]?.modules[0]?.lessons[0]?.id || "");

  const [uploadLoading, setUploadLoading] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedType, setUploadedType] = useState("PDF");
  const [uploadedSize, setUploadedSize] = useState(1024 * 1024);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedModule = selectedCourse?.modules.find((m) => m.id === selectedModuleId);
  const availableLessons = selectedModule?.lessons || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload/resource", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload file");
      }

      setResourceTitle(file.name);
      setUploadedUrl(json.url);
      setUploadedType(file.type || "FILE");
      setUploadedSize(file.size);
      showToast("success", "File uploaded to Cloudinary!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload resource");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) {
      showToast("error", "Please select a target course module lesson to attach this resource.");
      return;
    }
    if (!uploadedUrl) {
      showToast("error", "Please upload a file or provide a valid resource URL.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses/${selectedCourseId}/modules/${selectedModuleId}/lessons/${selectedLessonId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle,
          fileType: uploadedType,
          fileSize: uploadedSize,
          fileUrl: uploadedUrl,
          isPublic: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to attach resource");
      }

      showToast("success", "Resource successfully attached to course & lesson!");
      setIsUploadModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      showToast("error", err.message || "Failed to link resource");
    }
  };

  const handleDeleteResource = async (resId: string, courseId: string, moduleId: string, lessonId: string) => {
    if (!confirm("Are you sure you want to delete this resource asset?")) return;

    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/resources?resourceId=${resId}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete resource");
      }

      setResources((prev) => prev.filter((r) => r.id !== resId));
      showToast("success", "Resource deleted successfully.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete resource");
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lesson.module.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = !courseFilter || r.lesson.module.course.id === courseFilter;
    const matchType = !typeFilter || r.fileType.toLowerCase().includes(typeFilter.toLowerCase());
    return matchSearch && matchCourse && matchType;
  });

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <FolderOpen className="w-7 h-7 text-[#7C248C]" /> Global Learning Content & Resources
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Upload PDFs, datasets, source code, and lecture resources assigned to specific courses and lessons.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Upload Learning Resource
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search resource, lesson, or course name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C]"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Table / Grid */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        {filteredResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px] font-bold">
                <tr>
                  <th className="p-4">Resource Asset</th>
                  <th className="p-4">Course & Module</th>
                  <th className="p-4">Assigned Lesson</th>
                  <th className="p-4">Size & Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{res.title}</div>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{res.fileType.split("/")[1] || "FILE"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                        {res.lesson.module.course.title}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">{res.lesson.module.title}</div>
                    </td>

                    <td className="p-4 font-bold text-slate-900">{res.lesson.title}</td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {(res.fileSize / 1024).toFixed(1)} KB • {new Date(res.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={res.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-[#7C248C] transition"
                          title="Download Asset"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() =>
                            handleDeleteResource(
                              res.id,
                              res.lesson.module.course.id,
                              res.lesson.module.id,
                              res.lesson.id
                            )
                          }
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">No learning resources found matching your search.</div>
        )}
      </div>

      {/* Upload Resource Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#7C248C]" /> Upload Learning Resource
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              {/* Course Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Target Course *</label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCourseId(cId);
                    const c = courses.find((x) => x.id === cId);
                    setSelectedModuleId(c?.modules[0]?.id || "");
                    setSelectedLessonId(c?.modules[0]?.lessons[0]?.id || "");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module & Lesson Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Course Module *</label>
                  <select
                    required
                    value={selectedModuleId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedModuleId(mId);
                      const m = selectedCourse?.modules.find((x) => x.id === mId);
                      setSelectedLessonId(m?.lessons[0]?.id || "");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                  >
                    {selectedCourse?.modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assign to Specific Lesson *</label>
                  <select
                    required
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                  >
                    {availableLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload to Cloudinary */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block">Select File to Upload (Cloudinary Storage)</label>

                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-[#7C248C] rounded-2xl bg-slate-50 hover:bg-purple-50/50 cursor-pointer transition">
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin" />
                      <span className="text-xs font-bold text-slate-700 mt-2">Uploading asset to Cloudinary CDN...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#7C248C]" />
                      <span className="text-xs font-bold text-slate-800 mt-2">Click to select PDF, Video, Dataset, or Document</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">Files persist to Cloudinary storage</span>
                    </>
                  )}
                  <input type="file" disabled={uploadLoading} onChange={handleFileUpload} className="hidden" />
                </label>

                {uploadedUrl && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-mono">
                    ✓ Uploaded: {resourceTitle} ({(uploadedSize / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Resource Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Display Asset Name</label>
                <input
                  type="text"
                  required
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Chapter 01 Reference Guide.pdf"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadedUrl}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 disabled:opacity-50"
                >
                  Confirm & Link Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
