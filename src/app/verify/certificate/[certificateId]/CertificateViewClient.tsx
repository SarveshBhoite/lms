"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Printer, CheckCircle2, ShieldCheck, Home, Award, ArrowLeft } from "lucide-react";

interface CertificateViewClientProps {
  certificate: {
    id: string;
    certificateNumber: string;
    issueDate: string;
    qrCodeUrl?: string | null;
    user: {
      name: string;
      email: string;
    };
    course: {
      title: string;
      level?: string;
    };
  };
}

export default function CertificateViewClient({ certificate }: CertificateViewClientProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative selection:bg-purple-600 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header & Actions Bar */}
      <div className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/student/courses"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Credential
              </span>
              <span className="text-xs font-mono text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400 font-bold">{certificate.certificateNumber}</span>
            </div>
            <h1 className="text-lg font-black text-white">Official Academic Certificate</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ---------------- CERTIFICATE CANVAS CONTAINER ---------------- */}
      {/* Standard Aspect Ratio matching 1000x707 (approx 1.414 standard certificate ratio) */}
      <div className="max-w-5xl w-full flex justify-center z-10">
        <div
          ref={certificateRef}
          id="jvm-certificate-document"
          className="relative w-full aspect-[1000/707] max-w-[1000px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-white select-none print:shadow-none print:border-none print:m-0 print:w-full"
          style={{
            pageBreakInside: "avoid",
          }}
        >
          {/* Base High-Resolution JVM Institute Certificate Template */}
          <img
            src="/certificate-template.png"
            alt="JVM Institute Certificate of Completion Template"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* 1. DYNAMIC STUDENT RECIPIENT NAME OVERLAY */}
          {/* Positioned precisely above the underline beneath "THIS CERTIFICATE IS PRESENTED TO" */}
          <div
            className="absolute left-0 right-0 text-center flex items-center justify-center pointer-events-none"
            style={{
              top: "37.2%",
              height: "7.2%",
            }}
          >
            <h2
              className="text-[#2B364B] font-serif font-bold tracking-wider uppercase px-4"
              style={{
                fontSize: "clamp(14px, 2.5vw, 28px)",
                letterSpacing: "0.07em",
              }}
            >
              {certificate.user.name}
            </h2>
          </div>

          {/* 2. DYNAMIC ISSUE DATE OVERLAY */}
          {/* Positioned directly right on "Date of Issue: ________" underline */}
          <div
            className="absolute pointer-events-none flex items-center"
            style={{
              bottom: "10.4%",
              left: "28.8%",
              width: "10.5%",
            }}
          >
            <span
              className="font-bold text-[#192338] font-serif tracking-tight whitespace-nowrap"
              style={{
                fontSize: "clamp(7px, 1.05vw, 12px)",
              }}
            >
              {formattedDate}
            </span>
          </div>

          {/* 3. DYNAMIC SCANNABLE VERIFICATION QR CODE OVERLAY */}
          {/* Positioned cleanly on the bottom-left corner with high-contrast white ID label */}
          <div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              bottom: "4%",
              left: "3%",
            }}
          >
            {certificate.qrCodeUrl && (
              <div className="p-1 sm:p-1.5 bg-white rounded-lg shadow-sm border border-slate-200/80">
                <img
                  src={certificate.qrCodeUrl}
                  alt="Official Certificate Verification QR Code"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                />
              </div>
            )}
            <span
              className="mt-1 font-mono font-extrabold text-white uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{
                fontSize: "clamp(7px, 0.85vw, 10.5px)",
              }}
            >
              ID: {certificate.certificateNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Trust Badge Footer */}
      <div className="max-w-2xl w-full mt-8 text-center space-y-3 z-10 print:hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tamper-proof digital certificate issued by JVM Institute Private Limited</span>
        </div>
        <p className="text-[11px] text-slate-500">
          This digital credential can be independently validated anytime by scanning the on-document QR code.
        </p>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #jvm-certificate-document {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
