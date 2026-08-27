import Link from "next/link";
import { FileBox, Video, FileText, Database, Shield } from "lucide-react";

export default function AdminContentLibraryPage() {
  const contentStats = [
    { type: "Video Lectures", count: "12 Assets", icon: Video, color: "text-[#1E2B88]", bg: "bg-blue-50" },
    { type: "PDF Curricula & Guides", count: "8 Documents", icon: FileText, color: "text-[#7C248C]", bg: "bg-purple-50" },
    { type: "Code Repositories", count: "4 Projects", icon: FileBox, color: "text-amber-600", bg: "bg-amber-50" },
    { type: "Database Seeds & Dumps", count: "2 Datasets", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Global Content & Asset Library</h1>
        <p className="text-slate-500 text-sm mt-1">Manage cloud-hosted learning media, lecture videos, and curriculum assets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contentStats.map((cs) => {
          const Icon = cs.icon;
          return (
            <div key={cs.type} className="glass-card p-5 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className={`w-10 h-10 rounded-2xl ${cs.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${cs.color}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{cs.count}</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">{cs.type}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
