import React from "react";


interface NewsCardProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  source: string;
  publishedAt: string;
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

export default function NewsCard({
  title,
  description,
  url,
  imageUrl,
  source,
  publishedAt,
}: NewsCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card block no-underline group"
    >
      <div className="news-image-container relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="news-image"
          />
        ) : (
          <div className="news-image-placeholder">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--c-border)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
          </div>
        )}
      </div>

      <div className="news-content">
        <div className="news-source">{source}</div>
        <h3 className="news-title">{title}</h3>
        <p className="news-description">{description}</p>
        <div className="news-time">{getRelativeTime(publishedAt)}</div>
      </div>

      <style jsx>{`
        .news-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          overflow: hidden;
          width: 280px;
          min-width: 280px;
          transition: border-color 0.2s, transform 0.2s;
          display: flex;
          flex-direction: column;
        }
        .news-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
          transform: translateY(-2px);
        }
        .news-image-container {
          height: 140px;
          background: var(--c-border);
          width: 100%;
          overflow: hidden;
        }
        .news-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .news-card:hover .news-image {
          transform: scale(1.05);
        }
        .news-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--c-surface-2);
        }
        .news-content {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .news-source {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #10B981;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .news-title {
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--c-text);
          line-height: 1.4;
          margin: 0 0 6px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .news-description {
          font-family: var(--font-inter), sans-serif;
          font-size: 12px;
          color: var(--c-text-muted);
          line-height: 1.4;
          margin: 0 0 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-grow: 1;
        }
        .news-time {
          font-family: var(--font-inter), sans-serif;
          font-size: 11px;
          color: var(--c-text-muted);
        }
      `}</style>
    </a>
  );
}
