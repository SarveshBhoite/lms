"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ArrowRight,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileCheck,
  Video,
  Award,
  HelpCircle,
  Clock,
  Inbox,
  ShieldCheck,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

// Hydration-safe date and time formatters
function formatDateSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTimeSafe(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

export default function StudentNotificationsClient({
  initialNotifications,
  currentUserId,
}: {
  initialNotifications: NotificationItem[];
  currentUserId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "LIVE_CLASS":
      case "LIVE_SESSION":
        return <Video className="w-5 h-5 text-indigo-600" />;
      case "ASSIGNMENT":
      case "ASSIGNMENT_GRADED":
        return <FileCheck className="w-5 h-5 text-[#E01E6A]" />;
      case "QUIZ":
      case "QUIZ_RESULT":
        return <HelpCircle className="w-5 h-5 text-purple-600" />;
      case "CERTIFICATE_ISSUED":
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-[#7C248C]" />;
    }
  };

  const filtered = initialNotifications.filter((n) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = n.title.toLowerCase().includes(q);
    const msgMatch = n.message.toLowerCase().includes(q);
    const matchesSearch = titleMatch || msgMatch;

    const matchesType = typeFilter === "ALL" || n.type.toUpperCase().includes(typeFilter);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-purple-200/50 via-slate-100 to-pink-200/50 shadow-sm">
        <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/80">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A] transition group-focus-within:bg-[#E01E6A] group-focus-within:text-white group-focus-within:scale-105 shadow-2xs">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by keywords..."
              className="w-full pl-13 pr-10 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center justify-center transition cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {[
                { id: "ALL", label: "All Alerts" },
                { id: "LIVE", label: "Live Classes" },
                { id: "ASSIGNMENT", label: "Assignments" },
                { id: "QUIZ", label: "Quizzes" },
                { id: "CERTIFICATE", label: "Certificates" },
              ].map((st) => {
                const isSelected = typeFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTypeFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "jvm-gradient-bg text-white shadow-sm shadow-purple-900/20 scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#7C248C] font-mono text-[11px] font-bold shrink-0">
              {filtered.length} {filtered.length === 1 ? "Item" : "Items"}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Stream Feed */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:border-pink-300 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/50 border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-[#E01E6A] transition">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateSafe(n.createdAt)} &bull; {formatTimeSafe(n.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button if actionable URL is present */}
              {n.actionUrl ? (
                <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                  <Link
                    href={n.actionUrl}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Open Resource</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="shrink-0 hidden sm:flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Logged</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 bg-white text-center text-slate-400 space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold">No notifications found.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You are all caught up! Updates regarding live classes, assignments, and exams will appear right here.
          </p>
        </div>
      )}

      {/* Auto-read Guarantee Footer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/50 via-slate-50 to-pink-50/30 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Notifications are automatically synchronized and marked as read when visiting this page.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400 shrink-0">Auto-Read Active</span>
      </div>
    </div>
  );
}

