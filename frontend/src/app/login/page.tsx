"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthInput, PasswordInput, AuthButton, GoogleButton, Divider } from "@/components/auth/AuthComponents";
import { useAuthStore } from "@/store/useAuthStore";
import { signInWithGoogle } from "@/app/actions";

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    if (errors[e.target.id]) {
      setErrors(prev => ({ ...prev, [e.target.id]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Login failed");
        return;
      }

      // Cookies are set server-side, fetch user profile then redirect
      await checkAuth();
      router.push("/");
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveAuthLayout
      label="WELCOME BACK"
      heading="Log in."
      subheading="Today is a new day. It's your day."
      oppositeHref="/signup"
      oppositeText="Don't have an account? Sign up &rarr;"
    >
      <form className="flex flex-col w-full" onSubmit={handleSubmit}>
        <GoogleButton type="button" onClick={() => signInWithGoogle()}>Continue with Google</GoogleButton>
        
        <Divider text="or" />
        
        <div className="mb-4">
          <AuthInput 
            id="email" 
            type="email" 
            placeholder="Email address" 
            icon="email" 
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
          />
          {errors.email && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{errors.email}</p>}
        </div>
        
        <div className="flex flex-col mb-1 relative">
          <PasswordInput 
            id="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
          />
          {errors.password && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{errors.password}</p>}
          
          <div className="flex justify-end mt-1 mb-4 absolute right-0 -bottom-8">
            <Link 
              href="/forgot-password" 
              className="font-chakra text-arc-accent text-[11px] hover:text-[#1ac8ff] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {serverError && (
          <div className="mt-6 mb-2">
            <p className="text-[#ff4d4d] font-sans text-[13px] text-center">
              {serverError}
            </p>
            {serverError === "Account not verified. Check your email." && (
              <p className="text-center mt-2">
                <Link href={`/verify-email?email=${encodeURIComponent(formData.email)}`} className="text-arc-accent text-[13px] hover:underline">
                  Resend verification code &rarr;
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "LOGGING IN..." : "LOG IN →"}
          </AuthButton>
        </div>
      </form>
    </ResponsiveAuthLayout>
  );
}
