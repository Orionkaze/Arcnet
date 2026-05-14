"use client";

import { useState } from "react";
import Link from "next/link";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthInput, AuthButton } from "@/components/auth/AuthComponents";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setCooldown(60);
      
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <ResponsiveAuthLayout
        label="LOCKED OUT?"
        heading="Check your inbox."
        subheading={`We sent a reset link to ${email}. It expires in 15 minutes.`}
        oppositeHref="/login"
        oppositeText="Remembered it? Log in &rarr;"
      >
        <div className="flex flex-col items-center lg:items-start w-full">
          <div className="w-16 h-16 rounded-full bg-[rgba(0,230,118,0.1)] flex items-center justify-center text-[#00e676] mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={cooldown > 0}
            className={`font-sans text-[13px] ${cooldown > 0 ? "text-[rgba(255,255,255,0.35)]" : "text-arc-accent hover:underline"}`}
          >
            {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
          </button>
        </div>
      </ResponsiveAuthLayout>
    );
  }

  return (
    <ResponsiveAuthLayout
      label="LOCKED OUT?"
      heading="Reset password."
      subheading="Enter your email and we'll send you a reset link."
      oppositeHref="/login"
      oppositeText="Remembered it? Log in &rarr;"
    >
      <form className="flex flex-col w-full" onSubmit={handleSubmit}>
        <div className="mb-6">
          <AuthInput 
            id="email" 
            type="email" 
            placeholder="Email address" 
            icon="email" 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={error ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
          />
          {error && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{error}</p>}
        </div>

        <AuthButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "SENDING..." : "SEND RESET LINK →"}
        </AuthButton>
      </form>
    </ResponsiveAuthLayout>
  );
}
