"use client";

import { useState, useEffect } from "react";
import { User, Lock, ShieldAlert, Loader2, CheckCircle2, AlertTriangle, Video, Calendar, LogOut } from "lucide-react";

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

  // Google OAuth Status
  const [googleStatus, setGoogleStatus] = useState<{ isConnected: boolean; email?: string | null }>({ isConnected: false });
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

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

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch("/api/google/status");
      const data = await res.json();
      if (data.success && data.data) {
        setGoogleStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch Google status:", err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();

    // Check if redirected with google connection query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google") === "connected") {
      showToast("success", "Google Account connected successfully! You can now auto-generate Google Meet links.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("google_error")) {
      showToast("error", `Google OAuth failed: ${urlParams.get("google_error")}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDisconnectGoogle = async () => {
    setDisconnectingGoogle(true);
    try {
      const res = await fetch("/api/google/disconnect", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to disconnect Google account");

      showToast("success", "Google Account disconnected successfully.");
      setGoogleStatus({ isConnected: false, email: null });
    } catch (err: any) {
      showToast("error", err.message || "Failed to disconnect Google account");
    } finally {
      setDisconnectingGoogle(false);
    }
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
          Manage your personal profile information, Google Meet integration, and security password.
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

      {/* Google Calendar & Meet Integration Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Google Meet & Calendar Integration</h2>
              <p className="text-xs text-slate-500">
                Connect your Google Account to automatically generate Google Meet conference links and sync live classes to your Google Calendar.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {loadingGoogle ? (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Checking Google Account connection...
            </div>
          ) : googleStatus.isConnected ? (
            <>
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
                <p className="text-xs text-slate-700 font-mono mt-1">
                  Google Email: <strong>{googleStatus.email}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleDisconnectGoogle}
                disabled={disconnectingGoogle}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-2 transition"
              >
                {disconnectingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} Disconnect Google Account
              </button>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-200/60 px-2.5 py-0.5 rounded-full border border-slate-300">
                  Not Connected
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  You can still schedule live classes manually or connect Google to auto-generate unique Meet URLs.
                </p>
              </div>

              <a
                href="/api/google/connect"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <Video className="w-4 h-4" /> Connect Google Account
              </a>
            </>
          )}
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
              className="px-6 py-3 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Update Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
