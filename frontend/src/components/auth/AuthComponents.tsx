import React, { useState } from "react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: "email" | "lock" | "none";
}

export function AuthInput({ id, icon = "none", className = "", ...props }: AuthInputProps) {
  return (
    <div className="flex flex-col mb-4 relative">
      {icon === "email" && (
        <div className="absolute left-0 top-0 h-[48px] w-12 flex items-center justify-center pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.38)]">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
      )}
      <input
        id={id}
        className={`w-full h-[48px] bg-arc-input border border-arc-border-input focus:border-arc-border-input-focus outline-none text-arc-primary font-sans font-normal text-[13px] md:text-[14px] ${icon !== "none" ? "pl-12" : "px-4"} rounded-[8px] transition-colors duration-200 placeholder-[rgba(255,255,255,0.38)] ${className}`}
        {...props}
      />
    </div>
  );
}

export function PasswordInput({ id, className = "", ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col mb-4 relative">
      <div className="absolute left-0 top-0 h-[48px] w-12 flex items-center justify-center pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.38)]">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        className={`w-full h-[48px] bg-arc-input border border-arc-border-input focus:border-arc-border-input-focus outline-none text-arc-primary font-sans font-normal text-[13px] md:text-[14px] pl-12 pr-12 rounded-[8px] transition-colors duration-200 placeholder-[rgba(255,255,255,0.38)] ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-0 top-0 h-[48px] w-12 flex items-center justify-center transition-colors duration-200"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={showPassword ? "text-arc-accent" : "text-[rgba(255,255,255,0.38)]"}
        >
          {showPassword ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

export function AuthButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full bg-arc-accent text-white font-chakra font-bold uppercase tracking-[2.5px] text-[13px] h-[48px] rounded-[8px] shadow-[0_0_24px_rgba(0,180,230,0.4)] hover:bg-[#1ac8ff] hover:shadow-[0_0_32px_rgba(0,180,230,0.6)] transition-all duration-200 mt-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GoogleButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full bg-arc-google-bg border border-[rgba(255,255,255,0.12)] text-white font-sans font-medium text-[13px] md:text-[14px] h-[48px] rounded-[8px] hover:bg-[#12192b] transition-colors duration-200 flex items-center justify-center gap-3 ${className}`}
      {...props}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {children}
    </button>
  );
}

export function Divider({ text = "or" }: { text?: string }) {
  return (
    <div className="flex items-center my-6">
      <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.1)]" />
      <span className="px-4 text-[rgba(255,255,255,0.38)] font-sans text-[11px] uppercase tracking-[1px]">{text}</span>
      <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.1)]" />
    </div>
  );
}
