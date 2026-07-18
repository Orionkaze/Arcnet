"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import PostCard from "@/components/home/PostCard";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import PostSkeleton from "@/components/home/PostSkeleton";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { useAuthStore } from "@/store/useAuthStore";

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  isVerified: boolean;
}

interface PostType {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  isFollowing: boolean;
  engagementScore?: number;
}

export default function Home() {
  const { user, checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Feed states
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isJoinHubModalOpen, setIsJoinHubModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError("");
    setJoinSuccess("");

    try {
      const res = await fetch("/api/hubs/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join hub");
      }
      setJoinSuccess("Request sent! Waiting for owner's approval.");
      setJoinCode("");
    } catch (err) {
      const error = err as Error;
      setJoinError(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Polling states
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const latestPostIdRef = useRef<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = async (pageNum: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/feed?page=${pageNum}&limit=10`);
      if (!res.ok) {
        throw new Error("Failed to load feed");
      }
      const data = await res.json();
      
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
        if (data.posts.length > 0) {
          latestPostIdRef.current = data.posts[0].id;
        }
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to load feed";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postContent: string, postImageUrl: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postContent.trim(), imageUrl: postImageUrl.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      // Add new post to start of feed
      setPosts((prev) => [data.post, ...prev]);
      latestPostIdRef.current = data.post.id;
    } catch (err) {
      throw err;
    }
  };

  const handleInteractionUpdate = (
    postId: string,
    updatedFields: {
      isLiked?: boolean;
      likesCount?: number;
      isReposted?: boolean;
      repostsCount?: number;
      isBookmarked?: boolean;
      isFollowing?: boolean;
      commentsCount?: number;
      isDeleted?: boolean;
    }
  ) => {
    if (updatedFields.isDeleted) {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      return;
    }
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, ...updatedFields } : post
      )
    );
  };

  const loadNewPosts = () => {
    setNewPostsAvailable(false);
    fetchFeed(1, false);
    // Scroll center feed container to top
    const feedElement = document.querySelector(".center-feed");
    if (feedElement) {
      feedElement.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initial Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed(1, false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Polling for new posts every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!latestPostIdRef.current) return;
      try {
        const res = await fetch("/api/posts/feed?page=1&limit=1");
        if (res.ok) {
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            const newestId = data.posts[0].id;
            if (newestId !== latestPostIdRef.current) {
              setNewPostsAvailable(true);
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(page + 1, true);
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, hasMore, page]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />
        
        <main className="center-feed relative">
          {/* Post Creation Modal removed from inline */}

          {/* New Posts Notification Pill */}
          {newPostsAvailable && (
            <div className="flex justify-center sticky top-0 z-10 my-2">
              <button
                onClick={loadNewPosts}
                className="bg-[#10B981] text-[#10141A] font-chakra font-bold text-xs tracking-wide uppercase px-4 py-1.5 rounded-full border border-[#10B981] shadow-[0_0_10px_rgba(16, 185, 129,0.4)] cursor-pointer hover:bg-[#00d0e0] transition-all"
              >
                New posts available
              </button>
            </div>
          )}

          {/* Feed Container */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={`${post.id}-${post.likesCount}-${post.isLiked}-${post.isBookmarked}-${post.isReposted}-${post.isFollowing}-${post.commentsCount}`}
                {...post}
                onInteraction={handleInteractionUpdate}
              />
            ))}
          </div>

          {/* Shimmer loading states */}
          {loading && (
            <div className="space-y-4 mt-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {/* Cyan Icon */}
              <div className="w-16 h-16 rounded-full bg-[#10141A] border border-[#10B981] flex items-center justify-center shadow-[0_0_15px_rgba(16, 185, 129,0.2)] mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="16" y1="11" x2="22" y2="11"></line>
                </svg>
              </div>
              <h2 className="font-chakra text-lg text-white mb-2 uppercase tracking-wide">
                Your feed is empty
              </h2>
              <p className="font-inter text-sm text-[#C8C7C7] mb-6 max-w-sm">
                Follow some creators to see their posts here
              </p>
              <Link href="/ecosystem/find-team">
                <button className="px-6 py-2.5 border border-[#10B981] bg-transparent text-[#10B981] font-chakra font-bold text-xs uppercase tracking-wider rounded cursor-pointer hover:bg-[rgba(16, 185, 129,0.1)] transition-colors">
                  Discover Creators
                </button>
              </Link>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="font-chakra text-base text-white mb-2 uppercase">
                Failed to load feed
              </h3>
              <p className="font-inter text-sm text-[#C8C7C7] mb-4">
                Please check your network and try again.
              </p>
              <button
                onClick={() => fetchFeed(1, false)}
                className="px-6 py-2 bg-[#10B981] hover:bg-[#00d0e0] text-[#10141A] font-chakra font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Infinite Scroll trigger element */}
          {hasMore && !loading && <div ref={observerRef} className="h-4" />}
        </main>

        <RightPanel />

        {/* Floating Grid Menu Button */}
        <div className="fixed top-[72px] right-6 z-50">
          <div className="relative">
            <button
              className="w-9 h-9 rounded-full bg-[#10141A] border-2 border-[#10B981] flex items-center justify-center hover:bg-[rgba(16, 185, 129,0.1)] transition-colors cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-[#14181F] border border-[#2A313C] rounded-lg shadow-2xl py-2 w-48 font-inter">
                <button
                  className="w-full text-left px-4 py-2 text-[#C8C7C7] hover:text-white hover:bg-[#1D232D] transition-colors text-sm"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsJoinHubModalOpen(true);
                  }}
                >
                  Join New Hub
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#1D232D] transition-colors text-sm"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsCreatePostModalOpen(true);
                  }}
                >
                  Create Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        user={user as unknown as React.ComponentProps<typeof CreatePostModal>["user"]}
        onSubmit={handleCreatePost}
      />

      {/* JOIN HUB MODAL */}
      {isJoinHubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#10141A] border border-[#2A313C] rounded-lg p-6 w-[400px] max-w-[90vw] shadow-2xl relative">
            <button
              onClick={() => {
                setIsJoinHubModalOpen(false);
                setJoinCode("");
                setJoinError("");
                setJoinSuccess("");
              }}
              className="absolute top-4 right-4 text-[#C8C7C7] hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-chakra font-bold text-white mb-4">Join a Private Hub</h2>
            <form onSubmit={handleJoinHub} className="space-y-4">
              {joinError && <div className="text-[#FF4D4D] text-sm font-chakra">{joinError}</div>}
              {joinSuccess && <div className="text-[#10B981] text-sm font-chakra">{joinSuccess}</div>}
              <div>
                <label className="block text-xs font-chakra text-[#C8C7C7] mb-1 uppercase tracking-wider">
                  Enter Hub Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full bg-[#161c24] border border-[#2A313C] rounded p-2 text-white font-mono text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#10B981] transition-colors uppercase"
                  placeholder="------"
                />
              </div>
              <button
                type="submit"
                disabled={isJoining || !!joinSuccess}
                className="w-full py-2.5 rounded bg-[#10B981] text-[#10141A] font-chakra font-bold text-sm uppercase tracking-wider hover:bg-[#00d0e0] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Sending..." : "Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
