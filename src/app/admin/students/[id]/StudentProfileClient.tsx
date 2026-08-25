"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  BookOpen,
  Layers,
  Award,
  FileCheck,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Edit2,
  Sparkles,
} from "lucide-react";

interface StudentProfileProps {
  student: {
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
    enrollments: Array<{
      id: string;
      enrolledAt: string;
      status: string;
      course: {
        id: string;
        title: string;
        description: string;
        level: string;
        durationHours: number;
      };
      batch: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
      } | null;
    }>;
    studentBatches: Array<{
      batch: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
        course: { title: string };
      };
    }>;
    courseProgresses: Array<{
      id: string;
      completedLessonsCount: number;
      totalLessonsCount: number;
      progressPercent: number;
      isCompleted: boolean;
      course: { id: string; title: string };
    }>;
    quizAttempts: Array<{
      id: string;
      score: number;
      totalMarks: number;
      isPassed: boolean;
      startedAt: string;
      timeTakenSec: number;
      quiz: {
        title: string;
        course: { title: string };
      };
    }>;
    assignmentSubmissions: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      status: string;
      submittedAt: string;
      assignment: {
        title: string;
        totalMarks: number;
        course: { title: string };
      };
      feedback: {
        marksAwarded: number;
        feedbackText: string;
        evaluatedAt: string;
      } | null;
    }>;
    attendances: Array<{
      id: string;
      status: string;
      recordedAt: string;
      liveClass: {
        title: string;
        scheduledDate: string;
        batch: { name: string };
      };
    }>;
    certificates: Array<{
      id: string;
      certificateNumber: string;
      issueDate: string;
      qrCodeUrl: string | null;
      course: { title: string };
    }>;
  };
}

export default function StudentProfileClient({ student }: StudentProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "enrollment" | "progress" | "quizzes" | "assignments" | "attendance" | "certificates"
  >("overview");

  // Calculate Attendance Percentage if present
  const totalClasses = student.attendances.length;
  const presentClasses = student.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "enrollment", label: "Enrollment", icon: BookOpen },
    { id: "progress", label: "Learning Progress", icon: TrendingUp },
    { id: "quizzes", label: `Quizzes (${student.quizAttempts.length})`, icon: HelpCircle },
    { id: "assignments", label: `Assignments (${student.assignmentSubmissions.length})`, icon: FileCheck },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "certificates", label: `Certificates (${student.certificates.length})`, icon: Award },
  ] as const;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Management
        </Link>
      </div>

      {/* Student Banner Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
        <div className="flex items-center gap-5 z-10">
          {student.profile?.avatarUrl ? (
            <img
              src={student.profile.avatarUrl}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{student.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  student.isActive !== false
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {student.isActive !== false ? "Active Account" : "Deactivated"}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap pt-1 font-mono">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
              </span>
              {student.profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <Link
            href="/admin/students"
            className="w-full md:w-auto text-center px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            Edit Account
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
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
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
                <User className="w-5 h-5 text-rose-600" /> Personal & Account Information
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{student.name}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Email Address</span>
                  <span className="font-mono text-slate-700">{student.email}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-mono text-slate-700">{student.profile?.phone || "Not specified"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <span
                    className={`font-bold text-[11px] ${
                      student.isActive !== false ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {student.isActive !== false ? "Active" : "Deactivated"}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Registration Date</span>
                  <span className="font-mono text-slate-700">
                    {new Date(student.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Last Login</span>
                  <span className="font-mono text-slate-700">
                    {student.lastLoginAt
                      ? new Date(student.lastLoginAt).toLocaleString()
                      : "Never logged in"}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Academic Quick Summary
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Enrolled Courses</div>
                  <div className="text-2xl font-extrabold text-indigo-600">{student.enrollments.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Quizzes Attempted</div>
                  <div className="text-2xl font-extrabold text-amber-600">{student.quizAttempts.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Assignments</div>
                  <div className="text-2xl font-extrabold text-rose-600">{student.assignmentSubmissions.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Certificates</div>
                  <div className="text-2xl font-extrabold text-emerald-600">{student.certificates.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ENROLLMENT TAB */}
        {activeTab === "enrollment" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Enrolled Courses & Cohorts
              </h3>

              {student.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {student.enrollments.map((en) => (
                    <div
                      key={en.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{en.course.title}</div>
                        <div className="text-slate-500 text-[11px]">
                          Level: <span className="text-indigo-700 font-semibold">{en.course.level}</span> • Duration: {en.course.durationHours} hrs
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          Enrolled on: {new Date(en.enrolledAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {en.batch && (
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-[11px]">
                            Batch: {en.batch.name}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                          {en.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  Student is not currently enrolled in any course program.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. LEARNING PROGRESS TAB */}
        {activeTab === "progress" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Course Progress Tracking
            </h3>

            {student.courseProgresses.length > 0 ? (
              <div className="space-y-4">
                {student.courseProgresses.map((cp) => (
                  <div key={cp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cp.course.title}</span>
                      <span className="font-bold text-emerald-700">{Math.round(cp.progressPercent)}%</span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${cp.progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>
                        Completed: {cp.completedLessonsCount} / {cp.totalLessonsCount} Lessons
                      </span>
                      <span>{cp.isCompleted ? "Course Completed" : "In Progress"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No progress recorded yet</div>
                <p>Lesson progress metrics will automatically populate as the student completes course modules.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. QUIZZES TAB */}
        {activeTab === "quizzes" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" /> Quiz Attempt History
            </h3>

            {student.quizAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Quiz Title</th>
                      <th className="p-3">Course</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Attempt Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {student.quizAttempts.map((qa) => (
                      <tr key={qa.id}>
                        <td className="p-3 font-bold text-slate-900">{qa.quiz.title}</td>
                        <td className="p-3 text-slate-500">{qa.quiz.course.title}</td>
                        <td className="p-3 font-mono font-bold text-amber-700">
                          {qa.score} / {qa.totalMarks}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              qa.isPassed
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {qa.isPassed ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {new Date(qa.startedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No quiz attempts recorded</div>
                <p>Quiz results and performance history will appear here once the student submits quizzes.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-rose-600" /> Assignment Submissions & Feedback
            </h3>

            {student.assignmentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {student.assignmentSubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sub.assignment.title}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-rose-700 font-bold text-[10px]">
                        {sub.status}
                      </span>
                    </div>

                    <div className="text-slate-500 text-[11px] flex justify-between">
                      <span>Submitted file: <strong className="text-slate-800">{sub.fileName}</strong></span>
                      <span className="font-mono">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>

                    {sub.feedback && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="font-bold text-amber-700 flex justify-between text-[11px]">
                          <span>Trainer Feedback</span>
                          <span>Marks: {sub.feedback.marksAwarded} / {sub.assignment.totalMarks}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] italic">{sub.feedback.feedbackText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No assignment submissions yet</div>
                <p>Submitted assignments, marks, and trainer evaluation feedback will be displayed here.</p>
              </div>
            )}
          </div>
        )}

        {/* 6. ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" /> Attendance Records
              </h3>

              <div className="px-4 py-2 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold text-xs flex items-center gap-2">
                <span>Attendance Percentage:</span>
                <span className="text-sm text-cyan-800 font-extrabold">{attendancePercentage}%</span>
              </div>
            </div>

            {student.attendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Live Class Title</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Scheduled Date</th>
                      <th className="p-3">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {student.attendances.map((att) => (
                      <tr key={att.id}>
                        <td className="p-3 font-bold text-slate-900">{att.liveClass.title}</td>
                        <td className="p-3 text-slate-500">{att.liveClass.batch.name}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {new Date(att.liveClass.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : att.status === "LATE"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No attendance records found</div>
                <p>Attendance history across live sessions will be automatically logged and calculated here.</p>
              </div>
            )}
          </div>
        )}

        {/* 7. CERTIFICATES TAB */}
        {activeTab === "certificates" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" /> Issued Certificates
            </h3>

            {student.certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.certificates.map((cert) => (
                  <div key={cert.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <Award className="w-6 h-6 text-amber-500" />
                      <span className="font-mono text-[10px] text-slate-600 font-bold px-2 py-0.5 rounded bg-slate-200">
                        {cert.certificateNumber}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">{cert.course.title}</div>
                      <div className="text-[11px] text-slate-500">
                        Issued on: {new Date(cert.issueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-900">No certificates generated yet</div>
                <p>Official course completion certificates issued to the student will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
