"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, QrCode, ExternalLink, Search, Filter, Calendar } from "lucide-react";

interface CertificateItem {
  id: string;
  certificateNumber: string;
  issueDate: string;
  user: {
    name: string | null;
    email: string;
  };
  course: {
    title: string;
    level: string;
  };
}

export default function AdminCertificatesClient({
  initialCertificates,
}: {
  initialCertificates: CertificateItem[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  const filtered = initialCertificates.filter((cert) => {
    const studentName = (cert.user.name || "").toLowerCase();
    const studentEmail = cert.user.email.toLowerCase();
    const courseTitle = cert.course.title.toLowerCase();
    const certNum = cert.certificateNumber.toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      courseTitle.includes(q) ||
      certNum.includes(q);

    const matchesLevel =
      selectedLevel === "ALL" || cert.course.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, course, or certificate code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-purple-600 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Course Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Certificates Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-[#7C248C] flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#7C248C] font-bold px-3 py-1 rounded-full bg-purple-50 border border-purple-200">
                    {cert.certificateNumber}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{cert.course.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Recipient: <strong className="text-slate-900">{cert.user.name || "N/A"}</strong> ({cert.user.email})
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Issued: {new Date(cert.issueDate).toLocaleDateString()} • Level: {cert.course.level}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/verify/certificate/${cert.certificateNumber}`}
                  className="text-xs font-bold text-[#7C248C] hover:text-purple-900 flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-4 h-4" /> View Public Verification <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Award className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No certificates matching your search criteria were found.</p>
        </div>
      )}
    </div>
  );
}
