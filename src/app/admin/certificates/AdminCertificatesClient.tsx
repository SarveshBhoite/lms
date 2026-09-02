"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  Filter,
  Eye,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Users,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import CertificateView, { CertificateData } from "@/components/certificates/CertificateView";

interface AdminCertificatesClientProps {
  initialCertificates: CertificateData[];
  courses: { id: string; title: string }[];
  batches: { id: string; name: string; courseId: string }[];
}

export default function AdminCertificatesClient({
  initialCertificates,
  courses,
  batches,
}: AdminCertificatesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCert, setSelectedCert] = useState<CertificateData | null>(null);

  // Filter certificates dynamically
  const filteredCertificates = useMemo(() => {
    return initialCertificates.filter((cert) => {
      const studentName = cert.metadata?.studentName || cert.user?.name || "";
      const studentEmail = cert.metadata?.studentEmail || cert.user?.email || "";
      const courseTitle = cert.metadata?.courseTitle || cert.course?.title || "";
      const batchName = cert.metadata?.batchName || "";
      const certId = cert.certificateNumber || "";

      // Search match
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          studentName.toLowerCase().includes(term) ||
          studentEmail.toLowerCase().includes(term) ||
          courseTitle.toLowerCase().includes(term) ||
          batchName.toLowerCase().includes(term) ||
          certId.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Course filter
      if (selectedCourse && cert.course.id !== selectedCourse) {
        return false;
      }

      // Batch filter
      if (selectedBatch && !batchName.toLowerCase().includes(selectedBatch.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const certDate = new Date(cert.issueDate);
        if (certDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const certDate = new Date(cert.issueDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (certDate > end) return false;
      }

      return true;
    });
  }, [initialCertificates, searchTerm, selectedCourse, selectedBatch, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("");
    setSelectedBatch("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#7C248C]" /> Certificate Registry & Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit generated certificates, view completion metadata, and issue official credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#7C248C]" />
            <span className="text-xs font-bold text-[#7C248C]">
              {initialCertificates.length} Total Issued
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#7C248C] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Certificates</p>
            <p className="text-xl font-black text-slate-900">{initialCertificates.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Verified Credentials</p>
            <p className="text-xl font-black text-slate-900">{initialCertificates.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Courses</p>
            <p className="text-xl font-black text-slate-900">{courses.length}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#7C248C]" /> Search & Filter Certificates
          </h3>
          {(searchTerm || selectedCourse || selectedBatch || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Student, Course, Batch, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7C248C]"
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7C248C]"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7C248C]"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start Filter */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7C248C]"
            />
          </div>
        </div>
      </div>

      {/* Certificates Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Student Recipient</th>
                <th className="p-4">Course</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Trainer</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => {
                  const studentName = cert.metadata?.studentName || cert.user?.name || "N/A";
                  const studentEmail = cert.metadata?.studentEmail || cert.user?.email || "";
                  const batchName = cert.metadata?.batchName || "Data Engineering Batch A";
                  const trainerName = cert.metadata?.trainerName || cert.course?.trainer?.name || "JVM Faculty";
                  const issueDateFormatted = cert.metadata?.issueDate
                    ? cert.metadata.issueDate
                    : new Date(cert.issueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                  return (
                    <tr key={cert.id} className="hover:bg-purple-50/30 transition">
                      <td className="p-4 font-mono font-bold text-[#7C248C]">
                        {cert.certificateNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{studentName}</div>
                        <div className="text-[11px] text-slate-500">{studentEmail}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-900 max-w-xs truncate">
                        {cert.course.title}
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {batchName}
                      </td>
                      <td className="p-4 text-slate-700">
                        {trainerName}
                      </td>
                      <td className="p-4 text-slate-600">
                        {issueDateFormatted}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 text-[#7C248C] hover:bg-purple-100 font-bold border border-purple-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Certificate Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 space-y-2">
                    <Award className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-medium text-sm">No certificates found matching your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Details Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#7C248C]" /> Certificate Details & Admin Preview
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

            {/* Recipient Snapshot Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Student Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCert.metadata?.studentName || selectedCert.user?.name}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Course Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCert.metadata?.courseTitle || selectedCert.course?.title}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Batch Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCert.metadata?.batchName || "Data Engineering Batch A"}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Trainer</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCert.metadata?.trainerName || selectedCert.course?.trainer?.name || "JVM Faculty"}</p>
              </div>
            </div>

            <CertificateView certificate={selectedCert} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
}
