"use client";

import { useState } from "react";
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface AttendanceItem {
  id: string;
  status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT" | string;
  isApproved: boolean;
  joinClickTime: string | null;
  excuseReason: string | null;
  recordedAt: string;
  liveClass: {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    batch: { name: string; course: { title: string } };
  };
}

// Hydration-safe date and time formatters
function formatDateSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTimeSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

export default function StudentAttendanceClient({
  initialAttendances,
  attendancePercent,
}: {
  initialAttendances: AttendanceItem[];
  attendancePercent: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "LATE" | "EXCUSED" | "ABSENT">("ALL");

  const presentCount = initialAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount = initialAttendances.filter((a) => a.status === "LATE").length;
  const excusedCount = initialAttendances.filter((a) => a.status === "EXCUSED").length;
  const absentCount = initialAttendances.filter((a) => a.status === "ABSENT").length;

  const filtered = initialAttendances.filter((att) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = att.liveClass.title.toLowerCase().includes(q);
    const courseMatch = att.liveClass.batch.course.title.toLowerCase().includes(q);
    const batchMatch = att.liveClass.batch.name.toLowerCase().includes(q);

    const matchesSearch = titleMatch || courseMatch || batchMatch;
    const matchesStatus = statusFilter === "ALL" || att.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Attendance KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Present On-Time</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{presentCount}</div>
            <div className="text-[11px] font-medium text-emerald-700 mt-0.5">Full Credit Attended</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Late Arrivals</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{lateCount}</div>
            <div className="text-[11px] font-medium text-amber-700 mt-0.5">Joined Post-Cutoff</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-[#7C248C] shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Excused Leaves</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{excusedCount}</div>
            <div className="text-[11px] font-medium text-purple-700 mt-0.5">Prior Permission</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Absent / Missed</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{absentCount}</div>
            <div className="text-[11px] font-medium text-rose-700 mt-0.5">Watch Recordings</div>
          </div>
        </div>
      </div>

      {/* Stylized Search & Segmented Filter Bar */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-200/50 via-slate-100 to-pink-200/50 shadow-sm">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/80">
          {/* Stylized Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A] transition group-focus-within:bg-[#E01E6A] group-focus-within:text-white group-focus-within:scale-105 shadow-2xs">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search session title, course, or cohort batch..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {[
                { id: "ALL", label: "All Sessions" },
                { id: "PRESENT", label: "Present" },
                { id: "LATE", label: "Late" },
                { id: "EXCUSED", label: "Excused" },
                { id: "ABSENT", label: "Absent" },
              ].map((st) => {
                const isSelected = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Record" : "Records"}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table Studio */}
      <div className="glass-card rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] font-bold">
                <tr>
                  <th className="py-4 px-5">Live Class & Topic</th>
                  <th className="py-4 px-5">Course & Batch</th>
                  <th className="py-4 px-5">Session Schedule</th>
                  <th className="py-4 px-5">Student Check-In</th>
                  <th className="py-4 px-5">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-pink-50/20 transition group">
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900 text-sm group-hover:text-[#E01E6A] transition">
                        {att.liveClass.title}
                      </div>
                      {att.excuseReason && (
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/60 text-[#7C248C] text-[11px] font-mono">
                          <span>Excuse:</span>
                          <span className="italic">{att.excuseReason}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <span className="text-slate-900 font-bold block">{att.liveClass.batch.course.title}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{att.liveClass.batch.name}</span>
                    </td>

                    <td className="py-4 px-5 font-mono">
                      <div className="text-slate-900 font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateSafe(att.liveClass.scheduledDate)}
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeSafe(att.liveClass.startTime)}
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono">
                      {att.joinClickTime ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {formatTimeSafe(att.joinClickTime)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No Check-In Recorded</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold font-mono px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : att.status === "EXCUSED"
                              ? "bg-purple-50 text-[#7C248C] border-purple-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {att.status === "PRESENT" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {att.status === "LATE" && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {att.status === "EXCUSED" && <HelpCircle className="w-3.5 h-3.5 text-[#7C248C]" />}
                          {att.status === "ABSENT" && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          <span>{att.status}</span>
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            att.isApproved
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}
                        >
                          {att.isApproved ? "✓ Faculty Verified" : "⏳ Pending Signoff"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No attendance sessions found matching your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Policy & Eligibility Guidance Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/50 via-slate-50 to-pink-50/30 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#7C248C] shrink-0" />
          <span>
            Minimum <strong>75.0% live attendance</strong> compliance is mandatory to be eligible for final certificate verification and course completion sign-offs.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400 shrink-0">JVM Academic Policy</span>
      </div>
    </div>
  );
}

