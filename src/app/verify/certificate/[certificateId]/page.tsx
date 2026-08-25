import Link from "next/link";
import { Award, ShieldCheck, CheckCircle2, QrCode, Home, ArrowLeft } from "lucide-react";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-8 relative z-10">
        {/* Verification Status Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Official Academic Certificate Verified
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">EduPulse Institute of Technology</h1>
        </div>

        {/* Certificate Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-semibold uppercase">Certificate ID:</span>
            <span className="font-mono text-emerald-400 font-bold">{certificateId}</span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-semibold uppercase">Student Recipient:</span>
            <span className="font-semibold text-white text-sm">Sophia Martinez</span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-semibold uppercase">Course Completed:</span>
            <span className="font-semibold text-indigo-400 text-sm">Full-Stack Next.js 15 & TypeScript Mastery</span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-semibold uppercase">Grade / Performance:</span>
            <span className="font-semibold text-emerald-400">Distinction (96%)</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold uppercase">Issue Date:</span>
            <span className="text-slate-200">August 24, 2026</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Home className="w-4 h-4" /> Back to LMS Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
