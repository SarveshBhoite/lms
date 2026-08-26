"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Globe,
  Mail,
  Phone,
  Sparkles,
  Building2,
  Palette,
  AlertCircle,
  Eye,
} from "lucide-react";
import { INSTITUTE_CONFIG } from "@/lib/branding";

export default function AdminSettingsPage() {
  const [instituteName, setInstituteName] = useState(INSTITUTE_CONFIG.name);
  const [shortName, setShortName] = useState(INSTITUTE_CONFIG.shortName);
  const [tagline, setTagline] = useState(INSTITUTE_CONFIG.tagline);
  const [supportEmail, setSupportEmail] = useState(INSTITUTE_CONFIG.supportEmail);
  const [supportPhone, setSupportPhone] = useState(INSTITUTE_CONFIG.supportPhone);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [enableEmailVerification, setEnableEmailVerification] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setInstituteName(data.settings.instituteName || INSTITUTE_CONFIG.name);
          setShortName(data.settings.shortName || INSTITUTE_CONFIG.shortName);
          setTagline(data.settings.tagline || INSTITUTE_CONFIG.tagline);
          setSupportEmail(data.settings.supportEmail || INSTITUTE_CONFIG.supportEmail);
          setSupportPhone(data.settings.supportPhone || INSTITUTE_CONFIG.supportPhone);
          setAllowPublicRegistration(data.settings.allowPublicRegistration ?? true);
          setEnableEmailVerification(data.settings.enableEmailVerification ?? false);
          setMaintenanceMode(data.settings.maintenanceMode ?? false);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteName,
          shortName,
          tagline,
          supportEmail,
          supportPhone,
          allowPublicRegistration,
          enableEmailVerification,
          maintenanceMode,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch {
      setError("Failed to save institutional settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> Institutional Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Branding & System Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure institute identity, portal branding tokens, access policies, and support channels.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5 text-xs font-bold shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          Institutional branding & system settings saved and synchronized across all portals!
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2.5 text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Brand Identity & Portal Names */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Institute Identity & Public Branding</h2>
              <p className="text-xs text-slate-400">Customized banner names and titles displayed across smartphones, tablets, and desktops.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Full Institute Name
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400">Official name shown on Certificates, Landing Page, and Academic Transcripts.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Short Platform Brand Name
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400">Compact name in navigation bars (e.g. JVM LMS, EduPulse).</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Institute Tagline & Sub-header
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
            />
          </div>

          {/* Live Branding Preview */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Eye className="w-3.5 h-3.5 text-rose-400" /> Live Multi-Role Header Preview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30">
                <div className="text-[10px] text-indigo-400 font-bold uppercase font-mono">Student View</div>
                <div className="text-xs font-bold text-white mt-1">{shortName}</div>
                <div className="text-[10px] text-emerald-400">Student Portal</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                <div className="text-[10px] text-amber-400 font-bold uppercase font-mono">Faculty View</div>
                <div className="text-xs font-bold text-white mt-1">{shortName}</div>
                <div className="text-[10px] text-amber-400">Faculty Studio</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
                <div className="text-[10px] text-rose-400 font-bold uppercase font-mono">Admin View</div>
                <div className="text-xs font-bold text-white mt-1">{shortName}</div>
                <div className="text-[10px] text-rose-400">Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Contact Coordinates */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Institutional Support Coordinates</h2>
              <p className="text-xs text-slate-400">Help desk and administrative channels for enrolled learners and instructors.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Support Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Support Phone / Helpdesk
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Enrollment & Governance Gates</h2>
              <p className="text-xs text-slate-400">Control registration flow and maintenance status.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Public Student Self-Registration</div>
                <div className="text-[11px] text-slate-400">Allow prospective students to sign up publicly via /register</div>
              </div>
              <input
                type="checkbox"
                checked={allowPublicRegistration}
                onChange={(e) => setAllowPublicRegistration(e.target.checked)}
                className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Mandatory Email Verification</div>
                <div className="text-[11px] text-slate-400">Require token verification before granting course access</div>
              </div>
              <input
                type="checkbox"
                checked={enableEmailVerification}
                onChange={(e) => setEnableEmailVerification(e.target.checked)}
                className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-rose-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Institutional Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

