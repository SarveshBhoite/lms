            "use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white/95 backdrop-blur-md ${
        scrolled
          ? "border-b border-[#10162F]/10 shadow-[0_6px_24px_-4px_rgba(16,22,47,0.06)] h-[74px]"
          : "border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(16,22,47,0.03)] h-[78px]"
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center p-1 rounded-xl transition-transform group-hover:scale-105">
              <img
                src="/jvm_logo-bg.png"
                alt="JVM Institute Logo"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#10162F]">
                JVM <span className="bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] bg-clip-text text-transparent">LMS</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20 shadow-[0_2px_8px_-2px_rgba(67,56,202,0.12)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D41472] animate-pulse"></span>
                OFFICIAL PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-9">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative text-sm font-medium transition-colors duration-200 py-1 ${
                  isActive
                    ? "bg-gradient-to-r from-[#4338CA] to-[#D41472] bg-clip-text text-transparent font-semibold"
                    : "text-[#10162F] hover:text-[#4338CA]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] animate-in fade-in zoom-in-75 duration-300" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-5">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#10162F] hover:text-[#4338CA] transition-colors duration-200 px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-[13px] bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] text-white font-bold text-sm shadow-[0_8px_20px_-4px_rgba(67,56,202,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(212,20,114,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-[11px] bg-gradient-to-r from-[#4338CA] to-[#D41472] text-white text-xs font-bold shadow-sm active:scale-95 transition"
          >
            Access <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-xl text-[#10162F] hover:bg-[#F8F5FF] hover:text-[#4338CA] transition focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top-3 fade-in duration-200 px-4 pb-6 pt-2">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4338CA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D41472]" /> JVM LMS Navigation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F8F5FF] text-[#4338CA] border border-[#4338CA]/20">
                OFFICIAL PORTAL
              </span>
            </div>

            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#F8F5FF] text-[#4338CA]"
                        : "text-[#10162F] hover:bg-slate-50 hover:text-[#4338CA]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#4338CA] to-[#D41472]"></span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#10162F] hover:bg-slate-50 hover:text-[#4338CA] transition"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[13px] bg-gradient-to-r from-[#4338CA] via-[#7C3AED] to-[#D41472] text-white font-bold text-sm shadow-md shadow-purple-900/20 active:scale-98 transition"
              >
                <span>Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
