import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center selection:bg-indigo-500 selection:text-white">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        403 - Access Forbidden
      </h1>

      <p className="mt-3 text-slate-400 max-w-md">
        You do not possess the required academic permissions or role to view this portal.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" /> Sign In with Different Account
        </Link>
      </div>
    </div>
  );
}
