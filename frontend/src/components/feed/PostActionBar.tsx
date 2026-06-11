"use client";

import { useState } from "react";

interface PostActionBarProps {
  post: {
    id: string;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    bookmarksCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
    isReposted: boolean;
  };
  onToggleComments: () => void;
}

export default function PostActionBar({ post, onToggleComments }: PostActionBarProps) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  
  const [repostsCount, setRepostsCount] = useState(post.repostsCount);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);

  const toggleLike = async () => {
    const previousIsLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch {
      setIsLiked(previousIsLiked);
      setLikesCount((prev) => (previousIsLiked ? prev + 1 : prev - 1));
    }
  };

  const toggleRepost = async () => {
    const previousIsReposted = isReposted;
    setIsReposted(!isReposted);
    setRepostsCount((prev) => (isReposted ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsReposted(data.isReposted);
      setRepostsCount(data.repostsCount);
    } catch {
      setIsReposted(previousIsReposted);
      setRepostsCount((prev) => (previousIsReposted ? prev + 1 : prev - 1));
    }
  };

  const toggleBookmark = async () => {
    const previousIsBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsBookmarked(data.isBookmarked);
    } catch {
      setIsBookmarked(previousIsBookmarked);
    }
  };

  const handleShare = async () => {
    // For MVP, just copy the URL
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Post link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // SVGs for the icons
  const LikeIcon = () => (
    <svg className={`w-5 h-5 ${isLiked ? 'fill-[#00D2FF] text-[#00D2FF]' : 'fill-none text-gray-400'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );

  const CommentIcon = () => (
    <svg className="w-5 h-5 fill-none text-gray-400" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const ShareIcon = () => (
    <svg className="w-5 h-5 fill-none text-gray-400" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );

  const RepostIcon = () => (
    <svg className={`w-5 h-5 ${isReposted ? 'text-[#00D2FF]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const BookmarkIcon = () => (
    <svg className={`w-5 h-5 ${isBookmarked ? 'fill-gray-300 text-gray-300' : 'fill-none text-gray-400'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-6">
        <button onClick={toggleLike} className="flex items-center gap-2 hover:opacity-75 transition-opacity group">
          <LikeIcon />
          <span className={`text-sm ${isLiked ? 'text-[#00D2FF]' : 'text-gray-400 group-hover:text-gray-300'}`}>{likesCount > 0 ? likesCount : ""}</span>
        </button>

        <button onClick={onToggleComments} className="flex items-center gap-2 hover:opacity-75 transition-opacity group">
          <CommentIcon />
          <span className="text-sm text-gray-400 group-hover:text-gray-300">{post.commentsCount > 0 ? post.commentsCount : ""}</span>
        </button>

        <button onClick={handleShare} className="flex items-center gap-2 hover:opacity-75 transition-opacity group">
          <ShareIcon />
        </button>

        <button onClick={toggleRepost} className="flex items-center gap-2 hover:opacity-75 transition-opacity group">
          <RepostIcon />
          <span className={`text-sm ${isReposted ? 'text-[#00D2FF]' : 'text-gray-400 group-hover:text-gray-300'}`}>{repostsCount > 0 ? repostsCount : ""}</span>
        </button>
      </div>

      <button onClick={toggleBookmark} className="hover:opacity-75 transition-opacity">
        <BookmarkIcon />
      </button>
    </div>
  );
}
