import React from "react";

export default function PostSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="post-header" style={{ marginBottom: "1rem" }}>
        <div className="skeleton-avatar skeleton-shimmer" />
        <div className="post-user-info" style={{ marginLeft: "10px" }}>
          <div className="skeleton-text skeleton-shimmer" style={{ width: "30%" }} />
          <div className="skeleton-text skeleton-shimmer" style={{ width: "20%", height: "10px" }} />
        </div>
        <div className="skeleton-btn skeleton-shimmer" />
      </div>

      <div className="skeleton-text skeleton-shimmer" style={{ width: "95%" }} />
      <div className="skeleton-text skeleton-shimmer" style={{ width: "85%" }} />
      <div className="skeleton-text skeleton-shimmer" style={{ width: "40%" }} />

      <div className="skeleton-media skeleton-shimmer" />

      <div className="post-actions" style={{ justifyContent: "space-between", marginTop: "1rem", borderTop: "1px solid #2A313C", paddingTop: "0.75rem" }}>
        <div className="skeleton-text skeleton-shimmer" style={{ width: "15%", height: "14px", margin: 0 }} />
        <div className="skeleton-text skeleton-shimmer" style={{ width: "15%", height: "14px", margin: 0 }} />
        <div className="skeleton-text skeleton-shimmer" style={{ width: "15%", height: "14px", margin: 0 }} />
        <div className="skeleton-text skeleton-shimmer" style={{ width: "15%", height: "14px", margin: 0 }} />
      </div>
    </div>
  );
}
