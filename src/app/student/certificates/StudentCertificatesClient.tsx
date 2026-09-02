"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, Download, ExternalLink, QrCode, CheckCircle2, Eye, X, BookOpen } from "lucide-react";
import CertificateView, { CertificateData } from "@/components/certificates/CertificateView";

interface StudentCertificatesClientProps {
  initialCertificates: CertificateData[];
  studentName: string;
}

export default function StudentCertificatesClient({
  initialCertificates,
  studentName,
}: StudentCertificatesClientProps) {
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#7C248C]" /> Academic Certificates
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            View, download, and verify your official course completion credentials issued by JVM Institute.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-[#7C248C]">
            {initialCertificates.length} {initialCertificates.length === 1 ? "Certificate" : "Certificates"} Earned
          </span>
        </div>
      </div>

      {/* Certificates Grid */}
      {initialCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialCertificates.map((cert) => {
            const batchName = cert.metadata?.batchName || "Data Engineering Batch A";
            const trainerName = cert.metadata?.trainerName || cert.course?.trainer?.name || "JVM Faculty";
            const issueDateFormatted = cert.metadata?.issueDate
              ? cert.metadata.issueDate
              : new Date(cert.issueDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

            return (
              <div
                key={cert.id}
                className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Metadata Badge */}
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#7C248C] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                      {cert.certificateNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Issued: {issueDateFormatted}</span>
                  </div>

                  {/* Course Title & Batch Information */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl leading-snug">{cert.course.title}</h3>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">Batch:</span> {batchName}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">Trainer:</span> {trainerName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Official Credential
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Eye className="w-4 h-4 text-[#7C248C]" /> View Certificate
                    </button>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-4 py-2 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm hover:scale-[1.02] cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-2xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7C248C] flex items-center justify-center mx-auto border border-purple-200 shadow-xs">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Certificates Earned Yet</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            When you complete all required lessons and content in an enrolled course, your official JVM Institute certificate will be automatically generated and available here!
          </p>
          <div className="pt-2">
            <Link
              href="/student/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-sm transition"
            >
              <BookOpen className="w-4 h-4" /> Continue Learning
            </Link>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#7C248C]" /> Official Certificate Preview
                </h2>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedCert.certificateNumber}</p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CertificateView certificate={selectedCert} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
}
