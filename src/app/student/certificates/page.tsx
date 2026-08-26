"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

interface CertificateItem {
  id: string;
  courseTitle: string;
  studentName: string;
  issueDate: string;
  grade: string;
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // In production queries /api/auth/me or DB
    setCertificates([
      {
        id: "CERT-2026-A109F2",
        courseTitle: "Full-Stack Next.js 15 & Enterprise Architecture",
        studentName: "Sophia Martinez",
        issueDate: "August 24, 2026",
        grade: "Distinction (98%)",
      },
    ]);
    setLoading(false);
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <Award className="w-3.5 h-3.5" /> Academic Credentials
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Earned Certificates & Diplomas
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Cryptographically verifiable credentials issued by {INSTITUTE_CONFIG.name}.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-2" />
          Loading your academic credentials...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="glass-panel p-7 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
                    <Award className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleCopyId(cert.id)}
                    className="text-xs font-mono text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
                    title="Click to copy Certificate ID"
                  >
                    {copiedId === cert.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {cert.id}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                    Official Academic Credential
                  </span>
                  <h3 className="text-lg font-bold text-white leading-snug">{cert.courseTitle}</h3>
                  <p className="text-xs text-slate-300">
                    Conferred to: <strong className="text-white">{cert.studentName}</strong>
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 font-mono">
                    <span>Issued: {cert.issueDate}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{cert.grade}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <Link
                  href={`/verify/certificate/${cert.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <QrCode className="w-4 h-4" /> Public Verification <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/verify/certificate/${cert.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> View & Download PDF
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
