"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  SlidersHorizontal,
  Layers,
  File,
  HardDrive,
  Copy,
  Eye,
  Check,
  ChevronDown,
  Globe,
  Users2,
  GraduationCap,
  FileArchive,
  Presentation,
  ShieldCheck,
  Building2,
} from "lucide-react";

export interface ResourceData {
  id: string;
  courseId?: string | null;
  batchId?: string | null;
  lessonId?: string | null;
  title: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string | Date;
  course?: {
    id: string;
    title: string;
  } | null;
  batch?: {
    id: string;
    name: string;
  } | null;
  lesson?: {
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
  } | null;
}

export interface CourseOption {
  id: string;
  title: string;
  batches: {
    id: string;
    name: string;
    status: string;
  }[];
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
  }[];
}

interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

function CustomSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  searchable = false,
  disabled = false,
  emptyMessage = "No items available",
}: {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
    );
  }, [options, search]);

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-150 ${
          disabled
            ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "bg-white border-[#7C248C] shadow-sm ring-2 ring-purple-100"
            : "bg-slate-50/80 hover:bg-white border-slate-200/90 hover:border-slate-300 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && <div className="shrink-0">{selectedOption.icon}</div>}
          <div className="truncate">
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 truncate">{selectedOption.label}</span>
                {selectedOption.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#7C248C] text-[10px] font-mono font-bold border border-purple-200 shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">{placeholder}</span>
            )}
            {selectedOption?.sublabel && (
              <span className="block text-[10px] text-slate-400 font-mono truncate">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#7C248C]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C]"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length > 0 ? (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all text-xs ${
                      isSelected
                        ? "bg-purple-50 text-[#7C248C] font-black"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && <div className="shrink-0">{opt.icon}</div>}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#7C248C] text-[10px] font-mono font-bold border border-purple-200 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <span className="block text-[10px] text-slate-400 font-mono truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#7C248C] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainerContentClient({
  initialCourses,
  initialResources,
}: {
  initialCourses: CourseOption[];
  initialResources: ResourceData[];
}) {
  const [resources, setResources] = useState<ResourceData[]>(initialResources);
  const [courses] = useState<CourseOption[]>(initialCourses);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<"ALL" | "GENERAL" | "LESSON">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadScope, setUploadScope] = useState<"GENERAL" | "LESSON">("GENERAL");

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState(courses[0]?.modules[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState(courses[0]?.modules[0]?.lessons[0]?.id || "");

  const [uploadLoading, setUploadLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedType, setUploadedType] = useState("PDF");
  const [uploadedSize, setUploadedSize] = useState(1024 * 1024);

  // Delete Target Modal
  const [deletingResource, setDeletingResource] = useState<ResourceData | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedModule = selectedCourse?.modules.find((m) => m.id === selectedModuleId);
  const availableLessons = selectedModule?.lessons || [];
  const availableBatches = selectedCourse?.batches || [];

  // Metrics Calculations
  const totalAssetsCount = resources.length;
  const totalSizeMb = (
    resources.reduce((acc, r) => acc + (r.fileSize || 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  const pdfCount = resources.filter((r) => r.fileType?.toUpperCase().includes("PDF")).length;
  const codeCount = resources.filter(
    (r) =>
      r.fileType?.toUpperCase().includes("CODE") ||
      r.fileType?.toUpperCase().includes("ZIP") ||
      r.fileType?.toUpperCase().includes("TAR")
  ).length;
  const videoCount = resources.filter(
    (r) => r.fileType?.toUpperCase().includes("VIDEO") || r.fileType?.toUpperCase().includes("MP4")
  ).length;
  const otherCount = totalAssetsCount - (pdfCount + codeCount + videoCount);

  // Filtered Assets
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const courseTitle = r.course?.title || r.lesson?.module.course.title || "";
      const courseId = r.courseId || r.course?.id || r.lesson?.module.course.id || "";
      const lessonTitle = r.lesson?.title || "";
      const batchName = r.batch?.name || "";

      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fileType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCourse = !selectedCourseFilter || courseId === selectedCourseFilter;

      const matchType =
        selectedTypeFilter === "ALL" ||
        (selectedTypeFilter === "PDF" && r.fileType?.toUpperCase().includes("PDF")) ||
        (selectedTypeFilter === "VIDEO" &&
          (r.fileType?.toUpperCase().includes("VIDEO") || r.fileType?.toUpperCase().includes("MP4"))) ||
        (selectedTypeFilter === "CODE" &&
          (r.fileType?.toUpperCase().includes("CODE") || r.fileType?.toUpperCase().includes("ZIP"))) ||
        (selectedTypeFilter === "OTHER" &&
          !r.fileType?.toUpperCase().includes("PDF") &&
          !r.fileType?.toUpperCase().includes("VIDEO") &&
          !r.fileType?.toUpperCase().includes("CODE") &&
          !r.fileType?.toUpperCase().includes("ZIP"));

      const isGeneral = !r.lessonId && !r.lesson;
      const matchScope =
        selectedScopeFilter === "ALL" ||
        (selectedScopeFilter === "GENERAL" && isGeneral) ||
        (selectedScopeFilter === "LESSON" && !isGeneral);

      return matchSearch && matchCourse && matchType && matchScope;
    });
  }, [resources, searchQuery, selectedCourseFilter, selectedTypeFilter, selectedScopeFilter]);

  // Handle local file upload via /api/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "resources");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload file from device");
      }

      setResourceTitle(file.name);
      setUploadedUrl(json.data.url);
      setUploadedType(json.data.fileType || "PDF");
      setUploadedSize(json.data.fileSize || file.size);
      showToast("success", `File "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload file");
    } finally {
      setUploadLoading(false);
    }
  };

  // Create Resource Link in database
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showToast("error", "Please select a target course.");
      return;
    }

    if (uploadScope === "LESSON" && !selectedLessonId) {
      showToast("error", "Please select an assigned lesson to attach this resource.");
      return;
    }

    if (!uploadedUrl) {
      showToast("error", "Please upload a file or specify a valid file URL.");
      return;
    }

    if (!resourceTitle.trim()) {
      showToast("error", "Please enter a valid resource title.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/trainer/courses/${selectedCourseId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle,
          fileType: uploadedType,
          fileSize: uploadedSize,
          fileUrl: uploadedUrl,
          batchId: selectedBatchId || null,
          lessonId: uploadScope === "LESSON" ? selectedLessonId : null,
          isPublic: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to attach learning resource");
      }

      const newRecord: ResourceData = {
        id: json.data.id,
        courseId: selectedCourseId,
        batchId: selectedBatchId || null,
        lessonId: uploadScope === "LESSON" ? selectedLessonId : null,
        title: json.data.title,
        fileType: json.data.fileType,
        fileSize: json.data.fileSize,
        fileUrl: json.data.fileUrl,
        createdAt: json.data.createdAt || new Date().toISOString(),
        course: {
          id: selectedCourseId,
          title: selectedCourse?.title || "Course",
        },
        batch: selectedBatchId
          ? {
              id: selectedBatchId,
              name: availableBatches.find((b) => b.id === selectedBatchId)?.name || "Assigned Batch",
            }
          : null,
        lesson:
          uploadScope === "LESSON" && selectedLessonId
            ? {
                id: selectedLessonId,
                title: availableLessons.find((l) => l.id === selectedLessonId)?.title || "Assigned Lesson",
                module: {
                  id: selectedModuleId,
                  title: selectedModule?.title || "Module",
                  course: {
                    id: selectedCourseId,
                    title: selectedCourse?.title || "Course",
                  },
                },
              }
            : null,
      };

      setResources((prev) => [newRecord, ...prev]);
      showToast(
        "success",
        `Resource "${resourceTitle}" successfully ${
          uploadScope === "GENERAL" ? "added as general course resource" : "linked to lesson"
        }!`
      );
      setIsUploadModalOpen(false);
      setResourceTitle("");
      setUploadedUrl("");
      setSelectedBatchId("");
    } catch (err: any) {
      showToast("error", err.message || "Failed to link resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Resource
  const handleDeleteConfirm = async () => {
    if (!deletingResource) return;
    setActionLoading(true);
    try {
      const courseId =
        deletingResource.courseId ||
        deletingResource.course?.id ||
        deletingResource.lesson?.module.course.id ||
        courses[0]?.id;

      const res = await fetch(`/api/trainer/courses/${courseId}/resources/${deletingResource.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete resource");
      }

      setResources((prev) => prev.filter((r) => r.id !== deletingResource.id));
      showToast("success", "Resource removed from content repository.");
      setDeletingResource(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };

  const copyUrlToClipboard = (id: string, url: string) => {
    const fullUrl = url.startsWith("http") ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getAssetBadgeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("PDF")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (t.includes("VIDEO") || t.includes("MP4")) return "bg-cyan-50 text-cyan-700 border-cyan-200";
    if (t.includes("CODE") || t.includes("ZIP")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (t.includes("DOC") || t.includes("PPT")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-purple-50 text-[#7C248C] border-purple-200";
  };

  const getAssetIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("PDF")) return <FileText className="w-4 h-4 text-rose-600" />;
    if (t.includes("VIDEO") || t.includes("MP4")) return <Video className="w-4 h-4 text-cyan-600" />;
    if (t.includes("CODE") || t.includes("ZIP")) return <FileCode className="w-4 h-4 text-indigo-600" />;
    if (t.includes("DATABASE") || t.includes("CSV") || t.includes("XLS"))
      return <Database className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-purple-600" />;
  };

  // Preparation for Custom Select Dropdown Options
  const courseSelectOptions: CustomSelectOption[] = useMemo(() => {
    return courses.map((c) => ({
      value: c.id,
      label: c.title,
      sublabel: `${c.modules.length} Modules • ${c.batches.length} Batches`,
      icon: <GraduationCap className="w-4 h-4 text-[#7C248C]" />,
    }));
  }, [courses]);

  const batchSelectOptions: CustomSelectOption[] = useMemo(() => {
    const defaultOpt: CustomSelectOption = {
      value: "",
      label: "All Batches (Universal Course Access)",
      sublabel: "Available to all enrolled cohorts and students in this course",
      icon: <Globe className="w-4 h-4 text-slate-400" />,
    };
    const batchOpts: CustomSelectOption[] = availableBatches.map((b) => ({
      value: b.id,
      label: b.name,
      badge: b.status,
      sublabel: `Cohort restricted access`,
      icon: <Users2 className="w-4 h-4 text-[#7C248C]" />,
    }));
    return [defaultOpt, ...batchOpts];
  }, [availableBatches]);

  const moduleSelectOptions: CustomSelectOption[] = useMemo(() => {
    if (!selectedCourse?.modules) return [];
    return selectedCourse.modules.map((m) => ({
      value: m.id,
      label: m.title,
      sublabel: `${m.lessons.length} lessons available`,
      icon: <Layers className="w-4 h-4 text-[#7C248C]" />,
    }));
  }, [selectedCourse]);

  const lessonSelectOptions: CustomSelectOption[] = useMemo(() => {
    return availableLessons.map((l) => ({
      value: l.id,
      label: l.title,
      icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
    }));
  }, [availableLessons]);

  const fileTypeOptions: CustomSelectOption[] = [
    { value: "PDF", label: "PDF Document (.pdf)", icon: <FileText className="w-4 h-4 text-rose-600" /> },
    { value: "VIDEO", label: "Video Lecture (.mp4, .mkv)", icon: <Video className="w-4 h-4 text-cyan-600" /> },
    { value: "CODE", label: "Source Code Archive (.zip, .tar)", icon: <FileCode className="w-4 h-4 text-indigo-600" /> },
    { value: "DOC", label: "Word Document (.docx, .doc)", icon: <FileText className="w-4 h-4 text-blue-600" /> },
    { value: "PPT", label: "Presentation (.pptx, .ppt)", icon: <Presentation className="w-4 h-4 text-amber-600" /> },
    { value: "DATASET", label: "Dataset (.csv, .xlsx, .json)", icon: <Database className="w-4 h-4 text-emerald-600" /> },
    { value: "FILE", label: "Other Asset", icon: <File className="w-4 h-4 text-purple-600" /> },
  ];

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
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* 1. Compact Studio Header Banner (~10% vh, matching JVM Institute studio standard) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-5 sm:px-8 sm:py-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7C248C]" /> Academic Content Repository
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Content Library & Assets 🗂️
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {totalAssetsCount} Learning Assets • {totalSizeMb} MB Storage • {courses.length} Assigned Courses
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Upload Asset
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assets</div>
          <div className="text-2xl font-black text-slate-900">{totalAssetsCount}</div>
          <div className="text-[11px] font-mono text-[#7C248C] font-semibold">{totalSizeMb} MB Consumed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PDFs & Notes</div>
          <div className="text-2xl font-black text-rose-600">{pdfCount}</div>
          <div className="text-[11px] font-mono text-rose-700 font-semibold">Docs & Slidedecks</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Code & Archives</div>
          <div className="text-2xl font-black text-indigo-600">{codeCount}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">ZIPs & Code Repos</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Video Lectures</div>
          <div className="text-2xl font-black text-cyan-600">{videoCount}</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Offline Streams</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Other Media</div>
          <div className="text-2xl font-black text-slate-900">{otherCount}</div>
          <div className="text-[11px] font-mono text-slate-500 font-semibold">Datasets & Spreadsheets</div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets by file title, lesson name, batch, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#7C248C] focus:bg-white transition"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {/* Scope Filter Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => setSelectedScopeFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedScopeFilter("GENERAL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "GENERAL" ? "bg-white text-[#7C248C] shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSelectedScopeFilter("LESSON")}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedScopeFilter === "LESSON" ? "bg-white text-[#1E2B88] shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Lesson
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course:</span>
          </div>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition max-w-[180px] truncate"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type:</span>
          </div>
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-[#7C248C] transition"
          >
            <option value="ALL">All Types</option>
            <option value="PDF">PDFs & Docs</option>
            <option value="VIDEO">Videos</option>
            <option value="CODE">Code & ZIPs</option>
            <option value="OTHER">Datasets / Other</option>
          </select>
        </div>
      </div>

      {/* 4. Content Library Horizontal Asset Rows */}
      {filteredResources.length > 0 ? (
        <div className="space-y-3">
          {filteredResources.map((res) => {
            const kb = (res.fileSize / 1024).toFixed(1);
            const mb = (res.fileSize / (1024 * 1024)).toFixed(2);
            const sizeStr = res.fileSize > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
            const courseTitle = res.course?.title || res.lesson?.module.course.title || "Course Material";
            const isGeneral = !res.lessonId && !res.lesson;

            return (
              <div
                key={res.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Side: Icon, Asset Title, Type Badge & Date */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    {getAssetIcon(res.fileType)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 text-sm sm:text-base truncate hover:text-[#7C248C] transition">
                        {res.title}
                      </h3>

                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border flex items-center gap-1 shrink-0 ${getAssetBadgeColor(
                          res.fileType
                        )}`}
                      >
                        {res.fileType.split("/")[1]?.toUpperCase() || res.fileType || "FILE"}
                      </span>

                      {isGeneral ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-mono font-bold border border-amber-200 shrink-0 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> General Course Asset
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C248C] text-[10px] font-mono font-bold border border-purple-200 shrink-0 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Lesson Asset
                        </span>
                      )}

                      {res.batch && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200 shrink-0 flex items-center gap-1">
                          <Users2 className="w-3 h-3" /> {res.batch.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                      <span>{sizeStr}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(res.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Course & Assignment Badges */}
                <div className="flex flex-wrap items-center gap-2 md:px-4 md:border-x md:border-slate-100 shrink-0">
                  <span
                    className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold font-mono truncate max-w-[170px]"
                    title={courseTitle}
                  >
                    📚 {courseTitle}
                  </span>

                  {res.lesson ? (
                    <span
                      className="px-2.5 py-1 rounded-xl bg-purple-50/60 border border-purple-100 text-[#7C248C] text-xs font-bold font-mono truncate max-w-[170px]"
                      title={`${res.lesson.module.title} → ${res.lesson.title}`}
                    >
                      📖 {res.lesson.title}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono">
                      🌐 Course-Wide
                    </span>
                  )}
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => copyUrlToClipboard(res.id, res.fileUrl)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7C248C] border border-slate-200 transition"
                    title="Copy Direct URL"
                  >
                    {copiedId === res.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs flex items-center gap-1.5 transition border border-purple-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => setDeletingResource(res)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <FolderOpen className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No resources found matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCourseFilter || selectedTypeFilter !== "ALL" || selectedScopeFilter !== "ALL"
              ? "Try adjusting your search criteria or reset filters to view all learning assets."
              : "No learning materials or files uploaded yet. Click 'Upload Asset' to add general course resources or attach files to lessons."}
          </p>
          {(searchQuery || selectedCourseFilter || selectedTypeFilter !== "ALL" || selectedScopeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourseFilter("");
                setSelectedTypeFilter("ALL");
                setSelectedScopeFilter("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 text-[#7C248C] text-xs font-bold hover:bg-purple-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 5. Custom Styled Elegant Upload Learning Resource Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C248C]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Upload Learning Resource</h2>
                  <p className="text-xs text-slate-500 font-mono">Store course materials or attach files to specific lessons</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              {/* Resource Scope Switcher (General Course Resource vs Lesson-Specific) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Resource Attachment Scope</label>
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUploadScope("GENERAL")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      uploadScope === "GENERAL"
                        ? "bg-white text-[#7C248C] shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>General Resource</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadScope("LESSON")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      uploadScope === "LESSON"
                        ? "bg-white text-[#1E2B88] shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lesson-Specific</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 px-1">
                  {uploadScope === "GENERAL"
                    ? "✨ General resources are linked to the entire course and can optionally be restricted to specific student batches."
                    : "📖 Lesson-specific resources appear inside a designated course module and lesson."}
                </p>
              </div>

              {/* 1. Target Course Custom Dropdown */}
              <CustomSelect
                label="Target Course"
                required
                searchable
                value={selectedCourseId}
                onChange={(cId) => {
                  setSelectedCourseId(cId);
                  const c = courses.find((x) => x.id === cId);
                  setSelectedBatchId("");
                  setSelectedModuleId(c?.modules[0]?.id || "");
                  setSelectedLessonId(c?.modules[0]?.lessons[0]?.id || "");
                }}
                options={courseSelectOptions}
                placeholder="Select course..."
              />

              {/* 2. If GENERAL SCOPE: Optional Batch Custom Dropdown */}
              {uploadScope === "GENERAL" && (
                <CustomSelect
                  label="Target Batch Restriction (Optional)"
                  searchable
                  value={selectedBatchId}
                  onChange={(bId) => setSelectedBatchId(bId)}
                  options={batchSelectOptions}
                  placeholder="Select batch or leave universal..."
                />
              )}

              {/* 3. If LESSON SCOPE: Module & Lesson Custom Dropdowns */}
              {uploadScope === "LESSON" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect
                    label="Course Module"
                    required
                    value={selectedModuleId}
                    onChange={(mId) => {
                      setSelectedModuleId(mId);
                      const m = selectedCourse?.modules.find((x) => x.id === mId);
                      setSelectedLessonId(m?.lessons[0]?.id || "");
                    }}
                    options={moduleSelectOptions}
                    placeholder="Select module..."
                  />

                  <CustomSelect
                    label="Assigned Lesson"
                    required
                    value={selectedLessonId}
                    onChange={(lId) => setSelectedLessonId(lId)}
                    options={lessonSelectOptions}
                    placeholder="Select lesson..."
                    emptyMessage="No lessons in this module"
                  />
                </div>
              )}

              {/* File Upload Box */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block">Select File from Device</label>

                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-[#7C248C] rounded-2xl bg-slate-50 hover:bg-purple-50/50 cursor-pointer transition">
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[#7C248C] animate-spin" />
                      <span className="text-xs font-bold text-slate-700 mt-2">Uploading asset from device...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#7C248C]" />
                      <span className="text-xs font-bold text-slate-800 mt-2">
                        Click to select PDF, Video, Code ZIP, Document, or Dataset
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Uploaded directly to JVM Institute secure media repository
                      </span>
                    </>
                  )}
                  <input type="file" disabled={uploadLoading} onChange={handleFileUpload} className="hidden" />
                </label>

                {uploadedUrl && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-[11px] font-mono flex items-center justify-between">
                    <span className="truncate pr-2">✓ Uploaded: {resourceTitle} ({(uploadedSize / 1024).toFixed(1)} KB)</span>
                    <span className="text-emerald-700 font-bold uppercase text-[10px] shrink-0">{uploadedType}</span>
                  </div>
                )}
              </div>

              {/* Asset Type Selector */}
              <CustomSelect
                label="Resource Type Category"
                value={uploadedType}
                onChange={(val) => setUploadedType(val)}
                options={fileTypeOptions}
                placeholder="Select category..."
              />

              {/* Resource Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Display Asset Title *</label>
                <input
                  type="text"
                  required
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Full Syllabus & Course Handbook.pdf"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white font-medium transition"
                />
              </div>

              {/* Resource Direct URL / Path */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Direct Resource Path / URL *</label>
                <input
                  type="text"
                  required
                  value={uploadedUrl}
                  onChange={(e) => setUploadedUrl(e.target.value)}
                  placeholder="/uploads/resources/... or https://..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#7C248C] focus:bg-white font-mono text-xs transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || uploadLoading || !uploadedUrl}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 disabled:opacity-50 flex items-center gap-1.5 transition"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Save Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-sm w-full space-y-4 text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Delete Learning Asset?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove "{deletingResource.title}" from the platform content repository?
            </p>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingResource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
