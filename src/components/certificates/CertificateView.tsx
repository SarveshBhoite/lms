"use client";

import React, { useRef, useState, useEffect } from "react";
import { Award, Download, Printer, ShieldCheck, ExternalLink, QrCode as QrIcon, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export interface CertificateData {
  id: string;
  certificateNumber: string;
  issueDate: string | Date;
  user: {
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    level?: string;
    durationHours?: number;
    trainer?: {
      name: string;
    };
  };
  metadata?: {
    studentName?: string;
    studentEmail?: string;
    courseTitle?: string;
    batchName?: string;
    trainerName?: string;
    issueDate?: string;
    instituteName?: string;
    status?: string;
    skills?: string[];
  };
}

interface CertificateViewProps {
  certificate: CertificateData;
  showActions?: boolean;
}

export default function CertificateView({ certificate, showActions = true }: CertificateViewProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const studentName = certificate.metadata?.studentName || certificate.user.name;
  const courseTitle = certificate.metadata?.courseTitle || certificate.course.title;
  const batchName = certificate.metadata?.batchName || "Data Engineering Batch A";
  const trainerName = certificate.metadata?.trainerName || "JVM Institute Faculty";
  
  const issueDateFormatted = certificate.metadata?.issueDate
    ? certificate.metadata.issueDate
    : new Date(certificate.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const certId = certificate.certificateNumber;
  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/certificate/${certId}`
    : `/verify/certificate/${certId}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [verifyUrl]);

  const handlePrint = () => {
    window.print();
  };

  const skillsList = certificate.metadata?.skills || [
    "SQL",
    "Python",
    "PySpark",
    "Big Data",
    "GCP",
    "Azure",
  ];

  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      {/* Actions Toolbar */}
      {showActions && (
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Official Certificate #{certId}</p>
              <p className="text-[11px] text-slate-500">Issued to {studentName} on {issueDateFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 text-[#7C248C] bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5"
            >
              <QrIcon className="w-4 h-4" /> Verify Publicly <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white jvm-gradient-bg jvm-gradient-hover shadow-sm transition flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" /> Download Certificate
            </button>
          </div>
        </div>
      )}

      {/* Main Certificate Frame (Visual Exact Reference Match) */}
      <div className="w-full flex justify-center overflow-x-auto p-2">
        <div
          ref={certRef}
          id="printable-certificate"
          className="relative w-[960px] h-[680px] bg-white border-[3px] border-[#0f172a] p-3 shadow-2xl overflow-hidden shrink-0 text-slate-900 selection:bg-purple-200"
          style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
        >
          {/* Inner Decorative Border Frame */}
          <div className="w-full h-full border-[2px] border-[#8b1d6b] p-6 relative flex flex-col justify-between bg-gradient-to-br from-slate-50/40 via-white to-purple-50/20">
            
            {/* TOP-RIGHT CORNER DIAGONAL RIBBON */}
            <div className="absolute -top-12 -right-12 w-48 h-48 pointer-events-none z-10 overflow-hidden">
              <div className="absolute top-14 right-0 w-64 h-12 bg-gradient-to-r from-indigo-950 via-purple-900 to-pink-600 rotate-45 transform shadow-md flex items-center justify-center">
                <div className="w-full h-1 bg-amber-400/70" />
              </div>
            </div>

            {/* BOTTOM-LEFT CORNER DIAGONAL RIBBON */}
            <div className="absolute -bottom-12 -left-12 w-48 h-48 pointer-events-none z-10 overflow-hidden">
              <div className="absolute bottom-14 left-0 w-64 h-12 bg-gradient-to-r from-indigo-950 via-purple-900 to-amber-500 -rotate-45 transform shadow-md flex items-center justify-center">
                <div className="w-full h-1 bg-purple-300/60" />
              </div>
            </div>

            {/* TOP HEADER ROW: LOGO (Left) & MEDALLION (Right) */}
            <div className="flex items-start justify-between relative z-20 pt-2 px-4">
              
              {/* JVM Institute Logo & Title */}
              <div className="flex items-center gap-3">
                {/* JVM Logo Icon */}
                <div className="w-14 h-14 relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-xs">
                    <polygon points="10,20 45,85 45,20" fill="#1E3A8A" />
                    <polygon points="45,85 85,20 65,20 45,55" fill="#C084FC" />
                    <polygon points="45,55 65,20 90,20 45,90" fill="#8B1D6B" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-3xl font-black tracking-tight text-[#8b1d6b]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    JVM
                  </span>
                  <span
                    className="text-[10px] font-bold tracking-[0.25em] text-slate-600 uppercase border-t border-slate-300 pt-0.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    INSTITUTE
                  </span>
                </div>
              </div>

              {/* Gold Medallion Ribbon Badge */}
              <div className="relative pr-8 -mt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-lg flex items-center justify-center relative">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-amber-100 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 flex flex-col items-center justify-center text-amber-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-300/10 blur-xs rounded-full" />
                    {/* Laurel Wreath */}
                    <div className="text-amber-100 flex items-center justify-center gap-0.5">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-90">
                        <path d="M12 2L10 6L6 6L8 10L6 14L10 14L12 18L14 14L18 14L16 10L18 6L14 6Z" />
                      </svg>
                    </div>
                    {/* Star accent */}
                    <span className="text-xs font-bold text-amber-200 -mt-1">★</span>
                  </div>
                </div>
              </div>

            </div>

            {/* CENTER CERTIFICATE TEXT CONTENT */}
            <div className="flex flex-col items-center text-center space-y-2 relative z-20 my-auto px-8">
              
              {/* Title */}
              <h1
                className="text-4xl sm:text-5xl font-normal tracking-[0.12em] text-[#0f172a] uppercase"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                CERTIFICATE
              </h1>

              {/* Subtitle with Diamond Accent */}
              <div className="flex items-center gap-3 text-slate-700 text-sm font-semibold tracking-[0.3em] uppercase">
                <span className="h-[1px] w-12 bg-slate-400" />
                <span className="text-[#8b1d6b] text-xs">❖</span>
                <span>OF COMPLETION</span>
                <span className="text-[#8b1d6b] text-xs">❖</span>
                <span className="h-[1px] w-12 bg-slate-400" />
              </div>

              {/* Flourish Diamond Line */}
              <div className="flex items-center justify-center gap-1.5 text-[#8b1d6b] text-xs py-1">
                <span>──</span>
                <span>◆</span>
                <span>──</span>
              </div>

              {/* Presentation Text */}
              <p
                className="text-xs font-bold tracking-[0.25em] text-slate-700 uppercase"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                THIS CERTIFICATE IS PRESENTED TO
              </p>

              {/* Student Recipient Name Line */}
              <div className="w-full max-w-xl my-2 border-b border-slate-400 pb-1 flex flex-col items-center justify-center">
                <span
                  className="text-3xl sm:text-4xl font-bold text-[#0f172a] tracking-wide"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {studentName}
                </span>
              </div>

              {/* Diamond Center Divider */}
              <div className="flex items-center justify-center text-[#8b1d6b] text-xs">
                <span>◆</span>
              </div>

              {/* Completion Statement */}
              <p className="text-sm italic text-slate-700 font-serif mt-1">
                for successfully completing the
              </p>

              {/* Course Title (Bold Uppercase) */}
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-[#1e3a8a] my-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {courseTitle}
              </h2>

              {/* Subtext */}
              <p className="text-xs italic text-slate-600 max-w-2xl">
                with successful completion of the prescribed training program covering:
              </p>

              {/* SKILLS BREAKDOWN ROW (SQL | Python | PySpark | Big Data | GCP | Azure) */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3 pb-2 text-xs font-semibold text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                {skillsList.map((skill, index) => (
                  <React.Fragment key={skill}>
                    <div className="flex items-center gap-1.5">
                      {skill.toLowerCase().includes("sql") && (
                        <span className="text-blue-600 font-mono">🗄️</span>
                      )}
                      {skill.toLowerCase().includes("python") && (
                        <span className="text-amber-500 font-mono">🐍</span>
                      )}
                      {skill.toLowerCase().includes("pyspark") && (
                        <span className="text-orange-500 font-mono">⭐</span>
                      )}
                      {skill.toLowerCase().includes("big data") && (
                        <span className="text-[#8b1d6b] font-mono">🕸️</span>
                      )}
                      {skill.toLowerCase().includes("gcp") && (
                        <span className="text-blue-500 font-mono">☁️</span>
                      )}
                      {skill.toLowerCase().includes("azure") && (
                        <span className="text-indigo-600 font-mono">🔷</span>
                      )}
                      <span className="font-bold text-slate-900">{skill}</span>
                    </div>
                    {index < skillsList.length - 1 && (
                      <span className="text-slate-300 font-normal">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

            </div>

            {/* BOTTOM FOOTER SECTION: Issue Date (Left), Ornament (Center), Signature (Right) */}
            <div className="flex items-end justify-between relative z-20 px-6 pb-2 text-xs">
              
              {/* Left: Issue Date */}
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Date of Issue:
                  </span>
                  <span className="border-b border-slate-700 px-3 font-semibold text-slate-800">
                    {issueDateFormatted}
                  </span>
                </div>
                {/* Subtle Certificate ID and QR Code */}
                <div className="flex items-center gap-2 pt-1">
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="Verification QR Code" className="w-10 h-10 border border-slate-200 rounded-xs" />
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    <p className="font-bold text-purple-900">{certId}</p>
                    <p className="text-[9px]">Verified Credential</p>
                  </div>
                </div>
              </div>

              {/* Center: Flourish Emblem */}
              <div className="flex items-center justify-center text-[#8b1d6b] text-base pb-3">
                <span>── ⚜ ──</span>
              </div>

              {/* Right: Authorized Signatory */}
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="w-48 border-b border-slate-700 pb-1">
                  <span className="font-serif italic text-slate-700 text-sm font-bold">
                    JVM Authority
                  </span>
                </div>
                <div className="flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="font-bold text-slate-900 text-xs">
                    Authorized Signatory
                  </span>
                  <span className="text-[10px] text-slate-600">
                    JVM Institute Private Limited.
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* CSS Print Styles for Seamless PDF/Print Downloading */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 3px solid #0f172a !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
