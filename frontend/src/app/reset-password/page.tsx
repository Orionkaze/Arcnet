"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { PasswordInput, AuthButton } from "@/components/auth/AuthComponents";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Live password validation rules
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const allRulesMet = rules.length && rules.uppercase && rules.number && rules.special;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!allRulesMet || !passwordsMatch) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center lg:items-start w-full">
        <div className="w-16 h-16 rounded-full bg-[rgba(0,230,118,0.1)] flex items-center justify-center text-[#00e676] mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <p className="font-sans text-[15px] text-white">Password updated!</p>
        <p className="font-sans text-[13px] text-[rgba(255,255,255,0.35)] mt-2">Redirecting to login...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center lg:items-start w-full">
        <p className="text-[#ff4d4d] font-sans text-[14px] mb-4">This link is invalid or has expired.</p>
        <Link href="/forgot-password" className="font-sans text-[13px] text-arc-accent hover:underline">
          Request new link &rarr;
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col w-full" onSubmit={handleSubmit}>
      
      <div className="mb-4">
        <PasswordInput 
          id="password" 
          placeholder="New Password" 
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
        />
        
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.length ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.length ? "✓" : "✗"} Minimum 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.uppercase ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.uppercase ? "✓" : "✗"} At least 1 uppercase letter
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.number ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.number ? "✓" : "✗"} At least 1 number
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.special ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.special ? "✓" : "✗"} At least 1 special character
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <PasswordInput 
          id="confirmPassword" 
          placeholder="Confirm Password" 
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
        />
        {confirmPassword.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`font-sans text-[12px] ${passwordsMatch ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[#ff4d4d] font-sans text-[13px] mb-4 text-center">{error}</p>
      )}

      <AuthButton type="submit" disabled={isSubmitting || !allRulesMet || !passwordsMatch}>
        {isSubmitting ? "UPDATING..." : "RESET PASSWORD →"}
      </AuthButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <ResponsiveAuthLayout
      label="NEW PASSWORD"
      heading="Set new password."
      subheading="Make it strong. Make it yours."
      oppositeHref="/login"
      oppositeText="Remembered it? Log in &rarr;"
    >
      <Suspense fallback={<p className="text-white">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </ResponsiveAuthLayout>
  );
}
