"use client";

import React, { useState, useEffect } from "react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  } catch {
    return "";
  }
}

export default function RightPanel() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchHappenings() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNews(data.news || []);
      } catch (err) {
        console.error("RightPanel news fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchHappenings();
  }, []);

  const displayedNews = news.slice(0, 4);

  return (
    <aside className="right-panel">
      <div className="happenings-card">
        <h3 className="happenings-title" style={{ fontFamily: "var(--font-chakra-petch), sans-serif", fontSize: "14px", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.75rem" }}>
          Recent Happenings
        </h3>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="py-3 border-b border-[#2A313C] last:border-0">
                <div className="h-2 bg-[#2A313C] rounded w-16 mb-2" />
                <div className="h-3 bg-[#2A313C] rounded w-full mb-1" />
                <div className="h-3 bg-[#2A313C] rounded w-4/5 mb-2" />
                <div className="h-2 bg-[#2A313C] rounded w-10" />
              </div>
            ))}
          </div>
        ) : error || news.length === 0 ? (
          <div className="text-xs text-[#C8C7C7] py-4 text-center">
            No recent news available.
          </div>
        ) : (
          <div className="happenings-list-container">
            {displayedNews.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="happening-link"
              >
                <div className="happening-source">{item.source}</div>
                <div className="happening-title">{item.title}</div>
                <div className="happening-time">{formatRelativeTime(item.publishedAt)}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .happening-link {
          display: block;
          text-decoration: none;
          padding: 0.75rem 0;
          border-bottom: 1px solid #2A313C;
          transition: all 0.2s;
        }
        .happening-link:last-of-type {
          border-bottom: none;
        }
        .happening-source {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          color: #00EAFF;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .happening-title {
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          color: #FFFFFF;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .happening-link:hover .happening-title {
          color: #00EAFF;
        }
        .happening-time {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          color: #C8C7C7;
          margin-top: 4px;
        }
        .read-more-link {
          display: block;
          text-align: right;
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          color: #00EAFF;
          text-decoration: none;
          margin-top: 1rem;
          transition: all 0.2s;
          font-weight: 600;
        }
        .read-more-link:hover {
          text-decoration: underline;
          filter: brightness(1.2);
        }
      `}</style>
    </aside>
  );
}
