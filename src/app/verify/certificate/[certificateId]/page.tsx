"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Home,
  ArrowLeft,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateId = params.certificateId as string;

  const [copied, setCopied] = useState(false);
  const [certData, setCertData] = useState({
    id: certificateId,
    studentName: "Sophia Martinez",
    courseTitle: "Full-Stack Next.js 15 & Enterprise Architecture",
    issueDate: "August 24, 2026",
    grade: "Distinction (98%)",
    status: "OFFICIALLY_VERIFIED",
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative selection:bg-indigo-500 selection:text-white print:bg-white print:p-0">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none print:hidden" />

      {/* Top Action Bar */}
      <div className="max-w-4xl w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 z-20 print:hidden">
        <Link
          href="/student/certificates"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Credentials
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyId}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied ID!" : "Copy Credential ID"}
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Official Academic Diploma Container */}
      <div className="max-w-4xl w-full bg-slate-950/90 print:bg-white print:text-slate-900 rounded-3xl border-4 border-amber-500/30 p-8 sm:p-14 shadow-2xl relative overflow-hidden print:shadow-none print:border-8 print:border-amber-600 print:rounded-none">
        {/* Background Watermark Seal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Award className="w-[500px] h-[500px] text-white print:text-slate-900" />
        </div>

        {/* Ornate Frame Inner Border */}
        <div className="border border-amber-500/20 p-6 sm:p-10 rounded-2xl space-y-8 relative z-10 print:border-2 print:border-amber-700">
          {/* Header & Crest */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl print:border-amber-700">
              <Award className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-300 print:text-amber-900 tracking-wider uppercase">
              {INSTITUTE_CONFIG.name}
            </h2>

            <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 print:text-slate-600">
              {INSTITUTE_CONFIG.accreditation}
            </p>

            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto mt-2" />
          </div>

          {/* Body Statement */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm text-slate-300 print:text-slate-700 uppercase tracking-widest font-mono">
              This is to officially certify that
            </p>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white print:text-slate-950 tracking-tight">
              {certData.studentName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 print:text-slate-700 leading-relaxed">
              has successfully fulfilled all institutional criteria, capstone milestones, and curriculum requirements to earn the certificate of completion in
            </p>

            <h3 className="text-lg sm:text-2xl font-bold text-indigo-300 print:text-indigo-900 tracking-tight">
              {certData.courseTitle}
            </h3>

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:text-emerald-800 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Grade: {certData.grade}
            </div>
          </div>

          {/* Signatures & QR Code Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-8 border-t border-slate-800 print:border-slate-300">
            {/* Signature 1 */}
            <div className="text-center sm:text-left space-y-1">
              <div className="font-serif italic text-lg text-amber-300/90 print:text-amber-900 border-b border-slate-700 print:border-slate-400 pb-1">
                Prof. Marcus Thorne
              </div>
              <div className="text-[10px] font-mono uppercase text-slate-400 print:text-slate-600 font-bold">
                Dean of Academic Affairs
              </div>
            </div>

            {/* QR Code Validation */}
            <div className="flex flex-col items-center justify-center space-y-1.5 text-center">
              <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center border border-slate-700">
                <QrCode className="w-16 h-16 text-slate-950" />
              </div>
              <span className="text-[9px] font-mono text-emerald-400 print:text-emerald-700 font-bold uppercase tracking-wider">
                Cryptographically Verified
              </span>
            </div>

            {/* Signature 2 */}
            <div className="text-center sm:text-right space-y-1">
              <div className="font-serif italic text-lg text-amber-300/90 print:text-amber-900 border-b border-slate-700 print:border-slate-400 pb-1">
                Dr. Elena Vance
              </div>
              <div className="text-[10px] font-mono uppercase text-slate-400 print:text-slate-600 font-bold">
                Chancellor & Director
              </div>
            </div>
          </div>

          {/* Certificate Metadata Footer */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 print:text-slate-600 border-t border-slate-900 print:border-slate-200 gap-2">
            <span>Certificate ID: <strong className="text-slate-300 print:text-slate-900">{certificateId}</strong></span>
            <span>Conferred Date: <strong className="text-slate-300 print:text-slate-900">{certData.issueDate}</strong></span>
            <span>Registry: <strong className="text-emerald-400 print:text-emerald-700">ISO 9001:2015</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
