"use client";

import { useState } from "react";
import { Settings, Save, CheckCircle2, Shield, Globe, Mail } from "lucide-react";

export default function AdminSettingsPage() {
  const [instituteName, setInstituteName] = useState("JVM Institute");
  const [supportEmail, setSupportEmail] = useState("support@jvminstitute.com");
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Institutional Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure global platform branding, email defaults, and enrollment gates.</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> System settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">Institute Name</label>
          <input
            type="text"
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">Support Email Address</label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900">Public Student Self-Registration</div>
            <div className="text-[11px] text-slate-500">Allow new students to register through the public registration portal</div>
          </div>
          <input
            type="checkbox"
            checked={allowPublicRegistration}
            onChange={(e) => setAllowPublicRegistration(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-white border-slate-300"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl jvm-gradient-bg jvm-gradient-hover text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-900/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save System Settings
        </button>
      </form>
    </div>
  );
}
