import Link from "next/link";
import prisma from "@/lib/prisma";
import { Activity, ShieldCheck, UserCheck, Clock } from "lucide-react";

export default async function AdminActivityLogsPage() {
  const logs = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">System Security & Audit Trail</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time log of security events, administrative changes, and user authentications.</p>
      </div>

      <div className="glass-card rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px] font-bold">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Triggered By</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-[#7C248C]">{log.action}</td>
                    <td className="p-4 text-slate-800 font-mono">{log.resource}</td>
                    <td className="p-4 font-semibold text-slate-900">{log.user?.email || "System"}</td>
                    <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    System operations logged and active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
