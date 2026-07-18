import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Socket.io backend origin must be allowed in connect-src (websocket + xhr polling).
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// Content-Security-Policy. `unsafe-inline` is required for Next's inline bootstrap
// script and styled-jsx/inline styles; `unsafe-eval` is only needed by the dev
// HMR runtime, so it is excluded in production.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Images can't execute script, and news/avatars come from many third-party
  // hosts, so allow any https image source (remote SVGs are sandboxed via the
  // next/image contentSecurityPolicy below).
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${backendOrigin} ws: wss:`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS only makes sense over HTTPS (production).
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Sandbox remote (SVG) images so a malicious avatar can't execute script.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
