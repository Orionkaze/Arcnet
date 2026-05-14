import React from "react";
import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  backHref?: string;
}

export function AuthCard({ children, backHref }: AuthCardProps) {
  return (
    <div className="relative w-full max-w-md mx-auto p-8 rounded-[3px] bg-arc-card border border-arc-border-card">
      {/* Top cyan edge line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-arc-accent w-full" />

      {/* Corner Bracket Accents */}
      <div className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-arc-accent pointer-events-none" />
      <div className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-arc-accent pointer-events-none" />
      <div className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-arc-accent pointer-events-none" />
      <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-arc-accent pointer-events-none" />

      {/* Back Arrow */}
      {backHref && (
        <Link 
          href={backHref}
          className="absolute top-8 left-8 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors text-xl leading-none"
        >
          &#x2039;
        </Link>
      )}

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <h1 className="font-chakra font-bold text-[22px] tracking-[4px]">
          <span className="text-arc-accent">ARC</span>
          <span className="text-white">NET</span>
        </h1>
      </div>

      {children}
    </div>
  );
}
