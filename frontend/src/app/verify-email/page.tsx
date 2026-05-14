"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthButton } from "@/components/auth/AuthComponents";
import { OTPInput } from "@/components/auth/OTPInput";
import { useAuthStore } from "@/store/useAuthStore";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const setAuth = useAuthStore(state => state.setAuth);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/signup");
    }
  }, [email, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e?: React.FormEvent, submitCode?: string) => {
    if (e) e.preventDefault();
    setError("");

    const finalCode = submitCode || code;

    if (finalCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      setAuth(data.user);
      router.push("/setup-username");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setCooldown(60);
    
    try {
      await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("Failed to resend code. Please try again later.");
    }
  };

  return (
    <form className="flex flex-col w-full items-center lg:items-start" onSubmit={handleSubmit}>
      <div className="mb-8 w-full max-w-[340px] mx-auto lg:mx-0">
        <OTPInput 
          length={6} 
          value={code} 
          onChange={setCode} 
          onComplete={(val) => handleSubmit(undefined, val)}
        />
      </div>

      {error && (
        <p className="text-[#ff4d4d] font-sans text-[13px] mb-4 text-center lg:text-left w-full">{error}</p>
      )}

      <div className="w-full">
        <AuthButton type="submit" disabled={isLoading || code.length !== 6}>
          {isLoading ? "VERIFYING..." : "VERIFY EMAIL →"}
        </AuthButton>
      </div>

      <div className="mt-6 flex flex-col items-center lg:items-start gap-2">
        {cooldown > 0 ? (
          <p className="font-sans text-[12px] text-[rgba(255,255,255,0.35)]">
            Resend code in {cooldown}s
          </p>
        ) : (
          <button 
            type="button"
            onClick={handleResend}
            className="font-sans text-[13px] text-arc-accent hover:underline"
          >
            Didn&apos;t get the code? Resend &rarr;
          </button>
        )}
        
        <Link href="/signup" className="font-sans text-[13px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors mt-2">
          Wrong email? Go back &rarr;
        </Link>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <ResponsiveAuthLayout
      label="ONE MORE STEP"
      heading="Verify your email."
      subheading="We sent a 6-digit code to your email. Enter it below."
      oppositeHref="/login"
      oppositeText="Already verified? Log in &rarr;"
      backHref="/signup"
    >
      <Suspense fallback={<p className="text-white">Loading...</p>}>
        <VerifyEmailForm />
      </Suspense>
    </ResponsiveAuthLayout>
  );
}
