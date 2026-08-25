"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
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
} from "lucide-react";

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
      modules: Array<{ id: string }>;
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
}

export default function TrainerProfileClient({ trainer }: TrainerProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "courses" | "batches" | "students" | "performance"
  >("overview");

  // Calculate unique assigned students across courses and batches
  const studentMap = new Map<string, { id: string; name: string; email: string; phone?: string; avatarUrl?: string; source: string }>();

  trainer.coursesCreated.forEach((course) => {
    course.enrollments.forEach((en) => {
      studentMap.set(en.user.id, {
        id: en.user.id,
        name: en.user.name,
        email: en.user.email,
        phone: en.user.profile?.phone || undefined,
        avatarUrl: en.user.profile?.avatarUrl || undefined,
        source: course.title,
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
    { id: "batches", label: `Assigned Batches (${trainer.trainerBatches.length})`, icon: Layers },
    { id: "students", label: `Assigned Students (${totalStudentsCount})`, icon: Users },
    { id: "performance", label: "Performance Overview", icon: TrendingUp },
  ] as const;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/trainers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trainer Roster
        </Link>
      </div>

      {/* Trainer Banner Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="flex items-center gap-5 z-10">
          {trainer.profile?.avatarUrl ? (
            <img
              src={trainer.profile.avatarUrl}
              alt={trainer.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md shrink-0">
              {trainer.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{trainer.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  trainer.isActive !== false
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {trainer.isActive !== false ? "Active Faculty" : "Deactivated"}
              </span>
            </div>

            <div className="text-xs text-slate-600 font-semibold">
              Specialization: <span className="text-amber-800 font-bold">{trainer.profile?.designation || "Faculty Trainer"}</span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap pt-0.5 font-mono">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {trainer.email}
              </span>
              {trainer.profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {trainer.profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <Link
            href="/admin/trainers"
            className="w-full md:w-auto text-center px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="space-y-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-600" /> Faculty Details & Bio
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{trainer.name}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Specialization</span>
                  <span className="font-bold text-amber-800">{trainer.profile?.designation || "Faculty Member"}</span>
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
                  <span className="text-slate-500">Account Status</span>
                  <span
                    className={`font-bold text-[11px] ${
                      trainer.isActive !== false ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {trainer.isActive !== false ? "Active" : "Deactivated"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Joining Date</span>
                  <span className="font-mono text-slate-700">
                    {new Date(trainer.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {trainer.profile?.bio && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 text-xs">Biography / Background</span>
                  <p className="text-slate-600 text-xs leading-relaxed italic">{trainer.profile.bio}</p>
                </div>
              )}
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Teaching Footprint
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Assigned Courses</div>
                  <div className="text-2xl font-extrabold text-violet-600">{trainer.coursesCreated.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Assigned Batches</div>
                  <div className="text-2xl font-extrabold text-cyan-600">{trainer.trainerBatches.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Students Trained</div>
                  <div className="text-2xl font-extrabold text-indigo-600">{totalStudentsCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Account Role</div>
                  <div className="text-base font-extrabold text-amber-700">TRAINER</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ASSIGNED COURSES TAB */}
        {activeTab === "courses" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" /> Assigned Courses Catalog
            </h3>

            {trainer.coursesCreated.length > 0 ? (
              <div className="space-y-3">
                {trainer.coursesCreated.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{course.title}</div>
                      <p className="text-slate-500 text-[11px] line-clamp-1">{course.description}</p>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Level: <span className="text-violet-700 font-semibold">{course.level}</span> • Duration: {course.durationHours} hrs • Modules: {course.modules.length}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                        {course.enrollments.length} Enrolled Students
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                        {course.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No courses are currently assigned to this trainer.
              </div>
            )}
          </div>
        )}

        {/* 3. ASSIGNED BATCHES TAB */}
        {activeTab === "batches" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600" /> Assigned Cohorts & Batches
            </h3>

            {trainer.trainerBatches.length > 0 ? (
              <div className="space-y-3">
                {trainer.trainerBatches.map((tb) => (
                  <div
                    key={tb.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{tb.batch.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Course: <span className="font-semibold text-slate-800">{tb.batch.course.title}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Duration: {new Date(tb.batch.startDate).toLocaleDateString()} to {new Date(tb.batch.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-[11px]">
                        {tb.batch.students.length} Students
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                        {tb.batch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No batches or cohorts are assigned to this trainer.
              </div>
            )}
          </div>
        )}

        {/* 4. ASSIGNED STUDENTS TAB */}
        {activeTab === "students" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Assigned Student Roster
            </h3>

            {assignedStudentsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Enrolled Via</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {assignedStudentsList.map((st) => (
                      <tr key={st.id}>
                        <td className="p-3 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3 font-mono text-slate-600">{st.email}</td>
                        <td className="p-3 font-mono text-slate-600">{st.phone || "—"}</td>
                        <td className="p-3 text-indigo-700 font-semibold">{st.source}</td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/admin/students/${st.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold transition text-[11px]"
                          >
                            View Student
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No students assigned yet</div>
                <p>Students enrolled in this trainer's assigned courses or batches will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. PERFORMANCE OVERVIEW TAB */}
        {activeTab === "performance" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Teaching Performance Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 uppercase font-semibold">Total Curriculum Items</div>
                <div className="text-3xl font-extrabold text-indigo-600">
                  {trainer.coursesCreated.length + trainer.trainerBatches.length}
                </div>
                <div className="text-[11px] text-slate-500">Active courses & batches</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 uppercase font-semibold">Total Students Reached</div>
                <div className="text-3xl font-extrabold text-amber-600">{totalStudentsCount}</div>
                <div className="text-[11px] text-slate-500">Across all enrollments</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 uppercase font-semibold">Instructor Status</div>
                <div className="text-lg font-extrabold text-emerald-700">
                  {trainer.isActive !== false ? "Active & Authorized" : "Deactivated"}
                </div>
                <div className="text-[11px] text-slate-500">System permissions</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
