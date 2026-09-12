"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  BookOpen,
  Layers,
  Users,
  Award,
  TrendingUp,
  FileCheck,
  Sparkles,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Trash2,
  Video,
  MessageSquare,
  Globe,
  ExternalLink,
  X,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LiveClassItem {
  id: string;
  title: string;
  scheduledDate: string;
  status: string;
  meetingUrl?: string | null;
  batchName: string;
  totalAttendance: number;
  presentCount: number;
}

interface AuthoredNoteItem {
  id: string;
  content: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
}

interface TrainerProfileProps {
  trainer: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    profile: {
      phone: string | null;
      bio: string | null;
      avatarUrl: string | null;
      designation: string | null;
      githubUrl: string | null;
      linkedinUrl: string | null;
      websiteUrl: string | null;
    } | null;
    coursesCreated: Array<{
      id: string;
      title: string;
      description: string;
      level: string;
      durationHours: number;
      status: string;
      createdAt: string;
      modules: Array<{ id: string; title?: string }>;
      enrollments: Array<{
        id: string;
        enrolledAt: string;
        user: {
          id: string;
          name: string;
          email: string;
          profile: { phone: string | null; avatarUrl: string | null } | null;
        };
      }>;
    }>;
    trainerBatches: Array<{
      id: string;
      assignedAt: string;
      batch: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
        course: { id: string; title: string };
        students: Array<{
          user: {
            id: string;
            name: string;
            email: string;
            profile: { phone: string | null; avatarUrl: string | null } | null;
          };
        }>;
        liveClasses: Array<{ id: string; title: string; status: string }>;
      };
    }>;
  };
  courses: Array<{ id: string; title: string }>;
  batches: Array<{ id: string; name: string; courseId: string }>;
  liveClasses: LiveClassItem[];
  evaluatedAssignmentsCount: number;
  authoredNotes: AuthoredNoteItem[];
}

export default function TrainerProfileClient({
  trainer: initialTrainer,
  courses,
  batches,
  liveClasses,
  evaluatedAssignmentsCount,
  authoredNotes,
}: TrainerProfileProps) {
  const router = useRouter();
  const [trainer, setTrainer] = useState(initialTrainer);
  const [activeTab, setActiveTab] = useState<
    "overview" | "courses" | "batches" | "students" | "classes" | "notes"
  >("overview");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: initialTrainer.name,
    email: initialTrainer.email,
    password: "",
    phone: initialTrainer.profile?.phone || "",
    avatarUrl: initialTrainer.profile?.avatarUrl || "",
    designation: initialTrainer.profile?.designation || "",
    bio: initialTrainer.profile?.bio || "",
    isActive: initialTrainer.isActive !== false,
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle active/deactive status
  const handleToggleStatus = async () => {
    const nextStatus = !trainer.isActive;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${trainer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update trainer status");
      }

      setTrainer((prev) => ({ ...prev, isActive: nextStatus }));
      setEditFormData((prev) => ({ ...prev, isActive: nextStatus }));
      showToast("success", `Faculty account ${nextStatus ? "activated" : "deactivated"}!`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        avatarUrl: editFormData.avatarUrl,
        designation: editFormData.designation,
        bio: editFormData.bio,
        isActive: editFormData.isActive,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch(`/api/admin/trainers/${trainer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update trainer profile");
      }

      setTrainer((prev) => ({
        ...prev,
        name: editFormData.name,
        email: editFormData.email,
        isActive: editFormData.isActive,
        profile: {
          ...prev.profile,
          phone: editFormData.phone,
          avatarUrl: editFormData.avatarUrl,
          designation: editFormData.designation,
          bio: editFormData.bio,
          githubUrl: prev.profile?.githubUrl || null,
          linkedinUrl: prev.profile?.linkedinUrl || null,
          websiteUrl: prev.profile?.websiteUrl || null,
        },
      }));

      showToast("success", "Faculty profile updated successfully!");
      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete trainer
  const handleDeleteTrainer = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/trainers/${trainer.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete trainer account");
      }

      showToast("success", "Trainer account purged successfully.");
      setTimeout(() => {
        router.push("/admin/trainers");
      }, 1000);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete trainer account");
      setActionLoading(false);
    }
  };

  // Calculate unique assigned students across courses and batches
  const studentMap = new Map<
    string,
    { id: string; name: string; email: string; phone?: string; avatarUrl?: string; source: string; joinedAt?: string }
  >();

  trainer.coursesCreated.forEach((course) => {
    course.enrollments.forEach((en) => {
      studentMap.set(en.user.id, {
        id: en.user.id,
        name: en.user.name,
        email: en.user.email,
        phone: en.user.profile?.phone || undefined,
        avatarUrl: en.user.profile?.avatarUrl || undefined,
        source: course.title,
        joinedAt: en.enrolledAt,
      });
    });
  });

  trainer.trainerBatches.forEach((tb) => {
    tb.batch.students.forEach((st) => {
      if (!studentMap.has(st.user.id)) {
        studentMap.set(st.user.id, {
          id: st.user.id,
          name: st.user.name,
          email: st.user.email,
          phone: st.user.profile?.phone || undefined,
          avatarUrl: st.user.profile?.avatarUrl || undefined,
          source: `Batch: ${tb.batch.name}`,
        });
      }
    });
  });

  const assignedStudentsList = Array.from(studentMap.values());
  const totalStudentsCount = assignedStudentsList.length;

  const tabs = [
    { id: "overview", label: "Overview", icon: GraduationCap },
    { id: "courses", label: `Assigned Courses (${trainer.coursesCreated.length})`, icon: BookOpen },
    { id: "batches", label: `Cohort Batches (${trainer.trainerBatches.length})`, icon: Layers },
    { id: "students", label: `Student Roster (${totalStudentsCount})`, icon: Users },
    { id: "classes", label: `Live Sessions (${liveClasses.length})`, icon: Video },
    { id: "notes", label: `Faculty Notes (${authoredNotes.length})`, icon: MessageSquare },
  ] as const;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Breadcrumb & Admin Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/trainers"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-purple-50 hover:border-purple-200 transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Trainers
          </Link>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Faculty Trainer Cockpit</h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Academic Dossier, Cohort Allocations & Teaching Impact
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Toggle Button */}
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              trainer.isActive !== false
                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : trainer.isActive !== false ? (
              <UserX className="w-3.5 h-3.5" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>{trainer.isActive !== false ? "Deactivate Account" : "Activate Account"}</span>
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#7C248C] border border-purple-200 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Details
          </button>

          {/* Delete Trainer Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Trainer
          </button>
        </div>
      </div>

      {/* Main Cockpit Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/15 to-pink-500/15 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          {trainer.profile?.avatarUrl ? (
            <img
              src={trainer.profile.avatarUrl}
              alt={trainer.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl jvm-gradient-bg text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md">
              {trainer.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#7C248C]" /> Faculty Cockpit
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  trainer.isActive !== false
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {trainer.isActive !== false ? "ACTIVE FACULTY" : "DEACTIVATED"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                ID: {trainer.id.slice(-6)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate tracking-tight">
              {trainer.name}
            </h1>

            <div className="text-xs text-purple-700 font-semibold font-mono">
              Role: <strong className="text-slate-900">{trainer.profile?.designation || "Senior Faculty Instructor"}</strong>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap font-mono">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {trainer.email}
              </span>
              {trainer.profile?.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {trainer.profile.phone}
                  </span>
                </>
              )}
              <span>•</span>
              <span>Joined: {formatDate(trainer.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right relative z-10">
          <div className="text-[11px] font-mono text-slate-400">Governance Scope</div>
          <div className="px-3 py-1 rounded-xl bg-purple-100 text-[#7C248C] font-mono font-bold text-xs border border-purple-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Authorized Instructor
          </div>
          {trainer.lastLoginAt && (
            <div className="text-[10px] font-mono text-slate-500">
              Last Login: {formatDate(trainer.lastLoginAt, { includeTime: true })}
            </div>
          )}
        </div>
      </div>

      {/* 4 High-Impact Teaching KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E2B88]" /> Assigned Courses
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{trainer.coursesCreated.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Programs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-600" /> Cohort Batches
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700">{trainer.trainerBatches.length}</span>
            <span className="text-[11px] font-mono text-slate-400">Cohorts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#7C248C]" /> Student Reach
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#7C248C]">{totalStudentsCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Learners</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#E01E6A]" /> Evaluations Done
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#E01E6A]">{evaluatedAssignmentsCount}</span>
            <span className="text-[11px] font-mono text-slate-400">Submissions</span>
          </div>
        </div>
      </div>

      {/* Cockpit Tabs Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "jvm-gradient-bg text-white shadow-md shadow-purple-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bio & Professional Profile */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#7C248C]" /> Faculty Dossier & Qualifications
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{trainer.name}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Specialization</span>
                  <span className="font-bold text-[#7C248C]">{trainer.profile?.designation || "Faculty Member"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Email Address</span>
                  <span className="font-mono text-slate-700">{trainer.email}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-mono text-slate-700">{trainer.profile?.phone || "Not specified"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Registered On</span>
                  <span className="font-mono text-slate-700">{formatDate(trainer.createdAt)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Last System Access</span>
                  <span className="font-mono text-slate-700">
                    {trainer.lastLoginAt ? formatDate(trainer.lastLoginAt, { includeTime: true }) : "Never"}
                  </span>
                </div>
              </div>

              {trainer.profile?.bio && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Professional Bio</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {trainer.profile.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Summary Cards */}
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Teaching Allocation Summary
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase">Assigned Programs</span>
                    <div className="text-xl font-black text-indigo-950">{trainer.coursesCreated.length}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-100 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-600 font-bold uppercase">Active Cohorts</span>
                    <div className="text-xl font-black text-cyan-950">{trainer.trainerBatches.length}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                    <span className="text-[10px] font-mono text-purple-600 font-bold uppercase">Learner Network</span>
                    <div className="text-xl font-black text-purple-950">{totalStudentsCount}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-100 space-y-1">
                    <span className="text-[10px] font-mono text-pink-600 font-bold uppercase">Evaluations</span>
                    <div className="text-xl font-black text-pink-950">{evaluatedAssignmentsCount}</div>
                  </div>
                </div>
              </div>

              {/* Social & Contact Card */}
              {(trainer.profile?.githubUrl || trainer.profile?.linkedinUrl || trainer.profile?.websiteUrl) && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase font-mono">External Web & Portfolios</div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {trainer.profile.websiteUrl && (
                      <a
                        href={trainer.profile.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-purple-700 transition"
                      >
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {trainer.profile.linkedinUrl && (
                      <a
                        href={trainer.profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-purple-700 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {trainer.profile.githubUrl && (
                      <a
                        href={trainer.profile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-purple-700 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ASSIGNED COURSES ================= */}
        {activeTab === "courses" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Assigned Curriculum Courses
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {trainer.coursesCreated.length} Total Programs
              </span>
            </div>

            {trainer.coursesCreated.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainer.coursesCreated.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-[#7C248C]">
                          {course.level}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(course.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{course.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600">{course.enrollments.length} Enrolled Students</span>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                      >
                        Manage Course <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No courses currently assigned to this faculty trainer.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: COHORT BATCHES ================= */}
        {activeTab === "batches" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600" /> Assigned Cohort Batches
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                {trainer.trainerBatches.length} Total Cohorts
              </span>
            </div>

            {trainer.trainerBatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainer.trainerBatches.map((tb) => (
                  <div
                    key={tb.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                          {tb.batch.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Assigned: {formatDate(tb.assignedAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{tb.batch.name}</h4>
                      <p className="text-xs text-purple-700 font-semibold">{tb.batch.course.title}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Timeline:</span>
                        <span>
                          {formatDate(tb.batch.startDate)} &rarr; {formatDate(tb.batch.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Cohort Strength:</span>
                        <span className="font-bold text-slate-900">{tb.batch.students.length} Learners</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/admin/batches/${tb.batch.id}`}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                      >
                        Open Batch Dashboard <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No cohort batches assigned to this trainer yet.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ASSIGNED STUDENTS ================= */}
        {activeTab === "students" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7C248C]" /> Assigned Student Roster
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                {totalStudentsCount} Total Students
              </span>
            </div>

            {assignedStudentsList.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Program / Cohort</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {assignedStudentsList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3.5 font-mono text-slate-600">{st.email}</td>
                        <td className="p-3.5 font-mono text-slate-600">{st.phone || "—"}</td>
                        <td className="p-3.5 text-purple-700 font-semibold">{st.source}</td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/admin/students/${st.id}`}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#7C248C] hover:bg-purple-100 font-bold transition text-[11px] inline-flex items-center gap-1"
                          >
                            <span>Dossier</span>
                            <ChevronLeft className="w-3 h-3 rotate-180" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No students assigned yet</div>
                <p>Students enrolled in courses or cohorts taught by this faculty member will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: LIVE SESSIONS ================= */}
        {activeTab === "classes" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" /> Hosted Live Class Sessions
              </h3>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {liveClasses.length} Scheduled Sessions
              </span>
            </div>

            {liveClasses.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3.5">Session Title</th>
                      <th className="p-3.5">Cohort Batch</th>
                      <th className="p-3.5">Scheduled Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {liveClasses.map((lc) => (
                      <tr key={lc.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">{lc.title}</td>
                        <td className="p-3.5 font-mono text-cyan-700 font-bold">{lc.batchName}</td>
                        <td className="p-3.5 font-mono text-slate-600">{formatDate(lc.scheduledDate)}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                              lc.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : lc.status === "LIVE"
                                ? "bg-purple-100 text-[#7C248C] animate-pulse"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {lc.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {lc.presentCount} / {lc.totalAttendance} Present
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No live classes recorded for this trainer yet.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: FACULTY NOTES ================= */}
        {activeTab === "notes" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#7C248C]" /> Academic Notes Authored by Trainer
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Observations and evaluations written by this trainer regarding their students
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200">
                {authoredNotes.length} Notes Logged
              </span>
            </div>

            {authoredNotes.length > 0 ? (
              <div className="space-y-3 pt-2">
                {authoredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="font-bold text-slate-900">
                        For Student: {note.student.name} ({note.student.email})
                      </span>
                      <span className="text-slate-400">{formatDate(note.createdAt, { includeTime: true })}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No academic notes authored by this trainer yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#7C248C]" /> Edit Faculty Profile
                </h3>
                <p className="text-xs text-slate-500">Update credentials, role designation, and account status</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Specialization / Designation</label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.avatarUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bio & Qualifications</label>
                <textarea
                  rows={3}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                <div>
                  <div className="font-bold text-slate-900">Faculty Account Status</div>
                  <div className="text-[10px] text-slate-500">Allow or revoke trainer portal login</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-[10px] font-mono transition border cursor-pointer ${
                    editFormData.isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-rose-100 text-rose-800 border-rose-200"
                  }`}
                >
                  {editFormData.isActive ? "ACTIVE" : "DEACTIVATED"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl border border-rose-200 bg-white space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Faculty Account?</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible cascade action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{trainer.name}</strong> ({trainer.email})?
              Their login access will be revoked, profile erased, and teaching allocations unlinked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrainer}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
