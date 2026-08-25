"use client";

import { useState } from "react";
import { Settings, Save, CheckCircle2, Shield, Globe, Mail } from "lucide-react";

export default function AdminSettingsPage() {
  const [instituteName, setInstituteName] = useState("EduPulse Institute of Technology");
  const [supportEmail, setSupportEmail] = useState("support@institute.edu");
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Institutional Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure global platform branding, email defaults, and enrollment gates.</p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" /> System settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Institute Name</label>
          <input
            type="text"
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Support Email Address</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-white">Public Student Self-Registration</div>
            <div className="text-[11px] text-slate-400">Allow new students to register through the public registration portal</div>
          </div>
          <input
            type="checkbox"
            checked={allowPublicRegistration}
            onChange={(e) => setAllowPublicRegistration(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" /> Save System Settings
        </button>
      </form>
    </div>
  );
}
