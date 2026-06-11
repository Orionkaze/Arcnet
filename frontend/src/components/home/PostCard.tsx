"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import ShareModal from "./ShareModal";
import Link from "next/link";

interface CommentType {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    avatar: string | null;
  };
}

interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  isFollowing: boolean;
  hub?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  onInteraction?: (postId: string, updatedFields: {
    isLiked?: boolean;
    likesCount?: number;
    isReposted?: boolean;
    repostsCount?: number;
    isBookmarked?: boolean;
    bookmarksCount?: number;
    isFollowing?: boolean;
    commentsCount?: number;
  }) => void;
}

function getRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  } catch {
    return "";
  }
}

export default function PostCard({
  id,
  content,
  imageUrl,
  createdAt,
  author,
  likesCount,
  commentsCount,
  repostsCount,
  bookmarksCount,
  isLiked,
  isBookmarked,
  isReposted,
  isFollowing,
  hub,
  onInteraction,
}: PostCardProps) {
  const { user: currentUser } = useAuthStore();

  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [prevLikes, setPrevLikes] = useState(likesCount);
  const [reposted, setReposted] = useState(isReposted);
  const [reposts, setReposts] = useState(repostsCount);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarks, setBookmarks] = useState(bookmarksCount);
  const [following, setFollowing] = useState(isFollowing);
  
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsCountState, setCommentsCountState] = useState(commentsCount);

  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Animation states
  const [animateLike, setAnimateLike] = useState(false);
  const [animateComment, setAnimateComment] = useState(false);
  const [animateRepost, setAnimateRepost] = useState(false);
  const [animateBookmark, setAnimateBookmark] = useState(false);
  const [animateShare, setAnimateShare] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; scale: number }[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const isOwnPost = currentUser && currentUser.id === author.id;
  const initial = author.firstName.charAt(0).toUpperCase() || "U";

  // Sync prevLikes after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevLikes(likes);
    }, 300);
    return () => clearTimeout(timer);
  }, [likes]);

  const handleLike = async () => {
    if (!currentUser) {
      showErrorToast("Please log in to like posts.");
      return;
    }
    const oldLiked = liked;
    const oldLikes = likes;
    
    // Trigger animations
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 300);

    // Heart particles on Like
    if (!oldLiked) {
      const newParticles = Array.from({ length: 4 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 40, // offset x
        y: -30 - Math.random() * 40,   // offset y
        scale: 0.6 + Math.random() * 0.7,
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 800);
    }

    // Optimistic Update
    setLiked(!oldLiked);
    setLikes(oldLiked ? oldLikes - 1 : oldLikes + 1);

    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      setLiked(data.isLiked);
      setLikes(data.likesCount);
      if (onInteraction) {
        onInteraction(id, { isLiked: data.isLiked, likesCount: data.likesCount });
      }
    } catch (error) {
      setLiked(oldLiked);
      setLikes(oldLikes);
      showErrorToast("Could not complete action. Please try again.");
    }
  };

  const handleRepost = async () => {
    if (!currentUser) {
      showErrorToast("Please log in to repost.");
      return;
    }
    const oldReposted = reposted;
    const oldReposts = reposts;

    // Trigger animation
    setAnimateRepost(true);
    setTimeout(() => setAnimateRepost(false), 400);

    // Optimistic Update
    setReposted(!oldReposted);
    setReposts(oldReposted ? oldReposts - 1 : oldReposts + 1);

    try {
      const res = await fetch(`/api/posts/${id}/repost`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to repost");
      const data = await res.json();
      setReposted(data.isReposted);
      setReposts(data.repostsCount);
      if (onInteraction) {
        onInteraction(id, { isReposted: data.isReposted, repostsCount: data.repostsCount });
      }
    } catch (error) {
      setReposted(oldReposted);
      setReposts(oldReposts);
      showErrorToast("Could not complete action. Please try again.");
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      showErrorToast("Please log in to bookmark.");
      return;
    }
    const oldBookmarked = bookmarked;
    const oldBookmarks = bookmarks;

    // Trigger animation
    setAnimateBookmark(true);
    setTimeout(() => setAnimateBookmark(false), 250);

    // Optimistic Update
    setBookmarked(!oldBookmarked);
    setBookmarks(oldBookmarked ? oldBookmarks - 1 : oldBookmarks + 1);

    try {
      const res = await fetch(`/api/posts/${id}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      const data = await res.json();
      setBookmarked(data.isBookmarked);
      setBookmarks(data.bookmarksCount);
      if (onInteraction) {
        onInteraction(id, { isBookmarked: data.isBookmarked, bookmarksCount: data.bookmarksCount });
      }
    } catch (error) {
      setBookmarked(oldBookmarked);
      setBookmarks(oldBookmarks);
      showErrorToast("Could not complete action. Please try again.");
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showErrorToast("Please log in to follow creators.");
      return;
    }
    if (isOwnPost) return;
    const oldFollowing = following;

    // Optimistic Update
    setFollowing(!oldFollowing);

    try {
      const res = await fetch(`/api/users/${author.username}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to follow");
      const data = await res.json();
      setFollowing(data.following);
      if (onInteraction) {
        onInteraction(id, { isFollowing: data.following });
      }
    } catch (error) {
      setFollowing(oldFollowing);
      showErrorToast("Could not complete action. Please try again.");
    }
  };

  const handleShare = () => {
    // Trigger share icon animation
    setAnimateShare(true);
    setTimeout(() => setAnimateShare(false), 200);

    // Open Instagram-style Share Modal instead of copying directly to clipboard
    setShareModalOpen(true);
  };

  const toggleComments = () => {
    setAnimateComment(true);
    setTimeout(() => setAnimateComment(false), 200);

    setCommentsOpen(!commentsOpen);
    if (!commentsOpen && commentsList.length === 0) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data.comments);
      } else {
        showErrorToast("Failed to load comments.");
      }
    } catch (error) {
      showErrorToast("Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showErrorToast("Please log in to comment.");
      return;
    }
    if (!commentText.trim()) return;

    const newCommentContent = commentText.trim();
    setCommentText("");

    // Optimistic Update: Append temporary comment
    const tempId = Math.random().toString();
    const tempComment = {
      id: tempId,
      content: newCommentContent,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
    };

    setCommentsList((prev) => [...prev, tempComment]);
    setCommentsCountState((prev) => prev + 1);

    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentContent }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const data = await res.json();
      
      // Update the temporary comment with the server response
      setCommentsList((prev) =>
        prev.map((c) => (c.id === tempId ? data.comment : c))
      );
      if (onInteraction) {
        onInteraction(id, { commentsCount: commentsCountState + 1 });
      }
    } catch (error) {
      // Revert comments state
      setCommentsList((prev) => prev.filter((c) => c.id !== tempId));
      setCommentsCountState((prev) => prev - 1);
      showErrorToast("Could not post comment. Please try again.");
    }
  };

  return (
    <article className="post-card relative">
      {/* Dynamic Toast Notifications */}
      {errorToast && (
        <div className="absolute top-2 right-2 bg-red-500 text-white font-bold font-chakra text-xs py-1.5 px-3 rounded shadow-lg z-30 animate-fade-in">
          {errorToast}
        </div>
      )}

      {/* Top row */}
      <div className="post-header">
        <div className="post-avatar">
          {author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar}
              alt={author.firstName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            initial
          )}
        </div>

        <div className="post-user-info">
          <div className="flex items-center gap-1">
            <span className="post-username">
              {author.firstName} {author.lastName}
            </span>
            {author.isVerified && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#00EAFF"
                className="inline-block"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="post-handle">
              @{author.username} • {getRelativeTime(createdAt)}
            </span>
            {hub && (
              <Link
                href={`/hub/${hub.slug}`}
                className="inline-flex items-center bg-[#1c2331] text-[#00EAFF] hover:text-[#00EAFF] font-chakra text-[10px] px-2 py-0.5 rounded border border-[#2A313C] hover:border-[#00EAFF] transition-all"
              >
                # {hub.name}
              </Link>
            )}
          </div>
        </div>

        {currentUser && !isOwnPost && (
          <button
            onClick={handleFollow}
            className={`follow-btn ${following ? "following" : ""}`}
            style={{
              borderColor: following ? "#2A313C" : "#00EAFF",
              color: following ? "#C8C7C7" : "#00EAFF",
            }}
          >
            {following ? "Following" : "+ Follow"}
          </button>
        )}
      </div>

      {/* Post text */}
      <p className="post-text">{content}</p>

      {/* Optional image */}
      {imageUrl && (
        <div className="post-image" style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Post Attachment"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}

      {/* Actions row */}
      <div className="post-actions border-t border-[#2A313C] mt-4 pt-3 flex justify-between relative">
        <button
          onClick={handleLike}
          className="post-action flex items-center gap-1.5 relative"
          style={{
            color: liked ? "#00EAFF" : "#C8C7C7",
            transition: "color 0.3s ease",
          }}
          aria-label="Like"
        >
          {/* Heart particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="heart-particle"
              style={{
                ["--dx" as string]: `${p.x}px`,
                ["--dy" as string]: `${p.y}px`,
                ["--ds" as string]: p.scale,
              } as React.CSSProperties}
            >
              ❤
            </span>
          ))}

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={liked ? "#00EAFF" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animateLike ? "animate-heart" : ""}
            style={{ transition: "fill 0.3s ease" }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>

          {/* Like Count Flip */}
          <span className="font-chakra overflow-hidden inline-block h-[1.2em] relative">
            <span
              key={likes}
              className={`inline-block ${
                likes > prevLikes
                  ? "num-slide-up"
                  : likes < prevLikes
                  ? "num-slide-down"
                  : ""
              }`}
            >
              {likes}
            </span>
          </span>
        </button>

        <button
          onClick={toggleComments}
          className="post-action flex items-center gap-1.5"
          style={{ color: commentsOpen ? "#00EAFF" : "#C8C7C7" }}
          aria-label="Comment"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animateComment ? "animate-comment" : ""}
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
          <span className="font-chakra">{commentsCountState}</span>
        </button>

        <button
          onClick={handleRepost}
          className="post-action flex items-center gap-1.5"
          style={{
            color: reposted ? "#00EAFF" : "#C8C7C7",
            transition: "color 0.4s ease",
          }}
          aria-label="Repost"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animateRepost ? "animate-repost" : ""}
          >
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          <span className="font-chakra">{reposts}</span>
        </button>

        <button
          onClick={handleBookmark}
          className="post-action flex items-center gap-1.5"
          style={{ color: bookmarked ? "#00EAFF" : "#C8C7C7" }}
          aria-label="Bookmark"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={bookmarked ? "#00EAFF" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animateBookmark ? "animate-bookmark" : ""}
            style={{ transition: "fill 0.25s ease" }}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
        </button>

        <button
          onClick={handleShare}
          className="post-action flex items-center gap-1.5"
          aria-label="Share"
          style={{ color: shareModalOpen ? "#00EAFF" : "#C8C7C7" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animateShare ? "animate-share" : ""}
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22,2 15,22 11,13 2,9" />
          </svg>
        </button>
      </div>

      {/* Inline Comments Section (smooth expanding transition) */}
      <div
        className="comments-section overflow-hidden"
        style={{
          maxHeight: commentsOpen ? "1000px" : "0px",
          opacity: commentsOpen ? 1 : 0,
          borderTop: commentsOpen ? "1px solid #2A313C" : "1px solid transparent",
          marginTop: commentsOpen ? "1rem" : "0px",
          paddingTop: commentsOpen ? "1rem" : "0px",
          transition: "max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease, margin 0.3s ease, border-color 0.3s ease",
        }}
      >
        <h4 className="font-chakra text-xs text-[#00EAFF] uppercase tracking-wider mb-3">
          Comments
        </h4>

        {commentsLoading ? (
          <div className="text-center py-4 text-[#C8C7C7] text-xs font-chakra">
            Loading comments...
          </div>
        ) : (
          <div className="comments-list space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
            {commentsList.length === 0 ? (
              <div className="text-[#C8C7C7] text-xs italic py-2">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              commentsList.map((comment) => (
                <div key={comment.id} className="comment-item flex gap-2.5">
                  <div
                    className="comment-avatar flex-shrink-0 w-7 h-7 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-xs"
                    style={{ border: "1px solid #2A313C" }}
                  >
                    {comment.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      comment.user.firstName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="comment-bubble flex-grow bg-[#0d1320] border border-[#2A313C] p-2.5 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">
                        {comment.user.firstName} {comment.user.lastName}{" "}
                        <span className="text-[10px] text-[#C8C7C7] font-normal">
                          @{comment.user.username}
                        </span>
                      </span>
                      <span className="text-[10px] text-[#C8C7C7]">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Comment Input */}
        {currentUser ? (
          <form onSubmit={handleAddComment} className="comment-form flex gap-2 items-center">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={300}
              className="flex-grow bg-[#10141A] border border-[#2A313C] text-white text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] transition-colors font-inter"
              style={{ height: "44px" }}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 bg-[#00EAFF] hover:bg-[#00d0e0] text-[#10141A] font-bold font-chakra text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ height: "44px" }}
            >
              Post
            </button>
          </form>
        ) : (
          <div className="text-xs text-[#C8C7C7] italic py-2 text-center border-t border-[#2A313C] mt-2">
            Please log in to add comments.
          </div>
        )}
      </div>

      {/* Share Modal component */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        postId={id}
        postContent={content}
      />

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes heartScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .animate-heart {
          display: inline-block;
          animation: heartScale 0.3s ease;
        }
        @keyframes floatHeart {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) scale(var(--ds));
            opacity: 0;
          }
        }
        .heart-particle {
          position: absolute;
          left: 50%;
          top: 50%;
          color: #00EAFF;
          font-size: 10px;
          pointer-events: none;
          animation: floatHeart 0.8s ease-out forwards;
          z-index: 50;
        }
        @keyframes commentRotate {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-comment {
          display: inline-block;
          animation: commentRotate 0.2s ease;
        }
        @keyframes repostSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-repost {
          display: inline-block;
          animation: repostSpin 0.4s ease;
        }
        @keyframes bookmarkBounce {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .animate-bookmark {
          display: inline-block;
          animation: bookmarkBounce 0.25s ease;
        }
        @keyframes shareRotate {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-share {
          display: inline-block;
          animation: shareRotate 0.2s ease;
        }
        @keyframes slideUpIn {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDownIn {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .num-slide-up {
          display: inline-block;
          animation: slideUpIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .num-slide-down {
          display: inline-block;
          animation: slideDownIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </article>
  );
}
