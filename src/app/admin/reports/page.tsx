import Link from "next/link";
import { BarChart3, Download, Users, BookOpen, Layers, Award } from "lucide-react";

export default function AdminReportsPage() {
  const reports = [
    { title: "Student Enrollment & Cohort Registry", records: "3 Records", date: "August 2026", type: "CSV / Excel" },
    { title: "Course Completion & Milestone Audit", records: "2 Courses", date: "August 2026", type: "CSV / Excel" },
    { title: "Attendance & Google Meet Participation", records: "1 Session", date: "August 2026", type: "CSV / Excel" },
    { title: "Issued Certificates Registry", records: "2 Certificates", date: "August 2026", type: "CSV / Excel" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">System Reports & CSV/Excel Exports</h1>
        <p className="text-slate-500 text-sm mt-1">Download institutional reports for compliance, performance tracking, and grading audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r) => (
          <div key={r.title} className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500">{r.records} • Period: {r.date}</p>
            </div>
            <button className="px-4 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
