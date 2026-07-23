"use client";

import React, { useState, useEffect, useRef } from "react";
import "../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import PostCard from "@/components/home/PostCard";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import NewsCard from "@/components/latest/NewsCard";
import PostSkeleton from "@/components/home/PostSkeleton";
import { useAuthStore } from "@/store/useAuthStore";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  source: string;
  publishedAt: string;
}

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

export default function LatestPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // News States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Drag / auto-scroll refs for News Carousel
  const newsScrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ startX: 0, scrollLeft: 0, dragging: false });
  const autoScrollPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trending Posts States
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Desktop drag-to-scroll: adjust the container's scrollLeft so the
  // position persists after release (no transform that snaps back).
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = newsScrollRef.current;
    if (!el) return;
    dragRef.current = { startX: e.pageX, scrollLeft: el.scrollLeft, dragging: true };
    autoScrollPausedRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    const el = newsScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const walk = e.pageX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    dragRef.current.dragging = false;
  };

  const handleMouseEnter = () => {
    autoScrollPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    dragRef.current.dragging = false;
    autoScrollPausedRef.current = false;
  };

  // Touch: rely on native horizontal scrolling of the overflow container;
  // just pause the auto-scroll while the user is interacting.
  const handleTouchStart = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    autoScrollPausedRef.current = true;
  };

  const handleTouchEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, 2500);
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError(false);
    if (newsScrollRef.current) newsScrollRef.current.scrollLeft = 0;
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.news || []);
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    } catch (err) {
      console.error(err);
      setNewsError(true);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchTrending = async (pageNum: number, append: boolean) => {
    setPostsLoading(true);
    setPostsError(false);
    try {
      const res = await fetch(`/api/posts/trending?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch trending");
      const data = await res.json();
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts || []);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setPostsError(true);
    } finally {
      setPostsLoading(false);
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
    }
  ) => {
    setPosts((prevPosts) => {
      // Find the post and update its values
      const updatedList = prevPosts.map((post) => {
        if (post.id === postId) {
          const newPost = { ...post, ...updatedFields };
          
          // Re-calculate the engagement score
          const likesVal = newPost.likesCount || 0;
          const commentsVal = newPost.commentsCount || 0;
          const repostsVal = newPost.repostsCount || 0;
          const bookmarksVal = newPost.bookmarksCount || 0;

          newPost.engagementScore =
            likesVal * 2 + commentsVal * 3 + repostsVal * 1.5 + bookmarksVal * 1;
          
          return newPost;
        }
        return post;
      });

      // Sort client-side by pure engagement score descending
      return [...updatedList].sort((a, b) => {
        const scoreB = b.engagementScore || 0;
        const scoreA = a.engagementScore || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
  };

  useEffect(() => {
    checkAuth();
    const timer = setTimeout(() => {
      fetchNews();
      fetchTrending(1, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // Auto-scroll marquee for the News carousel, driven via scrollLeft so it
  // composes with the native scroll / drag position (no CSS transform fight).
  useEffect(() => {
    const el = newsScrollRef.current;
    if (!el || newsLoading || newsError || news.length === 0) return;

    let raf = 0;
    const speed = 0.5; // px per frame
    const step = () => {
      if (!autoScrollPausedRef.current) {
        const half = el.scrollWidth / 2; // content is duplicated for a seamless loop
        if (half > 0) {
          el.scrollLeft += speed;
          if (el.scrollLeft >= half) el.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [newsLoading, newsError, news]);

  // Infinite Scroll Observer for Trending Feed
  useEffect(() => {
    if (postsLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchTrending(page + 1, true);
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
  }, [postsLoading, hasMore, page]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* SECTION 1: CAREERS & INDUSTRY NEWS */}
          <section className="news-section">
            <div className="flex justify-between items-center mb-4">
              <span className="section-label">CAREERS &amp; INDUSTRY NEWS</span>
              <button
                onClick={fetchNews}
                disabled={newsLoading}
                className="refresh-btn cursor-pointer"
                style={{
                  color: justRefreshed ? "#10B981" : undefined,
                  transition: "color 0.2s ease"
                }}
              >
                {newsLoading ? "Refreshing..." : justRefreshed ? "Refreshed ✓" : "Refresh"}
              </button>
            </div>

            {newsLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                <div className="news-skeleton animate-pulse" />
                <div className="news-skeleton animate-pulse" />
                <div className="news-skeleton animate-pulse" />
              </div>
            ) : newsError ? (
              <div className="news-error font-chakra text-xs text-[var(--c-text-muted)] p-4 text-center border border-[var(--c-border)] rounded-lg">
                Could not load news.{" "}
                <span className="text-[#10B981] cursor-pointer" onClick={fetchNews}>
                  Try again
                </span>
              </div>
            ) : (
              <div
                ref={newsScrollRef}
                className="news-carousel-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="news-carousel-track"
                  key={news.length}
                >
                  <div className="news-carousel-list">
                    {news.map((item, index) => (
                      <div key={index} className="news-card-wrapper" style={{ width: "280px", flexShrink: 0 }}>
                        <NewsCard {...item} />
                      </div>
                    ))}
                  </div>
                  <div className="news-carousel-list" aria-hidden="true">
                    {news.map((item, index) => (
                      <div key={`dup-${index}`} className="news-card-wrapper" style={{ width: "280px", flexShrink: 0 }}>
                        <NewsCard {...item} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: TRENDING ON CALIBER */}
          <section className="trending-section mt-8">
            <div className="mb-4">
              <span className="section-label">TRENDING ON CALIBER</span>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div key={`${post.id}-${post.likesCount}-${post.isLiked}-${post.isBookmarked}-${post.isReposted}-${post.isFollowing}-${post.commentsCount}`} className="trending-post-wrapper">
                  <PostCard
                    {...post}
                    onInteraction={handleInteractionUpdate}
                  />
                </div>
              ))}
            </div>

            {/* Shimmer loading states */}
            {postsLoading && (
              <div className="space-y-4 mt-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}

            {/* Empty State */}
            {!postsLoading && posts.length === 0 && !postsError && (
              <div className="text-center py-12 text-[var(--c-text-muted)] font-inter text-sm">
                No trending posts yet. Be the first to post!
              </div>
            )}

            {/* Error State */}
            {postsError && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="font-chakra text-sm text-white mb-2 uppercase">
                  Failed to load trending
                </h3>
                <button
                  onClick={() => fetchTrending(1, false)}
                  className="px-4 py-1.5 bg-[#10B981] hover:bg-[#00d0e0] text-[var(--c-surface)] font-chakra font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Infinite Scroll trigger element */}
            {hasMore && !postsLoading && <div ref={observerRef} className="h-4" />}
          </section>
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
        .refresh-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #10B981;
          background: none;
          border: none;
          padding: 0;
          transition: filter 0.2s;
        }
        .refresh-btn:hover {
          filter: brightness(1.2);
        }
        .news-carousel-container {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          position: relative;
          cursor: grab;
          user-select: none;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE / old Edge */
        }
        .news-carousel-container::-webkit-scrollbar {
          display: none; /* Chrome / Safari */
        }
        .news-carousel-container:active {
          cursor: grabbing;
        }
        .news-carousel-track {
          display: flex;
          width: max-content;
        }
        .news-carousel-list {
          display: flex;
          gap: 16px;
          padding-right: 16px;
          flex-shrink: 0;
        }
        .news-skeleton {
          width: 280px;
          min-width: 280px;
          height: 250px;
          background: var(--c-border);
          border-radius: 10px;
        }
        .trending-post-wrapper {
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
        }
        @media (max-width: 767px) {
          .news-skeleton {
            width: 280px;
            min-width: 280px;
          }
        }
      `}</style>
    </div>
  );
}
