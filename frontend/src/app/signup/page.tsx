"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthInput, PasswordInput, AuthButton, GoogleButton, Divider } from "@/components/auth/AuthComponents";
import { signInWithGoogle } from "@/app/actions";

export default function SignupPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Live password validation rules
  const rules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    // Clear field-specific error when they type
    if (errors[e.target.id]) {
      setErrors(prev => ({ ...prev, [e.target.id]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!rules.length || !rules.uppercase || !rules.number || !rules.special) {
      newErrors.password = "Password does not meet all requirements";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Registration failed");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveAuthLayout
      label="NEW HERE?"
      heading="Sign up."
      subheading="Join the network. Find your hub."
      oppositeHref="/login"
      oppositeText="Already have an account? Log in &rarr;"
      backHref="/login"
    >
      <form className="flex flex-col w-full" onSubmit={handleSubmit}>
        <GoogleButton type="button" onClick={() => signInWithGoogle()}>Continue with Google</GoogleButton>
        
        <Divider text="or" />
        
        <div className="flex gap-4 mb-0">
          <div className="flex-1 mb-4">
            <AuthInput 
              id="firstName" 
              type="text" 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
            />
            {errors.firstName && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{errors.firstName}</p>}
          </div>
          <div className="flex-1 mb-4">
            <AuthInput 
              id="lastName" 
              type="text" 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
            />
            {errors.lastName && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{errors.lastName}</p>}
          </div>
        </div>
        
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

        <div className="mb-4">
          <PasswordInput 
            id="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "border-[#ff4d4d] focus:border-[#ff4d4d]" : "mb-0"}
          />
          {errors.password && <p className="text-[#ff4d4d] font-sans text-[12px] mt-1">{errors.password}</p>}
          
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

        {serverError && (
          <p className="text-[#ff4d4d] font-sans text-[13px] mb-4 text-center">{serverError}</p>
        )}

        <div className="mt-2">
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "JOINING..." : "JOIN THE NETWORK →"}
          </AuthButton>
        </div>

        <div className="mt-6 text-center">
          <p className="font-sans text-[11px] text-[rgba(255,255,255,0.35)]">
            By joining you agree to Caliber&apos;s Terms of Service and Privacy Policy
          </p>
        </div>
      </form>
    </ResponsiveAuthLayout>
  );
}
