"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, CheckCircle2, ShieldCheck, Home, Award, ArrowLeft, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

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
  const [lockedImageUrl, setLockedImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate locked high-definition 2000x1414 composite image on mount
  useEffect(() => {
    let isMounted = true;

    async function generateLockedCertificate() {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 2000;
        canvas.height = 1414;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Draw base template image
        const baseImg = new window.Image();
        baseImg.crossOrigin = "anonymous";
        baseImg.src = "/certificate-template.png";

        await new Promise((resolve, reject) => {
          baseImg.onload = resolve;
          baseImg.onerror = reject;
        });

        ctx.drawImage(baseImg, 0, 0, 2000, 1414);

        // 2. Draw Student Name (centered nicely between "THIS CERTIFICATE IS PRESENTED TO" and the underline)
        ctx.fillStyle = "#2B364B";
        ctx.font = "bold 58px 'Cinzel', 'Times New Roman', 'Georgia', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.letterSpacing = "2.5px";
        ctx.fillText(certificate.user.name.toUpperCase(), 1000, 588);

        // 3. Draw Issue Date (aligned comfortably on the underline after "Date of Issue:")
        ctx.fillStyle = "#192338";
        ctx.font = "bold 28px 'Times New Roman', 'Georgia', serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.letterSpacing = "0px";
        ctx.fillText(formattedDate, 570, 1258);

        // 4. Draw QR Code and crisp white ID label (bottom-left corner)
        if (certificate.qrCodeUrl) {
          const qrImg = new window.Image();
          qrImg.crossOrigin = "anonymous";
          qrImg.src = certificate.qrCodeUrl;

          await new Promise((resolve) => {
            qrImg.onload = resolve;
            qrImg.onerror = resolve;
          });

          // Draw white card for QR
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(102, 1142, 160, 160, 14);
          ctx.fill();

          ctx.drawImage(qrImg, 107, 1147, 150, 150);

          // Draw Certificate ID in pure bright white with shadow
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 17px monospace, sans-serif";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          ctx.fillText(`ID: ${certificate.certificateNumber}`, 182, 1332);
        }

        const compositeUrl = canvas.toDataURL("image/png", 1.0);
        if (isMounted) {
          setLockedImageUrl(compositeUrl);
          setLoadingImage(false);
        }
      } catch (err) {
        console.error("Failed to render locked certificate image:", err);
        if (isMounted) setLoadingImage(false);
      }
    }

    generateLockedCertificate();

    return () => {
      isMounted = false;
    };
  }, [certificate, formattedDate]);

  // Direct 1-click single-page landscape PDF export
  const handleDownloadPDF = () => {
    if (!lockedImageUrl) return;
    setDownloading(true);

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1000, 707],
      });

      pdf.addImage(lockedImageUrl, "PNG", 0, 0, 1000, 707);

      const fileName = `${certificate.certificateNumber}_${certificate.user.name.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF download error:", err);
      // Fallback direct image download
      const link = document.createElement("a");
      link.download = `${certificate.certificateNumber}_${certificate.user.name.replace(/\s+/g, "_")}.png`;
      link.href = lockedImageUrl;
      link.click();
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
            href="/student/certificates"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#7C248C] hover:border-purple-200 shadow-xs transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Certificates
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
            disabled={Boolean(downloading || loadingImage || !lockedImageUrl)}
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

      {/* ---------------- LOCKED CERTIFICATE DISPLAY CONTAINER ---------------- */}
      {/* Rendered as a single unified responsive image so nothing can ever misalign */}
      <div className="max-w-5xl w-full flex justify-center z-10">
        <div className="relative w-full aspect-[1000/707] max-w-[1000px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white select-none">
          {loadingImage || !lockedImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#7C248C]" />
              <span className="text-xs font-bold font-mono">Generating Official Credential...</span>
            </div>
          ) : (
            <img
              src={lockedImageUrl}
              alt={`Certificate of Completion - ${certificate.user.name}`}
              className="w-full h-full object-contain rounded-2xl sm:rounded-3xl pointer-events-none"
            />
          )}
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
    </div>
  );
}

