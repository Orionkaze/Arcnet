"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveAuthLayout } from "@/components/auth/ResponsiveAuthLayout";
import { AuthButton } from "@/components/auth/AuthComponents";
import { useAuthStore } from "@/store/useAuthStore";

export default function SetupAvatarPage() {
  const router = useRouter();
  const { user, setAuth, isAuthenticated, isLoading } = useAuthStore();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"options" | "presets" | "camera" | "preview">("options");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const presetAvatars = Array.from({ length: 12 }).map((_, i) => 
    `https://api.dicebear.com/7.x/bottts/svg?seed=arcnet${i + 1}`
  );

  const startCamera = async () => {
    setActiveTab("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera access denied or unavailable.");
      setActiveTab("options");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg");
      setSelectedAvatar(dataUrl);
      stopCamera();
      setActiveTab("preview");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Max 5MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, WEBP allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAvatar(event.target?.result as string);
      setActiveTab("preview");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (avatarUrlToSubmit?: string) => {
    const finalAvatar = avatarUrlToSubmit || selectedAvatar || presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
    
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: finalAvatar }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set avatar");
        setIsSubmitting(false);
        return;
      }

      setAuth(data.user);
      router.push("/");
    } catch {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <ResponsiveAuthLayout
      label="LAST STEP"
      heading="Choose your avatar."
      subheading="Put a face to your name on Caliber."
      oppositeHref="/"
      oppositeText="Skip to home &rarr;"
    >
      <div className="flex flex-col w-full">
        
        {activeTab === "options" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setActiveTab("presets")}
              className="flex flex-col items-center justify-center p-6 bg-[var(--c-surface)] border border-[rgba(16, 185, 129,0.18)] rounded-[10px] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(16, 185, 129,0.1)] flex items-center justify-center text-[#10B981] mb-3 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
              </div>
              <span className="font-chakra text-[13px] text-white">Pick an Avatar</span>
              <span className="font-sans text-[11px] text-[rgba(255,255,255,0.35)] mt-1">Cute characters</span>
            </button>

            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center p-6 bg-[var(--c-surface)] border border-[rgba(16, 185, 129,0.18)] rounded-[10px] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(16, 185, 129,0.1)] flex items-center justify-center text-[#10B981] mb-3 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </div>
              <span className="font-chakra text-[13px] text-white">Take a Photo</span>
              <span className="font-sans text-[11px] text-[rgba(255,255,255,0.35)] mt-1">Use your camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 bg-[var(--c-surface)] border border-[rgba(16, 185, 129,0.18)] rounded-[10px] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(16, 185, 129,0.1)] flex items-center justify-center text-[#10B981] mb-3 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <span className="font-chakra text-[13px] text-white">Gallery</span>
              <span className="font-sans text-[11px] text-[rgba(255,255,255,0.35)] mt-1">From device</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleFileUpload}
            />
          </div>
        )}

        {activeTab === "presets" && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[14px] text-white">Choose from presets</span>
              <button onClick={() => setActiveTab("options")} className="font-sans text-[12px] text-arc-accent hover:underline">Back</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {presetAvatars.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedAvatar(url);
                    setActiveTab("preview");
                  }}
                  className="aspect-square bg-[rgba(16, 185, 129,0.05)] border border-[rgba(16, 185, 129,0.15)] rounded-full hover:border-[#10B981] overflow-hidden transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "camera" && (
          <div className="mb-8 flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <span className="font-sans text-[14px] text-white">Take a photo</span>
              <button onClick={() => { stopCamera(); setActiveTab("options"); }} className="font-sans text-[12px] text-arc-accent hover:underline">Cancel</button>
            </div>
            <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-arc-accent mb-4 relative bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <button
              onClick={capturePhoto}
              className="w-12 h-12 bg-white rounded-full border-4 border-[rgba(16, 185, 129,0.3)] hover:scale-105 transition-transform"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {activeTab === "preview" && selectedAvatar && (
          <div className="mb-8 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#10B981] shadow-[0_0_24px_rgba(16, 185, 129,0.3)] mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedAvatar} alt="Selected Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => {
                setSelectedAvatar(null);
                setActiveTab("options");
              }} 
              className="font-sans text-[12px] text-arc-accent hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {error && <p className="text-[#ff4d4d] font-sans text-[13px] mb-4 text-center">{error}</p>}

        <AuthButton 
          onClick={() => handleSubmit()} 
          disabled={isSubmitting || (activeTab !== "preview" && activeTab !== "options")}
        >
          {isSubmitting ? "ENTERING..." : "ENTER CALIBER →"}
        </AuthButton>

        {activeTab === "options" && (
          <button 
            type="button"
            onClick={() => handleSubmit(presetAvatars[0])}
            className="mt-6 text-center font-sans text-[12px] text-[rgba(255,255,255,0.35)] underline hover:text-white transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </ResponsiveAuthLayout>
  );
}
