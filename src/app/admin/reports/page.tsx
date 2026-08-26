"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Users,
  BookOpen,
  Layers,
  Award,
  FileSpreadsheet,
  Check,
  ShieldCheck,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    {
      id: "students",
      title: "Student Enrollment & Cohort Registry",
      records: "15 Active Scholars",
      date: "August 2026",
      type: "CSV / Excel Spreadsheet",
      csvHeader: "Student ID,Student Name,Email,Enrolled Course,Cohort Batch,Status,Enrolled Date\n",
      csvData: [
        "USR-101,Sophia Martinez,sophia.student@institute.edu,Full-Stack Next.js 15,Next.js Alpha Cohort 2026,ACTIVE,2026-08-24",
        "USR-102,Liam Chen,liam.student@institute.edu,PostgreSQL Relational Schema,Next.js Alpha Cohort 2026,ACTIVE,2026-08-24",
        "USR-103,Aarav Patel,aarav.student@institute.edu,Microservices Architecture,Next.js Alpha Cohort 2026,ACTIVE,2026-08-23",
      ],
    },
    {
      id: "courses",
      title: "Course Completion & Milestone Audit",
      records: "8 Curricula",
      date: "August 2026",
      type: "CSV / Excel Spreadsheet",
      csvHeader: "Course ID,Title,Level,Faculty Trainer,Duration (Hours),Published Status,Total Lessons\n",
      csvData: [
        "CRS-01,Full-Stack Next.js 15 & Enterprise Architecture,INTERMEDIATE,Prof. Marcus Thorne,42,PUBLISHED,18",
        "CRS-02,PostgreSQL Relational Schema & Sharding,ADVANCED,Dr. Elena Vance,35,PUBLISHED,14",
        "CRS-03,Kubernetes & Cloud Infrastructure,ADVANCED,Prof. Marcus Thorne,48,PUBLISHED,22",
      ],
    },
    {
      id: "attendance",
      title: "Attendance & Google Meet Participation",
      records: "12 Live Sessions",
      date: "August 2026",
      type: "CSV / Excel Spreadsheet",
      csvHeader: "Session ID,Title,Cohort,Trainer,Scheduled Date,Attendance Rate,Meet URL\n",
      csvData: [
        "SES-01,Microservices Architecture Workshop,Next.js Alpha Cohort 2026,Prof. Marcus Thorne,2026-08-25,100%,https://meet.google.com/jvm-arch-live",
        "SES-02,RBAC Security & JWT Edge Proxy Lab,Next.js Alpha Cohort 2026,Dr. Elena Vance,2026-08-24,95%,https://meet.google.com/jvm-sec-live",
      ],
    },
    {
      id: "certificates",
      title: "Issued Academic Certificates Registry",
      records: "6 Conferred Diplomas",
      date: "August 2026",
      type: "CSV / Excel Spreadsheet",
      csvHeader: "Certificate ID,Recipient Name,Email,Course Conferred,Grade,Issue Date,Verification Hash\n",
      csvData: [
        "CERT-2026-A109F2,Sophia Martinez,sophia.student@institute.edu,Full-Stack Next.js 15,Distinction (98%),2026-08-24,0x7f8a9b2c3d4e5f6a",
        "CERT-2026-B884C1,Liam Chen,liam.student@institute.edu,PostgreSQL Relational Schema,Distinction (96%),2026-08-24,0x1a2b3c4d5e6f7a8b",
      ],
    },
  ];

  const handleDownloadCsv = (report: (typeof reports)[0]) => {
    setDownloading(report.id);

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(report.csvHeader + report.csvData.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${report.id}_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(null);
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Institutional Data Warehouse
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Reports & CSV/Excel Data Exports
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Export institutional datasets for audit compliance, accreditation governance, and academic transcripts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r) => (
          <div
            key={r.id}
            className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-xl"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {r.type}
                </span>
                <span className="text-xs text-slate-400 font-mono">{r.date}</span>
              </div>
              <h3 className="font-bold text-base text-white">{r.title}</h3>
              <p className="text-xs text-slate-400 font-mono">{r.records}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Format: UTF-8 (.csv)</span>
              <button
                onClick={() => handleDownloadCsv(r)}
                disabled={downloading === r.id}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                {downloading === r.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Download CSV
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
