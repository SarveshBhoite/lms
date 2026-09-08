"use client";

import { useState } from "react";
import { CheckSquare, Search, Filter } from "lucide-react";

interface AttendanceItem {
  id: string;
  status: string;
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

export default function StudentAttendanceClient({
  initialAttendances,
  attendancePercent,
}: {
  initialAttendances: AttendanceItem[];
  attendancePercent: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-emerald-600" /> Attendance Records
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View-only history of live interactive class attendance logged by your faculty instructors.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center font-mono">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block">Overall Attendance</span>
          <strong className="text-2xl font-black text-emerald-700">{attendancePercent.toFixed(1)}%</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by class title, course, or batch..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px] font-bold">
                <tr>
                  <th className="p-4">Live Class Title</th>
                  <th className="p-4">Course & Batch</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4">Status & Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{att.liveClass.title}</div>
                      {att.excuseReason && (
                        <span className="text-[11px] text-blue-600 font-mono block mt-0.5">
                          Note: {att.excuseReason}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {att.liveClass.batch.course.title} ({att.liveClass.batch.name})
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(att.liveClass.scheduledDate).toLocaleDateString()}{" "}
                      <span className="text-slate-400 text-[11px]">
                        ({new Date(att.liveClass.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      {att.joinClickTime ? (
                        new Date(att.joinClickTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : att.status === "EXCUSED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {att.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {att.isApproved ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">No attendance records matching filter criteria.</div>
        )}
      </div>
    </div>
  );
}
