import Link from "next/link";
import { Award, ShieldCheck, CheckCircle2, QrCode, ExternalLink } from "lucide-react";

export default function StudentCertificatesPage() {
  const sampleCertificate = {
    id: "CERT-2026-000001",
    courseTitle: "Full-Stack Next.js 15 & TypeScript Mastery",
    studentName: "Sophia Martinez",
    issueDate: "August 24, 2026",
    grade: "Distinction (96%)",
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Earned Certificates</h1>
        <p className="text-slate-400 text-sm mt-1">Verified credentials with cryptographic IDs and public QR scan verification.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {sampleCertificate.id}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{sampleCertificate.courseTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">Awarded to: <span className="text-white font-medium">{sampleCertificate.studentName}</span></p>
            <p className="text-xs text-slate-400">Issued on: {sampleCertificate.issueDate} • Grade: {sampleCertificate.grade}</p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <Link
              href={`/verify/certificate/${sampleCertificate.id}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <QrCode className="w-4 h-4" /> View Public Verification <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
