import Link from "next/link";
import { FileBox, Video, FileText, Database, Shield } from "lucide-react";

export default function AdminContentLibraryPage() {
  const contentStats = [
    { type: "Video Lectures", count: "12 Assets", icon: Video, color: "text-cyan-400" },
    { type: "PDF Curricula & Guides", count: "8 Documents", icon: FileText, color: "text-indigo-400" },
    { type: "Code Repositories", count: "4 Projects", icon: FileBox, color: "text-amber-400" },
    { type: "Database Seeds & Dumps", count: "2 Datasets", icon: Database, color: "text-emerald-400" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Global Content & Asset Library</h1>
        <p className="text-slate-400 text-sm mt-1">Manage cloud-hosted learning media, lecture videos, and curriculum assets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contentStats.map((cs) => {
          const Icon = cs.icon;
          return (
            <div key={cs.type} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <Icon className={`w-6 h-6 ${cs.color}`} />
              <div className="text-xl font-bold text-white mt-2">{cs.count}</div>
              <div className="text-xs text-slate-400">{cs.type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
