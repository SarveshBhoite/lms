import Link from "next/link";
import { Award, QrCode, ExternalLink, ShieldCheck } from "lucide-react";

export default function AdminCertificatesPage() {
  const certificates = [
    {
      id: "CERT-2026-000001",
      studentName: "Sophia Martinez",
      email: "sophia.student@institute.edu",
      courseTitle: "Full-Stack Next.js 15 & TypeScript Mastery",
      issueDate: "August 24, 2026",
      status: "VERIFIED",
    },
    {
      id: "CERT-2026-000002",
      studentName: "Liam Chen",
      email: "liam.student@institute.edu",
      courseTitle: "PostgreSQL & Neon Database Engineering",
      issueDate: "August 24, 2026",
      status: "VERIFIED",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Certificate Registry & Verifications</h1>
        <p className="text-slate-500 text-sm mt-1">Audit tamper-proof certificates and access public QR verification endpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs text-[#7C248C] font-bold px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
                {cert.id}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{cert.courseTitle}</h3>
              <p className="text-xs text-slate-600 mt-1">Recipient: <strong className="text-slate-900">{cert.studentName}</strong> ({cert.email})</p>
              <p className="text-xs text-slate-500">Issued: {cert.issueDate}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/verify/certificate/${cert.id}`}
                className="text-xs font-bold text-[#7C248C] hover:text-purple-900 flex items-center gap-1.5 transition"
              >
                <QrCode className="w-4 h-4" /> View Public Verification <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
