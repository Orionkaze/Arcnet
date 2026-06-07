"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
}

export default function ShareModal({ isOpen, onClose, postId, postContent }: ShareModalProps) {
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentUsers, setSentUsers] = useState<Record<string, boolean>>({});
  const [followedStatus, setFollowedStatus] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch followers
  const fetchFollowers = useCallback(async () => {
    try {
      const res = await fetch("/api/users/followers");
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suggestions from trending posts
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/posts/trending?limit=10");
      if (res.ok) {
        const data = await res.json();
        const uniqueAuthors: User[] = [];
        const authorIds = new Set<string>();

        for (const post of data.posts || []) {
          if (post.author && !authorIds.has(post.author.id)) {
            if (currentUser && post.author.id === currentUser.id) {
              continue;
            }
            authorIds.add(post.author.id);
            uniqueAuthors.push(post.author);
            if (uniqueAuthors.length >= 3) break;
          }
        }
        setSuggestions(uniqueAuthors);
      }
    } catch (err) {
      console.warn("Error fetching suggestions:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setLoading(true);
        fetchFollowers();
        fetchSuggestions();
        // Reset sent state when opening modal
        setSentUsers({});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchFollowers, fetchSuggestions]);

  if (!isOpen) return null;

  const handleSend = async (recipientId: string) => {
    if (sentUsers[recipientId]) return;

    // Optimistic sent check
    setSentUsers((prev) => ({ ...prev, [recipientId]: true }));

    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      if (!res.ok) {
        throw new Error("Failed to share");
      }
    } catch (err) {
      console.error(err);
      // Revert if failed
      setSentUsers((prev) => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleFollowSuggestion = async (userId: string, username: string) => {
    const isCurrentlyFollowing = followedStatus[userId];
    setFollowedStatus((prev) => ({ ...prev, [userId]: !isCurrentlyFollowing }));

    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFollowedStatus((prev) => ({ ...prev, [userId]: data.following }));
        // Refresh followers list so they show up there
        fetchFollowers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || "Failed to follow creator";
        setCopiedText(errorMsg);
        setTimeout(() => setCopiedText(null), 3000);
        setFollowedStatus((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
      }
    } catch (err) {
      setCopiedText("Failed to follow creator");
      setTimeout(() => setCopiedText(null), 3000);
      setFollowedStatus((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
    }
  };

  const getPostUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/post/${postId}`;
    }
    return `/post/${postId}`;
  };

  const triggerCopy = (type: "general" | "discord") => {
    const url = getPostUrl();
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedText(type === "discord" ? "Copied for Discord!" : "Copied!");
        setTimeout(() => setCopiedText(null), 2000);
      },
      () => {
        setCopiedText("Failed to copy");
        setTimeout(() => setCopiedText(null), 2000);
      }
    );
  };

  // Filtered followers list
  const filteredFollowers = followers.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const username = (user.username || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || username.includes(query);
  });

  const postTitle = encodeURIComponent(postContent.slice(0, 50) + "...");
  const postUrl = encodeURIComponent(getPostUrl());

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-content animate-modal-open" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <h3 className="share-modal-title">Share Post</h3>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="share-modal-search-wrapper">
          <input
            type="text"
            placeholder="Search people..."
            className="share-modal-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* People List */}
        <div className="share-people-list-container">
          {loading ? (
            <div className="share-loading font-chakra">Loading creators...</div>
          ) : filteredFollowers.length > 0 ? (
            <div className="share-people-list">
              {filteredFollowers.map((follower) => (
                <div key={follower.id} className="share-person-row">
                  <div className="share-person-left">
                    <div className="share-person-avatar">
                      {follower.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={follower.avatar} alt={follower.firstName} />
                      ) : (
                        follower.firstName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="share-person-info">
                      <div className="share-person-name">{follower.firstName} {follower.lastName}</div>
                      <div className="share-person-handle">@{follower.username}</div>
                    </div>
                  </div>
                  <button
                    className={`share-send-btn ${sentUsers[follower.id] ? "sent" : ""}`}
                    onClick={() => handleSend(follower.id)}
                    disabled={sentUsers[follower.id]}
                  >
                    {sentUsers[follower.id] ? "Sent ✓" : "Send"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="share-empty-state-wrapper">
              <div className="share-empty-message">
                Follow some creators to share with them
              </div>

              {suggestions.length > 0 && (
                <div className="share-suggestions-section">
                  <div className="share-suggestions-title">SUGGESTED CREATORS</div>
                  <div className="share-suggestions-list">
                    {suggestions.map((sug) => (
                      <div key={sug.id} className="share-suggestion-row">
                        <div className="share-person-left">
                          <div className="share-person-avatar">
                            {sug.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={sug.avatar} alt={sug.firstName} />
                            ) : (
                              sug.firstName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="share-person-info">
                            <div className="share-person-name">{sug.firstName} {sug.lastName}</div>
                            <div className="share-person-handle">@{sug.username}</div>
                          </div>
                        </div>
                        <button
                          className={`share-follow-btn ${followedStatus[sug.id] ? "following" : ""}`}
                          onClick={() => handleFollowSuggestion(sug.id, sug.username || "")}
                        >
                          {followedStatus[sug.id] ? "Following" : "+ Follow"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="share-external-divider">
          <span className="divider-line" />
          <span className="divider-text">or share via</span>
          <span className="divider-line" />
        </div>

        {/* External Shares */}
        <div className="share-external-row">
          {/* Copy Link */}
          <button className="share-external-circle" onClick={() => triggerCopy("general")} aria-label="Copy Link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </button>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${postUrl}&text=${postTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-external-circle"
            aria-label="Share on Twitter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${postUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-external-circle"
            aria-label="Share on WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </a>

          {/* Discord */}
          <button className="share-external-circle" onClick={() => triggerCopy("discord")} aria-label="Share on Discord">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </button>
        </div>

        {copiedText && (
          <div className="share-toast-notification animate-modal-open">
            {copiedText}
          </div>
        )}
      </div>

      <style jsx>{`
        .share-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }
        .share-modal-content {
          background: #10141A;
          border: 1px solid #2A313C;
          border-radius: 16px;
          padding: 1.25rem;
          width: 420px;
          max-width: 95vw;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        .animate-modal-open {
          animation: modalOpen 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes modalOpen {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .share-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .share-modal-title {
          font-family: var(--font-chakra-petch), sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .share-modal-close {
          background: none;
          border: none;
          color: #C8C7C7;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .share-modal-close:hover {
          color: #00EAFF;
        }
        .share-modal-search-wrapper {
          margin-bottom: 1rem;
        }
        .share-modal-search {
          width: 100%;
          height: 40px;
          border-radius: 8px;
          background: #0d1320;
          border: 1px solid #2A313C;
          color: #FFFFFF;
          padding: 0 12px;
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .share-modal-search:focus {
          border-color: #00EAFF;
          outline: none;
        }
        .share-people-list-container {
          max-height: 280px;
          overflow-y: auto;
          margin-bottom: 1.25rem;
          scrollbar-width: thin;
        }
        .share-loading {
          text-align: center;
          color: #C8C7C7;
          font-size: 12px;
          padding: 1.5rem 0;
        }
        .share-people-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .share-person-row, .share-suggestion-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .share-person-row:hover, .share-suggestion-row:hover {
          background-color: rgba(0, 234, 255, 0.04);
        }
        .share-person-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .share-person-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2A313C;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
        }
        .share-person-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .share-person-info {
          display: flex;
          flex-direction: column;
        }
        .share-person-name {
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
        }
        .share-person-handle {
          font-family: var(--font-inter), sans-serif;
          font-size: 12px;
          color: #C8C7C7;
        }
        .share-send-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid #2A313C;
          background: transparent;
          color: #C8C7C7;
          border-radius: 6px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-send-btn:hover {
          border-color: #00EAFF;
          color: #00EAFF;
        }
        .share-send-btn.sent {
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid #00EAFF;
          color: #00EAFF;
          cursor: default;
        }
        .share-follow-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid #2A313C;
          background: transparent;
          color: #C8C7C7;
          border-radius: 6px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-follow-btn:hover {
          border-color: #00EAFF;
          color: #00EAFF;
        }
        .share-follow-btn.following {
          color: #00EAFF;
          border-color: rgba(0, 234, 255, 0.3);
        }
        .share-empty-state-wrapper {
          padding: 1rem 0.5rem;
          text-align: center;
        }
        .share-empty-message {
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          color: #C8C7C7;
          margin-bottom: 1.5rem;
        }
        .share-suggestions-section {
          text-align: left;
          border-top: 1px solid #2A313C;
          padding-top: 1rem;
        }
        .share-suggestions-title {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: rgba(0, 234, 255, 0.6);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .share-suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .share-external-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #2A313C;
        }
        .divider-text {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          color: #C8C7C7;
        }
        .share-external-row {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        .share-external-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0d1320;
          border: 1px solid #2A313C;
          color: #C8C7C7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-external-circle:hover {
          border-color: #00EAFF;
          color: #00EAFF;
        }
        .share-toast-notification {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: #00EAFF;
          color: #10141A;
          font-family: var(--font-chakra-petch), sans-serif;
          font-weight: 700;
          font-size: 12px;
          padding: 8px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0, 234, 255, 0.2);
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}
