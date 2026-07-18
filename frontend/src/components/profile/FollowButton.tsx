"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
}

export default function FollowButton({ userId, initialIsFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/id/${userId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Failed to follow", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleFollow}
      disabled={isLoading}
      className={`text-sm font-medium transition-colors ${
        isFollowing 
          ? "text-gray-500 hover:text-gray-400" 
          : "text-[#10B981] hover:text-[#33DFFF]"
      }`}
    >
      {isFollowing ? "Following" : "+ Follow"}
    </button>
  );
}
