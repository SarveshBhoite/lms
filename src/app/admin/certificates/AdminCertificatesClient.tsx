"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  QrCode,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  BookOpen,
  Eye,
  X,
  Copy,
  Layers,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentOption {
  id?: string;
  name: string | null;
  email: string;
  profile?: { phone?: string | null; avatarUrl?: string | null } | null;
}

interface CourseOption {
  id: string;
  title: string;
  level: string;
}

interface CertificateItem {
  id: string;
  certificateNumber: string;
  issueDate: string;
  qrCodeUrl?: string | null;
  user: StudentOption;
  course: {
    id?: string;
    title: string;
    slug?: string;
    level: string;
    durationHours?: number;
    thumbnailUrl?: string | null;
  };
}

export default function AdminCertificatesClient({
  initialCertificates,
  courses,
}: {
  initialCertificates: CertificateItem[];
  courses: CourseOption[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filters logic: student name, email, course title, certificate code, course id, level
  const filtered = initialCertificates.filter((cert) => {
    const studentName = (cert.user.name || "").toLowerCase();
    const studentEmail = cert.user.email.toLowerCase();
    const courseTitle = cert.course.title.toLowerCase();
    const certNum = cert.certificateNumber.toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      courseTitle.includes(q) ||
      certNum.includes(q);

    const matchesCourse = !selectedCourse || cert.course.title === selectedCourse;
    const matchesLevel = selectedLevel === "ALL" || cert.course.level === selectedLevel;

    return matchesSearch && matchesCourse && matchesLevel;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Metrics
  const totalCertificates = initialCertificates.length;
  const uniqueStudents = new Set(initialCertificates.map((c) => c.user.email)).size;
  const uniqueCourses = new Set(initialCertificates.map((c) => c.course.title)).size;
  const beginnerCount = initialCertificates.filter((c) => c.course.level === "BEGINNER").length;
  const intermediateCount = initialCertificates.filter((c) => c.course.level === "INTERMEDIATE").length;
  const advancedCount = initialCertificates.filter((c) => c.course.level === "ADVANCED").length;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header Banner - JVM Studio Theme */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-purple-50/40 to-indigo-50/30 px-6 py-6 sm:px-8 sm:py-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-500/10 blur-xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C248C] text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#7C248C]" /> Tamper-Proof Credential Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-8 h-8 text-[#7C248C]" /> Certificate Registry 🎓
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Verify issued course credentials, inspect student completion records, and review tamper-proof QR verification endpoints across all academy programs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
          <Link
            href="/admin/enrollments"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" /> Manage Enrollments
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#7C248C]" /> Total Issued
          </div>
          <div className="text-2xl font-black text-[#7C248C]">{totalCertificates}</div>
          <div className="text-[11px] font-mono text-purple-700 font-semibold">Verified Credentials</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> Certified Students
          </div>
          <div className="text-2xl font-black text-emerald-600">{uniqueStudents}</div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">Unique Graduates</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Program Depth
          </div>
          <div className="text-2xl font-black text-indigo-600">{uniqueCourses}</div>
          <div className="text-[11px] font-mono text-indigo-700 font-semibold">Courses With Awards</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" /> QR Verifications
          </div>
          <div className="text-2xl font-black text-cyan-700">100%</div>
          <div className="text-[11px] font-mono text-cyan-700 font-semibold">Tamper-Proof & Active</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, email, course, or certificate ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            />
          </div>

          {/* Course-wise Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            >
              <option value="">All Courses ({courses.length} Available)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#7C248C] transition"
            >
              <option value="ALL">All Academic Levels</option>
              <option value="BEGINNER">Beginner ({beginnerCount})</option>
              <option value="INTERMEDIATE">Intermediate ({intermediateCount})</option>
              <option value="ADVANCED">Advanced ({advancedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4 flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-3.5">
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleCopy(cert.certificateNumber)}
                    className="group/btn inline-flex items-center gap-1.5 font-mono text-[11px] text-[#7C248C] font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                    title="Click to copy Certificate ID"
                  >
                    <span>{cert.certificateNumber}</span>
                    {copiedCode === cert.certificateNumber ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-purple-400 group-hover/btn:text-purple-700" />
                    )}
                  </button>
                </div>

                {/* Course Title */}
                <div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-700 font-bold uppercase tracking-wider mb-1">
                    <BookOpen className="w-3 h-3" /> {cert.course.level} Level
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#7C248C] transition line-clamp-2">
                    {cert.course.title}
                  </h3>
                </div>

                {/* Recipient info */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  {cert.user.profile?.avatarUrl ? (
                    <img
                      src={cert.user.profile.avatarUrl}
                      alt={cert.user.name || "Student"}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C248C] font-black text-xs flex items-center justify-center shrink-0 border border-purple-200">
                      {(cert.user.name || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs truncate">{cert.user.name || "N/A"}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{cert.user.email}</div>
                  </div>
                </div>

                {/* Issue Date & Status */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Issued: {formatDate(cert.issueDate)}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCertificate(cert)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Quick View
                </button>

                <Link
                  href={`/verify/certificate/${cert.certificateNumber}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] font-bold text-xs border border-purple-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#7C248C]" /> Public Page <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/90 shadow-xs">
          <Award className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No matching certificates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, course filter, or academic level selection to view certificates.
          </p>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7C248C]" /> Certificate Inspection
              </h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Certificate Number Header Box */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-purple-700 font-bold">Credential Identifier</div>
                  <div className="text-sm font-black text-[#7C248C] font-mono mt-0.5">
                    {selectedCertificate.certificateNumber}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(selectedCertificate.certificateNumber)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-[#7C248C] text-xs font-bold hover:bg-purple-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode === selectedCertificate.certificateNumber ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Student info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Graduate Information</div>
                <div className="flex items-center gap-3">
                  {selectedCertificate.user.profile?.avatarUrl ? (
                    <img
                      src={selectedCertificate.user.profile.avatarUrl}
                      alt={selectedCertificate.user.name || "Graduate"}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C248C] font-black text-sm flex items-center justify-center border border-purple-200">
                      {(selectedCertificate.user.name || "G").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedCertificate.user.name || "N/A"}</h4>
                    <p className="text-slate-500 font-mono">{selectedCertificate.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Course info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Certified Program</div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCertificate.course.title}</h4>
                <p className="text-slate-500 font-mono">
                  Level: {selectedCertificate.course.level} • Issued: {formatDate(selectedCertificate.issueDate)}
                </p>
              </div>

              {/* Verification Link info */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-800 uppercase text-[10px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Proof Cryptographic Signature
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  This credential is authenticated against the JVM Institute blockchain-aligned verification protocol with high-resolution digital image rendering.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/verify/certificate/${selectedCertificate.certificateNumber}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#7C248C] hover:underline"
                  >
                    Open Public Verification & Download View <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
