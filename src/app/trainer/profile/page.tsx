"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Code2,
  Share2,
  Building,
  GraduationCap,
  Clock,
  Award,
  BookOpen,
  Image as ImageIcon,
  Check,
  Plus,
  X,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default function TrainerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Identity & Contact Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [designation, setDesignation] = useState("Senior Technical Instructor");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [officeHours, setOfficeHours] = useState("Mon - Thu: 3:00 PM - 5:00 PM EST");
  const [experienceYears, setExperienceYears] = useState("8+ Years");
  const [qualification, setQualification] = useState("M.S. in Computer Science & Distributed Systems");
  
  // Biography & Specialization
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([
    "Next.js 15",
    "TypeScript",
    "PostgreSQL",
    "Prisma ORM",
    "Microservices",
    "Cloud Architecture",
  ]);
  const [newSkill, setNewSkill] = useState("");

  // Professional Links (Personal URL removed per instruction)
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/trainer/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          if (data.user.profile) {
            setPhone(data.user.profile.phone || "");
            setDesignation(data.user.profile.designation || "Senior Technical Instructor");
            setBio(data.user.profile.bio || "");
            setGithubUrl(data.user.profile.githubUrl || "");
            setLinkedinUrl(data.user.profile.linkedinUrl || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      setSaving(false);
      return;
    }

    try {
      const formattedBio = bio.trim();

      const res = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          designation: designation.trim(),
          bio: formattedBio,
          githubUrl: githubUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessMsg("Faculty trainer profile, academic credentials, and security updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while saving profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 max-w-4xl mx-auto glass-panel mt-12 rounded-3xl border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
        Loading faculty credentials and profile...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl w-full mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider mb-2">
          <GraduationCap className="w-3.5 h-3.5" /> Academic Faculty Record
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Faculty Trainer Profile</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your institutional identity, academic credentials, office hours, subject competencies, and account security.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Profile Card Header with Avatar Preview */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl relative overflow-hidden">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-amber-500/20 border border-amber-400/30 shrink-0">
            {name ? name.charAt(0).toUpperCase() : "T"}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{name || "Faculty Member"}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase">
                Active Instructor
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-400">{designation} • {department}</p>
            <p className="text-xs text-slate-500 font-mono flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400/70" /> {email}
            </p>
          </div>
        </div>

        {/* Academic Details & Faculty Identification */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-amber-400" /> Academic & Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Institutional Email (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Academic Designation / Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Principal Instructor & System Architect"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-amber-400" /> Department / Faculty Wing
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. School of Cloud Computing & Distributed Systems"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Highest Qualification / Degree
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. M.Tech / M.S. in Computer Science"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Teaching Experience
              </label>
              <input
                type="text"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g. 7+ Years of Industry Mentorship"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Office & Consultation Hours
              </label>
              <input
                type="text"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
                placeholder="e.g. Tue & Thu: 4:00 PM - 6:00 PM"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Faculty Biography & Research Focus
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your professional teaching background, industry experience, research publications, and course pedagogical style..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          {/* Subject Expertise & Skills Tags */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Subject Expertise & Core Technologies
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill or subject topic (e.g. GraphQL, Kubernetes)..."
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                + Add Skill
              </button>
            </div>
          </div>

          {/* Professional Developer Profiles (GitHub & LinkedIn only - Personal URL removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 font-mono flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" /> GitHub Repository Profile
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 font-mono flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-400" /> LinkedIn Professional Network
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400" /> Account Security & Password
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2 transition cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Faculty Profile
          </button>
        </div>
      </form>
    </div>
  );
}

