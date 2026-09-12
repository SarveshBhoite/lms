"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, CheckCircle2, ShieldCheck, Home, Award, ArrowLeft, Loader2, ZoomIn, X, Maximize2, MoveHorizontal } from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"fit" | "scroll">("fit");

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-6 relative selection:bg-purple-600 selection:text-white overflow-x-hidden">
      {/* Subtle Purple Tint Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[250px] sm:h-[400px] bg-purple-600/5 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header & Actions Bar */}
      <div className="max-w-5xl w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 sm:mb-6 z-10 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            href="/student/certificates"
            className="self-start sm:self-auto p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#7C248C] hover:border-purple-200 shadow-xs transition flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Certificates
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Credential
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">•</span>
              <span className="text-[11px] sm:text-xs font-mono text-slate-600 font-bold bg-slate-100 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-md sm:rounded-none break-all">
                {certificate.certificateNumber}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 sm:mt-0.5">Official Academic Certificate</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={Boolean(downloading || loadingImage || !lockedImageUrl)}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
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
      <div className="max-w-5xl w-full flex flex-col items-center justify-center z-10">
        {/* Mobile View Mode Switcher */}
        <div className="flex sm:hidden items-center justify-center bg-slate-200/70 p-1 rounded-xl mb-3 w-full max-w-[300px]">
          <button
            type="button"
            onClick={() => setMobileViewMode("fit")}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileViewMode === "fit"
                ? "bg-white text-[#7C248C] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fit Screen
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode("scroll")}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileViewMode === "scroll"
                ? "bg-white text-[#7C248C] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" /> Full Size Scroll
          </button>
        </div>

        {/* Responsive Certificate Image Card */}
        <div 
          className={`relative w-full rounded-xl sm:rounded-3xl border border-slate-200 bg-white select-none transition-all ${
            mobileViewMode === "scroll" 
              ? "overflow-x-auto overflow-y-hidden shadow-lg" 
              : "overflow-hidden aspect-[1000/707] max-w-[1000px] shadow-lg sm:shadow-2xl"
          }`}
        >
          {loadingImage || !lockedImageUrl ? (
            <div className="w-full h-48 sm:h-auto sm:aspect-[1000/707] flex flex-col items-center justify-center bg-slate-50 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#7C248C]" />
              <span className="text-xs font-bold font-mono">Generating Official Credential...</span>
            </div>
          ) : (
            <div 
              onClick={() => setIsFullscreen(true)}
              className={`relative ${
                mobileViewMode === "scroll" 
                  ? "min-w-[620px] aspect-[1000/707] cursor-pointer group" 
                  : "w-full aspect-[1000/707] cursor-pointer group"
              }`}
            >
              <img
                src={lockedImageUrl}
                alt={`Certificate of Completion - ${certificate.user.name}`}
                className="w-full h-full object-contain rounded-xl sm:rounded-3xl pointer-events-none"
              />
              {/* Mobile overlay tap indicator */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md opacity-90 group-hover:opacity-100 transition pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-purple-300" />
                <span>Tap to expand</span>
              </div>
            </div>
          )}
        </div>

        {/* Helper caption below image for mobile */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-500 font-medium">
          {mobileViewMode === "scroll" ? (
            <>
              <MoveHorizontal className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Swipe horizontally to view full size detail • Tap to expand</span>
            </>
          ) : (
            <>
              <ZoomIn className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Tap certificate image for full-screen view</span>
            </>
          )}
        </div>
      </div>

      {/* Verification Trust Badge Footer */}
      <div className="max-w-2xl w-full mt-6 sm:mt-8 text-center space-y-2.5 sm:space-y-3 z-10 print:hidden">
        <div className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 shadow-xs text-slate-700 text-[11px] sm:text-xs font-mono max-w-full flex-wrap sm:flex-nowrap">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-center">Tamper-proof digital certificate issued by JVM Institute Private Limited</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 px-2">
          This digital credential can be independently validated anytime by scanning the on-document QR code.
        </p>
      </div>

      {/* Full-Screen Lightbox View for Mobile / Detail Inspection */}
      {isFullscreen && lockedImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">High-Resolution Certificate View</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="relative w-full max-w-5xl max-h-[80vh] flex items-center justify-center my-auto overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lockedImageUrl}
              alt={`Full Certificate - ${certificate.user.name}`}
              className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div className="w-full max-w-5xl flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadPDF();
              }}
              disabled={downloading}
              className="px-6 py-2.5 rounded-xl jvm-gradient-bg text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



