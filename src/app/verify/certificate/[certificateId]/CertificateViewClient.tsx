"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, CheckCircle2, ShieldCheck, Home, Award, ArrowLeft, Loader2 } from "lucide-react";

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
  const [downloading, setDownloading] = useState(false);

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Direct high-resolution rendering and download
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // 1. Create a 2000x1414 ultra-high-definition canvas
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 1414;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // 2. Draw base template image
      const baseImg = new window.Image();
      baseImg.crossOrigin = "anonymous";
      baseImg.src = "/certificate-template.png";

      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = reject;
      });

      ctx.drawImage(baseImg, 0, 0, 2000, 1414);

      // 3. Draw Student Full Name (centered above line at 37.2%)
      ctx.fillStyle = "#2B364B";
      ctx.font = "bold 56px 'Cinzel', 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "3px";
      ctx.fillText(certificate.user.name.toUpperCase(), 1000, 580);

      // 4. Draw Issue Date (aligned on underline at bottom left)
      ctx.fillStyle = "#192338";
      ctx.font = "bold 26px 'Times New Roman', serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "0px";
      ctx.fillText(formattedDate, 576, 1264);

      // 5. Draw QR Code if present (at bottom-left corner)
      if (certificate.qrCodeUrl) {
        const qrImg = new window.Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = certificate.qrCodeUrl;

        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve; // Continue if error
        });

        // Draw white background card for QR Code
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(70, 1190, 140, 140, 12);
        ctx.fill();

        ctx.drawImage(qrImg, 75, 1195, 130, 130);

        // Draw Certificate ID
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 19px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.fillText(`ID: ${certificate.certificateNumber}`, 140, 1358);
      }

      // Convert canvas to printable PDF / High-res download
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // Create a print window or trigger direct download
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${certificate.certificateNumber} - ${certificate.user.name}</title>
              <style>
                @page {
                  size: landscape;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background-color: white;
                }
                img {
                  width: 100vw;
                  height: 100vh;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback: direct download link if popups blocked
        const link = document.createElement("a");
        link.download = `${certificate.certificateNumber}_${certificate.user.name.replace(/\s+/g, "_")}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start py-8 px-4 sm:px-6 relative selection:bg-purple-600 selection:text-white">
      {/* Subtle Purple Tint Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header & Actions Bar */}
      <div className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/student/courses"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#7C248C] hover:border-purple-200 shadow-xs transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Credential
              </span>
              <span className="text-xs font-mono text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-600 font-bold">{certificate.certificateNumber}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Official Academic Certificate</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-6 py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-xs text-slate-700 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
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
