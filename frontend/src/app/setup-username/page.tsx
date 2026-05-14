"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthButton } from "@/components/auth/AuthComponents";
import { useAuthStore } from "@/store/useAuthStore";

export default function SetupUsernamePage() {
  const router = useRouter();
  const { user, setAuth, isAuthenticated, isLoading } = useAuthStore();
  
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rules = {
    length: username.length >= 3 && username.length <= 20,
    noSpaces: !/\s/.test(username) && username.length > 0,
    allowedChars: /^[a-zA-Z0-9_.]+$/.test(username) && username.length > 0,
  };

  const allRulesMet = rules.length && rules.noSpaces && rules.allowedChars;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!allRulesMet || !username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setIsChecking(true);
      try {
        const res = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        
        if (res.ok) {
          setIsAvailable(data.available);
          if (!data.available) {
            setError(data.reason || "Username taken");
          } else {
            setError("");
          }
        }
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, allRulesMet]);

  const suggestions = useMemo(() => {
    if (!user?.firstName) return [];
    const base = user.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return [`${base}_`, `${base}.gg`, `${base}01`].slice(0, 3);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet || isAvailable !== true) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set username");
        setIsSubmitting(false);
        return;
      }

      setAuth(data.user);
      router.push("/setup-avatar");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <ResponsiveAuthLayout
      label="ALMOST THERE"
      heading="Pick your username."
      subheading="This is how others will find you on ARCNET."
      oppositeHref="/"
      oppositeText="Skip to home &rarr;"
    >
      <form className="flex flex-col w-full" onSubmit={handleSubmit}>
        
        {suggestions.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setUsername(s)}
                className="font-chakra text-[13px] border border-[rgba(0,180,230,0.3)] bg-[rgba(0,180,230,0.07)] text-arc-accent rounded-[20px] px-4 py-[6px] hover:bg-[rgba(0,180,230,0.15)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 relative flex flex-col">
          <div className="absolute left-0 top-0 h-[48px] w-12 flex items-center justify-center pointer-events-none z-10">
            <span className="text-[rgba(255,255,255,0.38)] font-chakra text-[16px]">@</span>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            className="w-full h-[48px] bg-arc-input border border-arc-border-input focus:border-[#00b4e6] outline-none text-white font-sans text-[14px] pl-10 pr-[120px] rounded-[8px] transition-colors"
          />
          
          <div className="absolute right-4 top-0 h-[48px] flex items-center">
            {isChecking && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-[rgba(255,255,255,0.2)] border-t-[#00b4e6] rounded-full animate-spin" />
                <span className="font-sans text-[12px] text-[rgba(255,255,255,0.35)]">Checking...</span>
              </div>
            )}
            {!isChecking && isAvailable === true && (
              <div className="flex items-center gap-1 text-[#00e676]">
                <span className="text-[14px]">✓</span>
                <span className="font-sans text-[12px]">Available</span>
              </div>
            )}
            {!isChecking && isAvailable === false && (
              <div className="flex items-center gap-1 text-[#ff4d4d]">
                <span className="text-[14px]">✗</span>
                <span className="font-sans text-[12px]">Taken</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.length ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.length ? "✓" : "✗"} 3 to 20 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.noSpaces ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.noSpaces ? "✓" : "✗"} No spaces
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-sans text-[12px] ${rules.allowedChars ? "text-[#00e676]" : "text-[#ff4d4d]"}`}>
              {rules.allowedChars ? "✓" : "✗"} Only letters, numbers, _ and .
            </span>
          </div>
        </div>

        {error && (
          <p className="text-[#ff4d4d] font-sans text-[13px] mb-4 text-center">{error}</p>
        )}

        <AuthButton 
          type="submit" 
          disabled={!allRulesMet || isAvailable !== true || isSubmitting}
        >
          {isSubmitting ? "CLAIMING..." : "CLAIM USERNAME →"}
        </AuthButton>
        
        <p className="mt-6 text-center font-sans text-[12px] text-[rgba(255,255,255,0.35)]">
          You can change this later in settings.
        </p>
      </form>
    </ResponsiveAuthLayout>
  );
}
