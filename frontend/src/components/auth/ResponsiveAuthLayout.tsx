import React from "react";
import Link from "next/link";
import { PageTransition } from "./PageTransition";

interface ResponsiveAuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
  label: string;
  backHref?: string;
  oppositeHref: string;
  oppositeText: string;
}

export function ResponsiveAuthLayout({
  children,
  heading,
  subheading,
  label,
  backHref,
  oppositeHref,
  oppositeText,
}: ResponsiveAuthLayoutProps) {
  return (
    <PageTransition>
      <div className="auth-page-bg min-h-screen w-full flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
        {/* =========================================
            LEFT PANEL (DESKTOP ONLY - hidden <1024px)
            ========================================= */}
        <div className="hidden lg:flex w-[55%] h-screen relative border-r border-[rgba(0,180,230,0.15)] flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex">
            <h1 className="font-chakra font-bold text-[22px] tracking-[4px]">
              <span className="text-arc-accent">ARC</span>
              <span className="text-white">NET</span>
            </h1>
          </div>

          {/* Centered Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="font-chakra font-bold text-[52px] leading-tight text-white mb-4">
              The hub for <span className="text-arc-accent">game creators.</span>
            </h2>
            <p className="font-sans text-[15px] text-[rgba(255,255,255,0.4)] max-w-[420px] mb-8">
              Connect with developers, artists, animators and storytellers — all in one place.
            </p>
            <div className="flex gap-3">
              <span className="font-chakra text-[11px] border border-[rgba(0,180,230,0.25)] bg-[rgba(0,180,230,0.06)] text-arc-accent px-[12px] py-[4px] rounded-[2px] uppercase">
                Game Jams
              </span>
              <span className="font-chakra text-[11px] border border-[rgba(0,180,230,0.25)] bg-[rgba(0,180,230,0.06)] text-arc-accent px-[12px] py-[4px] rounded-[2px] uppercase">
                Find Team
              </span>
              <span className="font-chakra text-[11px] border border-[rgba(0,180,230,0.25)] bg-[rgba(0,180,230,0.06)] text-arc-accent px-[12px] py-[4px] rounded-[2px] uppercase">
                AI Match
              </span>
            </div>
          </div>

          {/* Bottom */}
          <div>
            <p className="font-sans text-[12px] text-[rgba(255,255,255,0.2)]">Trusted by creators worldwide</p>
          </div>
          
          {/* Decorative Bracket */}
          <div className="absolute bottom-12 right-12 w-32 h-32 border-b border-r border-[rgba(0,180,230,0.15)] pointer-events-none" />
        </div>

        {/* =========================================
            RIGHT PANEL (DESKTOP) / MAIN (MOBILE)
            ========================================= */}
        <div className="w-full lg:w-[45%] min-h-screen lg:h-screen flex flex-col relative lg:bg-[#0d1320] lg:overflow-y-auto">
          {/* Top cyan edge on desktop */}
          <div className="hidden lg:block absolute top-0 left-0 right-0 h-[2px] bg-arc-accent w-full" />
          
          {/* Top right switch link (desktop only) */}
          <div className="hidden lg:flex absolute top-8 right-8">
            <Link href={oppositeHref} className="font-sans text-[13px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors">
              {oppositeText.split(" →")[0]} <span className="text-arc-accent">→</span>
            </Link>
          </div>

          {/* Mobile Header (hidden on desktop) */}
          <div className="lg:hidden flex flex-col items-center pt-10 pb-6">
            <h1 className="font-chakra font-bold text-[22px] tracking-[4px]">
              <span className="text-arc-accent">ARC</span>
              <span className="text-white">NET</span>
            </h1>
          </div>

          {/* Center container */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-12 pb-12">
            {/* Form Wrapper (acts as card on mobile, transparent on desktop) */}
            <div className="relative w-full max-w-md mx-auto lg:max-w-[380px] lg:mx-auto p-8 lg:p-0 rounded-[3px] bg-[#0d1320] lg:bg-transparent border border-[rgba(0,180,230,0.22)] lg:border-none">
              
              {/* Mobile Card Ornaments (hidden on desktop) */}
              <div className="lg:hidden absolute top-0 left-0 right-0 h-[1px] bg-arc-accent w-full" />
              <div className="lg:hidden absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-arc-accent pointer-events-none" />
              <div className="lg:hidden absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-arc-accent pointer-events-none" />
              <div className="lg:hidden absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-arc-accent pointer-events-none" />
              <div className="lg:hidden absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-arc-accent pointer-events-none" />
              
              {backHref && (
                <Link 
                  href={backHref}
                  className="lg:hidden absolute top-8 left-8 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors text-xl leading-none"
                >
                  &#x2039;
                </Link>
              )}

              {/* Form Content Area */}
              <div className="flex flex-col items-center lg:items-start mb-8 text-center lg:text-left w-full">
                <span className="font-chakra text-[11px] uppercase tracking-[2.5px] text-[rgba(0,180,230,0.5)] mb-3">
                  {label}
                </span>
                <h2 className="font-chakra font-bold text-[45px] leading-[1.1] m-0 text-white mb-2 tracking-[0px]">
                  {heading}
                </h2>
                <p className="font-sans text-[14px] text-[rgba(255,255,255,0.35)]">
                  {subheading}
                </p>
              </div>

              <div className="w-full">
                {children}
              </div>

              {/* Mobile switch link (hidden on desktop) */}
              <div className="lg:hidden mt-8 text-center">
                <Link href={oppositeHref} className="font-sans text-[13px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors">
                  {oppositeText.split(" →")[0]} <span className="text-arc-accent">→</span>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
