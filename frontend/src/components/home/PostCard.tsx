"use client";

import React from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";

interface PostCardProps {
  username: string;
  handle: string;
  text: string;
  isFollowing: boolean;
  hasImage: boolean;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  avatar?: string | null;
}

export default function PostCard({
  username,
  handle,
  text,
  isFollowing,
  hasImage,
  likes,
  comments,
  shares,
  reposts,
  avatar,
}: PostCardProps) {
  const { user } = useAuthStore();
  const isOwnPost = user && (user.username === username || `@${user.username}` === username || user.username === username.replace(/^@/, ""));
  const displayAvatar = isOwnPost ? user.avatar : avatar;
  const initial = username.replace(/^@/, "").charAt(0).toUpperCase() || "U";

  return (
    <article className="post-card">
      {/* Top row */}
      <div className="post-header">
        <div className="post-avatar">
          {displayAvatar ? (
            displayAvatar.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatar}
                alt={username}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Image
                src={displayAvatar}
                alt={username}
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            )
          ) : (
            initial
          )}
        </div>

        <div className="post-user-info">
          <span className="post-username">{username}</span>
          <span className="post-handle">{handle}</span>
        </div>

        <button
          className={`follow-btn ${isFollowing ? "following" : ""}`}
        >
          {isFollowing ? "Following" : "+ Follow"}
        </button>
      </div>

      {/* Post text */}
      <p className="post-text">{text}</p>

      {/* Optional image */}
      {hasImage && (
        <div className="post-image">
          {/* Landscape placeholder SVG */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="post-image-icon"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}

      {/* Actions row */}
      <div className="post-actions">
        <button className="post-action-btn" aria-label="Like">
          {/* Heart icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button className="post-action-btn" aria-label="Comment">
          {/* Chat bubble icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
          <span>{comments}</span>
        </button>

        <button className="post-action-btn" aria-label="Share">
          {/* Paper plane icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22,2 15,22 11,13 2,9" />
          </svg>
          <span>{shares}</span>
        </button>

        <button className="post-action-btn" aria-label="Repost">
          {/* Retweet / repost arrows icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          <span>{reposts}</span>
        </button>

        <button className="post-action-btn" aria-label="Bookmark">
          {/* Bookmark icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
