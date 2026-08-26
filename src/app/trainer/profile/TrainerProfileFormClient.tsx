"use client";

import { useState } from "react";
import { User, Lock, ShieldAlert, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  profile?: {
    phone?: string | null;
    designation?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  } | null;
  coursesCreated: { id: string; title: string }[];
  trainerBatches: { batch: { name: string } }[];
}

export default function TrainerProfileFormClient({ initialUser }: { initialUser: UserProfileData }) {
  const [user, setUser] = useState(initialUser);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: initialUser.name,
    phone: initialUser.profile?.phone || "",
    designation: initialUser.profile?.designation || "",
    bio: initialUser.profile?.bio || "",
    avatarUrl: initialUser.profile?.avatarUrl || "",
    currentPassword: "",
    newPassword: "",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update profile");

      showToast("success", "Faculty profile updated successfully!");
      setUser(data.data);
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (err: any) {
      showToast("error", err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl w-full mx-auto">
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Faculty Profile Settings</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage your personal profile information, academic credentials, and security password.
        </p>
      </div>

      {/* Admin Controlled Security Info Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block text-[10px]">ACCOUNT ROLE</span>
          <strong className="text-amber-700 text-sm">{user.role}</strong>
          <span className="text-[10px] text-slate-400 block">Admin Controlled</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block text-[10px]">ACCOUNT STATUS</span>
          <strong className="text-emerald-700 text-sm">{user.isActive ? "ACTIVE" : "INACTIVE"}</strong>
          <span className="text-[10px] text-slate-400 block">Admin Controlled</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 block text-[10px]">ASSIGNED SCOPE</span>
          <strong className="text-cyan-700 text-sm">
            {user.coursesCreated.length} Courses / {user.trainerBatches.length} Cohorts
          </strong>
          <span className="text-[10px] text-slate-400 block">Admin Managed</span>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Academic Designation</label>
              <input
                type="text"
                placeholder="e.g. Senior Professor of Computer Science"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Profile Avatar URL</label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Biography & Specialization</label>
            <textarea
              rows={3}
              placeholder="Brief summary of academic background and industry experience..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Change Security Password
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Update Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
