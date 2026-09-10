"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Camera,
  UploadCloud,
  ShieldCheck,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

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
  coursesCreated: {
    id: string;
    title: string;
    level: string;
    status: string;
    enrollmentCount: number;
    batchCount: number;
  }[];
  trainerBatches: {
    id: string;
    name: string;
    status: string;
    courseTitle: string;
    studentCount: number;
  }[];
  stats: {
    totalCourses: number;
    totalBatches: number;
    totalLearners: number;
  };
}

export default function TrainerProfileFormClient({ initialUser }: { initialUser: UserProfileData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfileData>(initialUser);

  // Form states
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.profile?.phone || "");
  const [designation, setDesignation] = useState(initialUser.profile?.designation || "");
  const [bio, setBio] = useState(initialUser.profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(initialUser.profile?.avatarUrl || "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading & feedback states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Direct Cloudinary Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image file size exceeds 5MB limit.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload image to Cloudinary");
      }

      setAvatarUrl(data.url);
      showToast("success", "Profile picture uploaded! Click Save Profile & Security Changes to apply.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to upload profile photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast("error", "New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast("error", "New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        showToast("error", "Please provide your current password to authorize this security change.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        designation: designation.trim(),
        avatarUrl: avatarUrl.trim(),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      showToast(
        "success",
        newPassword
          ? "Faculty profile and security credentials updated successfully!"
          : "Faculty profile details saved successfully!"
      );

      setUser((prev) => ({
        ...prev,
        ...data.data,
      }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Input for Cloudinary Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card Header with Cloudinary Avatar Upload */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="h-2 w-full jvm-gradient-bg absolute top-0 left-0" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-purple-200/80 shadow-md bg-slate-50 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full jvm-gradient-bg flex items-center justify-center text-white text-3xl font-black">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-mono gap-1">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>

              {/* Camera Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-slate-900 text-white hover:bg-[#E01E6A] shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Upload Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Summary */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{name || "Faculty Trainer"}</h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C248C] border border-purple-200/60">
                  {user.role}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {user.isActive ? "Active Faculty" : "Inactive"}
                </span>
                {designation && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {designation}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}
                  </span>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C248C] text-xs font-bold transition cursor-pointer border border-purple-200/60"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload New Avatar</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer"
                  >
                    Reset Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Academic Scope & Teaching Assignments */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Academic Scope & Teaching Assignments</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Courses authored and student cohorts supervised under your faculty profile.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-[#7C248C] font-bold border border-purple-200/60">
                {user.stats.totalCourses} Courses
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-pink-50 text-[#E01E6A] font-bold border border-pink-200/60">
                {user.stats.totalBatches} Cohorts
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                {user.stats.totalLearners} Active Learners
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Courses Created List */}
            {user.coursesCreated.length > 0 ? (
              user.coursesCreated.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-purple-300 transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{course.title}</div>
                    <div className="text-[11px] font-mono text-purple-700 mt-0.5 flex items-center gap-2">
                      <span>Level: <strong>{course.level}</strong></span>
                      <span>•</span>
                      <span>{course.batchCount} {course.batchCount === 1 ? "Batch" : "Batches"}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {course.status}
                  </span>
                </div>
              ))
            ) : null}

            {/* Assigned Cohorts List */}
            {user.trainerBatches.length > 0 ? (
              user.trainerBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-pink-300 transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{batch.name}</div>
                    <div className="text-[11px] font-mono text-[#E01E6A] mt-0.5 flex items-center gap-2">
                      <span className="truncate">{batch.courseTitle}</span>
                      <span>•</span>
                      <span>{batch.studentCount} Students</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {batch.status}
                  </span>
                </div>
              ))
            ) : null}

            {user.coursesCreated.length === 0 && user.trainerBatches.length === 0 && (
              <div className="sm:col-span-2 p-4 text-center text-slate-400 italic text-xs">
                No active courses or cohorts assigned yet. Contact institute administration.
              </div>
            )}
          </div>
        </div>

        {/* Personal & Faculty Information */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-[#E01E6A]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Faculty Details & Bio</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Update your display name, contact phone, designation, and teaching philosophy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Academic Designation / Title</label>
              <input
                type="text"
                placeholder="e.g. Lead Full-Stack Instructor & System Architect"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Official Email (Institutional Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">
                Biography & Teaching Philosophy
              </label>
              <textarea
                rows={3}
                placeholder="Share your industry experience, teaching background, and pedagogy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Security & Password Authentication */}
        <div className="glass-card rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C248C]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Security & Password Authentication</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Leave fields empty if you do not wish to change your current password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Current Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#E01E6A] focus:bg-white focus:ring-4 focus:ring-pink-500/10 transition shadow-2xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Faculty account secured with bcrypt & SSL protection.</span>
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingAvatar}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile & Security Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
