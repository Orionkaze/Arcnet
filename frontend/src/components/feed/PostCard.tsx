"use client";

import { useState } from "react";
import Image from "next/image";
import PostActionBar from "./PostActionBar";
import CommentSection from "./CommentSection";

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  isVerified: boolean;
  subtitle?: string; // e.g., "B.Tech Hons @KIET"
}

interface PostProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string | Date;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  isFollowing: boolean;
}

export default function PostCard({ post }: { post: PostProps }) {
  const [isFollowing, setIsFollowing] = useState(post.isFollowing);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const toggleFollow = async () => {
    setIsFollowLoading(true);
    try {
      const res = await fetch(`/api/users/id/${post.author.id}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Failed to follow", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div className="bg-[#13151A] rounded-md border border-[#23262D] p-5 text-gray-200 mb-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden relative">
            {post.author.avatar ? (
              <Image src={post.author.avatar} alt="Avatar" layout="fill" objectFit="cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-[#1A1C23] text-[#00D2FF]">
                {post.author.firstName[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-100">
                {post.author.firstName} {post.author.lastName}
              </span>
              {post.author.isVerified && (
                <svg className="w-4 h-4 text-[#00D2FF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {post.author.subtitle && (
              <span className="text-xs text-gray-500">{post.author.subtitle}</span>
            )}
            {!post.author.subtitle && post.author.username && (
              <span className="text-xs text-gray-500">@{post.author.username}</span>
            )}
          </div>
        </div>

        {/* Follow Button */}
        <button 
          onClick={toggleFollow}
          disabled={isFollowLoading}
          className={`text-sm font-medium transition-colors ${
            isFollowing ? "text-gray-500 hover:text-gray-400" : "text-[#00D2FF] hover:text-[#33DFFF]"
          }`}
        >
          {isFollowing ? "Following" : "+ Follow"}
        </button>
      </div>

      {/* Body */}
      <div className="text-sm text-gray-300 leading-relaxed">
        {post.content}
      </div>

      {/* Media (if any) */}
      {post.imageUrl && (
        <div className="w-full mt-2 rounded-2xl overflow-hidden border border-[#23262D]">
          {/* Note: In Next.js we use standard img or Image with proper sizing for placeholders */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="Post media" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Action Bar */}
      <PostActionBar 
        post={post} 
        onToggleComments={() => setShowComments(!showComments)}
      />

      {/* Comments Section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  );
}
