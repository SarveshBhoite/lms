"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  CheckCircle2,
  XCircle,
  BookOpen,
  Filter,
  Shield,
  Loader2,
  RefreshCw,
  Sparkles,
  Calendar,
  Eye,
  KeyRound,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

interface StudentData {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile: {
    phone: string | null;
    designation: string | null;
  } | null;
  enrollments: Array<{
    id: string;
    course: { title: string };
  }>;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?role=STUDENT&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.users);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleVerification = async (studentId: string, currentStatus: boolean) => {
    try {
      setActionLoading(studentId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: studentId,
          isEmailVerified: !currentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isEmailVerified: !currentStatus } : s))
        );
        setSuccessMsg(`Email verification updated for student.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter((st) => {
    if (filterVerified === "VERIFIED") return st.isEmailVerified;
    if (filterVerified === "PENDING") return !st.isEmailVerified;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Student Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Student Cohort Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Review registered learners, verify student credentials, and inspect curriculum enrollments.
          </p>
        </div>

        <button
          onClick={() => fetchStudents()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or registration..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
          />
        </div>

        {/* Verification Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterVerified("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterVerified === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVerified("VERIFIED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterVerified === "VERIFIED"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Verified ({students.filter((s) => s.isEmailVerified).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVerified("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterVerified === "PENDING"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({students.filter((s) => !s.isEmailVerified).length})
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase font-bold text-[11px]">
              <tr>
                <th className="p-4 sm:px-6">Student Identity</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Email Status</th>
                <th className="p-4">Active Enrolled Courses</th>
                <th className="p-4">Registration Date</th>
                <th className="p-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    No students match your query criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {st.profile?.phone || "No phone added"}
                    </td>

                    <td className="p-4">
                      {st.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">
                          <XCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {st.enrollments.length > 0 ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold text-[11px]">
                            <BookOpen className="w-3 h-3" /> {st.enrollments[0].course.title}
                          </span>
                          {st.enrollments.length > 1 && (
                            <span className="text-[10px] text-slate-500 block">
                              +{st.enrollments.length - 1} more course(s)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Not enrolled yet</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(st.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleVerification(st.id, st.isEmailVerified)}
                        disabled={actionLoading === st.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition disabled:opacity-50"
                      >
                        {actionLoading === st.id ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : st.isEmailVerified ? (
                          "Mark Pending"
                        ) : (
                          "Approve Verification"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
