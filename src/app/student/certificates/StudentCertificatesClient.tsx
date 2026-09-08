"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Clock,
  Download,
  Copy,
  Check,
  FileCheck,
  ChevronRight,
} from "lucide-react";

export interface StudentCertificateItem {
  id: string;
  certificateNumber: string;
  issueDate: string;
  qrCodeUrl?: string | null;
  course: {
    id: string;
    title: string;
    level?: string | null;
    durationHours?: number | null;
  };
  studentName: string;
}

// Hydration-safe date formatting helper
function formatDateSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function StudentCertificatesClient({
  initialCertificates,
}: {
  initialCertificates: StudentCertificateItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (e: React.MouseEvent, certNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(certNumber);
    setCopiedId(certNumber);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Extract unique levels for filter pills
  const availableLevels = Array.from(
    new Set(initialCertificates.map((c) => c.course.level).filter(Boolean) as string[])
  );

  const filtered = initialCertificates.filter((cert) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = cert.course.title.toLowerCase().includes(q);
    const numMatch = cert.certificateNumber.toLowerCase().includes(q);
    const matchesQuery = titleMatch || numMatch;

    const matchesLevel = levelFilter === "ALL" || cert.course.level === levelFilter;

    return matchesQuery && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Console */}
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
              placeholder="Search by course title or certificate ID (e.g. JVM-CERT-...)"
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

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setLevelFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  levelFilter === "ALL"
                    ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                All Credentials
              </button>
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    levelFilter === lvl
                      ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200/60 text-[#E01E6A] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Certificate" : "Certificates"}
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Studio List Table */}
      <div className="glass-card rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-slate-50 via-purple-50/20 to-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] font-bold">
                <tr>
                  <th className="py-4 px-6">Accredited Course</th>
                  <th className="py-4 px-5">Certificate ID</th>
                  <th className="py-4 px-5">Curriculum Level</th>
                  <th className="py-4 px-5">Issue Date</th>
                  <th className="py-4 px-5">Status & Verification</th>
                  <th className="py-4 px-6 text-right">Certificate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map((cert) => {
                  const targetUrl = `/verify/certificate/${cert.certificateNumber || cert.id}`;
                  return (
                    <tr key={cert.id} className="hover:bg-pink-50/20 transition group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              href={targetUrl}
                              className="font-extrabold text-slate-900 text-sm group-hover:text-[#E01E6A] transition block"
                            >
                              {cert.course.title}
                            </Link>
                            {cert.course.durationHours ? (
                              <span className="text-[11px] font-mono text-slate-400">
                                {cert.course.durationHours} Hours Practical Program
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-bold text-xs">
                          <span>{cert.certificateNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, cert.certificateNumber)}
                            className="text-purple-400 hover:text-[#7C248C] transition cursor-pointer"
                            title="Copy Certificate ID"
                          >
                            {copiedId === cert.certificateNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          {cert.course.level || "Professional"}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateSafe(cert.issueDate)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tamper-Proof & Validated</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-sm shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                        >
                          <span>Open Certificate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-slate-400 space-y-3">
            <Award className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No credentials found matching your search.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete all course lessons, assignments, and curriculum requirements to earn and unlock official certificates!
            </p>
          </div>
        )}
      </div>

      {/* Verification Trust Badge Footer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/50 via-slate-50 to-pink-50/30 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#7C248C] shrink-0" />
          <span>
            All credentials are cryptographically stamped with verifiable QR identifiers issued directly by JVM Institute.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400 shrink-0">Official Academic Registry</span>
      </div>
    </div>
  );
}

