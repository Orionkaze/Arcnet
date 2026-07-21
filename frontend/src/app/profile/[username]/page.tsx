"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { safeExternalUrl } from "@/lib/url";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import PostCard from "@/components/home/PostCard";
import "../../home.css";
import "../profile.css";

// --- PLATFORM ICONS ---
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <defs>
      <linearGradient id="instagram-profile-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#instagram-profile-grad)" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#instagram-profile-grad)" fill="none" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="url(#instagram-profile-grad)" stroke="url(#instagram-profile-grad)" />
  </svg>
);

const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
  </svg>
);

const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M22 7h-7v2h7V7zm-9.397 4.982c.404-.379.605-.889.605-1.53 0-.608-.184-1.093-.551-1.455-.368-.362-.916-.543-1.642-.543H6.386v7.19h4.86c.791 0 1.385-.181(1.782-.543).398-.362.597-.881.597-1.558 0-.616-.207-1.097-.622-1.562zm-3.033-2.156h1.28c.321 0 .571.07.747.21.176.14.264.341.264.605 0 .248-.094.441-.282.579-.188.138-.456.207-.803.207h-1.206v-1.601zm0 2.766h1.368c.381 0 .668.084.86.251.192.167.288.406.288.717 0 .3-.099.539-.297.717-.198.178-.501.267-.91.267h-1.309v-1.952zM23.111 13c-.046-.867-.272-1.579-.679-2.137-.407-.558-.985-.837-1.733-.837-.738 0-1.32.268-1.748.804-.428.536-.659 1.258-.694 2.167h4.854zm-4.805 1.139c.048.653.255 1.157.621 1.512.366.355.854.533 1.464.533.456 0 .848-.106 1.177-.318.329-.212.569-.503.72-.873h1.614c-.218.847-.692 1.503-1.42 1.968-.728.465-1.626.697-2.695.697-1.127 0-2.021-.341-2.684-1.024-.663-.683-.994-1.618-.994-2.805 0-1.229.324-2.179.972-2.851.648-.672 1.498-1.008 2.55-1.008 1.096 0 1.956.331 2.581.993.625.662.932 1.583.92 2.765H18.306v.111z"/>
  </svg>
);

const DribbbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.962c-.22-.047-2.148-.445-4.382-.206.918 2.52 1.286 4.6 1.378 5.163 1.834-1.24 3.003-3.284 3.004-5.6-.001-.22-.001-.41-.004-.616-1.095 2.106-2.527 3.961-4.293 5.539zM12 2.18c-4.887 0-8.948 3.568-9.718 8.271 2.213-.67 5.093-1.042 7.828-1.042.361 0 .723.007 1.082.022.086-.217.172-.44.263-.665.234-.579.497-1.196.787-1.83C9.722 4.975 7.02 2.785 6.776 2.585 8.293 2.316 10.12 2.18 12 2.18zm5.228 1.472a18.258 18.258 0 0 0-5.111 4.18c-.287.618-.544 1.222-.774 1.787 3.526-.263 6.942.302 7.202.348-.152-2.571-1.325-4.821-3.23-6.315zm-7.613 9.429c-.067-.015-.133-.031-.202-.043C6.732 12.593 3.327 12.6 2.2 12.6c0 .416.03.824.088 1.224.977.01 4.79-.013 7.854-.925 1.547-1.442 2.785-3.033 3.731-4.707a21.43 21.43 0 0 1-.951 2.518 17.514 17.514 0 0 1-3.308 2.369zm1.066 1.479c-2.318.784-4.523.829-4.846.834.698 3.336 2.827 6.136 5.8 7.375.056-.445.419-2.613 1.523-5.32a24.161 24.161 0 0 1-2.477-2.889zm5.553-2.029a16.326 16.326 0 0 1-5.176.435c.783 1.954 1.632 3.843 2.531 5.093 1.258-1.503 2.179-3.242 2.645-5.528z"/>
  </svg>
);

const ArtStationIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M.153 17.652L7.336 5.228 9.53 8.948 2.637 20.89h18.257l2.161-3.737-14.887-.008L20.273 3.11 23.847 9.3l.153 11.59H0v-3.238zm11.95-6.902l3.42 5.922h-6.84l3.42-5.922z"/>
  </svg>
);

const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.2-3.78 3.9 1.1c.04.94.82 1.7 1.81 1.7 1.1 0 2-1 2-2s-.9-2-2-2c-.88 0-1.62.58-1.89 1.38L12.92 4.1c-.2-.06-.41.04-.47.24L11.1 8.02c-2.3.06-4.48.7-6.17 1.72-.56-.76-1.46-1.24-2.43-1.24-1.65 0-3 1.35-3 3 0 1.26.78 2.33 1.88 2.76-.08.38-.12.78-.12 1.18 0 4.14 4.93 7.5 11 7.5s11-3.36 11-7.5c0-.4-.04-.8-.12-1.18 1.1-.43 1.88-1.5 1.88-2.76zM5.62 13.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm12.63 4.88c-1.38 1.38-4 1.5-4.25 1.5-.25 0-2.87-.12-4.25-1.5-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.06 1.06 3.03 1.2 3.55 1.2.52 0 2.49-.13 3.55-1.2.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-2.25-2.88c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.53-4.09-1.37-.76-.53-1.37-1.25-1.89-2.03v7.08c0 1.4-.23 2.82-.94 4.02-.78 1.35-2.07 2.42-3.56 2.9-1.48.5-3.13.53-4.59.08-1.57-.47-2.97-1.55-3.81-2.99-.87-1.45-1.13-3.23-.81-4.88.35-1.78 1.42-3.4 3.01-4.28 1.34-.76 2.93-.99 4.43-.69v4.11c-.81-.25-1.72-.18-2.45.28-.76.47-1.28 1.28-1.4 2.17-.18 1.14.33 2.37 1.3 2.97.83.52 1.9.52 2.74.01.69-.42 1.11-1.18 1.15-1.99.04-2.58.02-5.17.03-7.75V0z"/>
  </svg>
);

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.204 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.36 11.985-11.987C23.97 5.39 18.592.02 12.017.02z"/>
  </svg>
);

const SnapchatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor" {...props}>
    <path d="M510.846 392.673c-5.211 12.157-27.239 21.089-67.36 27.318-2.064 2.786-3.775 14.686-6.507 23.956-1.625 5.566-5.623 8.869-12.128 8.869l-.297-.005c-9.395 0-19.203-4.323-38.852-4.323-26.521 0-35.662 6.043-56.254 20.588-21.832 15.438-42.771 28.764-74.027 27.399-31.646 2.334-58.025-16.908-72.871-27.404-20.714-14.643-29.828-20.582-56.241-20.582-18.864 0-30.736 4.72-38.852 4.72-8.073 0-11.213-4.922-12.422-9.04-2.703-9.189-4.404-21.263-6.523-24.13-20.679-3.209-67.31-11.344-68.498-32.15a10.627 10.627 0 0 1 8.877-11.069c69.583-11.455 100.924-82.901 102.227-85.934.074-.176.155-.344.237-.515 3.713-7.537 4.544-13.849 2.463-18.753-5.05-11.896-26.872-16.164-36.053-19.796-23.715-9.366-27.015-20.128-25.612-27.504 2.437-12.836 21.725-20.735 33.002-15.453 8.919 4.181 16.843 6.297 23.547 6.297 5.022 0 8.212-1.204 9.96-2.171-2.043-35.936-7.101-87.29 5.687-115.969C158.122 21.304 229.705 15.42 250.826 15.42c.944 0 9.141-.089 10.11-.089 52.148 0 102.254 26.78 126.723 81.643 12.777 28.65 7.749 79.792 5.695 116.009 1.582.872 4.357 1.942 8.599 2.139 6.397-.286 13.815-2.389 22.069-6.257 6.085-2.846 14.406-2.461 20.48.058l.029.01c9.476 3.385 15.439 10.215 15.589 17.87.184 9.747-8.522 18.165-25.878 25.018-2.118.835-4.694 1.655-7.434 2.525-9.797 3.106-24.6 7.805-28.616 17.271-2.079 4.904-1.256 11.211 2.46 18.748.087.168.166.342.239.515 1.301 3.03 32.615 74.46 102.23 85.934 6.427 1.058 11.163 7.877 7.725 15.859z"/>
  </svg>
);


const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const GmailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" width="16" height="16" {...props}>
    <path d="M158 391v-142l-82-63V361q0 30 30 30" fill="#4285f4"/>
    <path d="M154 248l102 77l102-77v-98l-102 77l-102-77" fill="#ea4335"/>
    <path d="M354 391v-142l82-63V361q0 30-30 30" fill="#34a853"/>
    <path d="M76 188l82 63v-98l-30-23c-27-21-52 0-52 26" fill="#c5221f"/>
    <path d="M436 188l-82 63v-98l30-23c27-21 52 0 52 26" fill="#fbbc04"/>
  </svg>
);


function extractDomainName(url: string): string {
  try {
    let host = url.trim().toLowerCase();
    if (host.includes("://")) {
      host = host.split("://")[1];
    }
    host = host.split("/")[0];
    host = host.split("?")[0];
    host = host.split("#")[0];
    host = host.split(":")[0];
    if (host.startsWith("www.")) {
      host = host.substring(4);
    }
    return host;
  } catch {
    return "";
  }
}

function getPlatformInfo(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return { name: "empty", color: "#C8C7C7", isHardcoded: false, useFavicon: false, domain: "" };
  }

  const lowerUrl = trimmed.toLowerCase();
  const hasUrlMarkers = lowerUrl.includes("://") || lowerUrl.includes(".");

  if (hasUrlMarkers) {
    if (trimmed.length < 5) {
      return { name: "empty", color: "#C8C7C7", isHardcoded: false, useFavicon: false, domain: "" };
    }

    // Gmail
    if (lowerUrl.includes("mail.google.com") || lowerUrl.includes("gmail.com") || (lowerUrl.includes("@") && lowerUrl.endsWith("gmail.com"))) {
      return { name: "gmail", color: "#EA4335", isHardcoded: true, useFavicon: false, domain: "gmail.com" };
    }
    // Snapchat
    if (lowerUrl.includes("snapchat.com") || lowerUrl.includes("snap.com")) {
      return { name: "snapchat", color: "#FFFC00", isHardcoded: true, useFavicon: false, domain: "snapchat.com" };
    }
    // Instagram
    if (lowerUrl.includes("instagram.com")) {
      return { name: "instagram", color: "#E1306C", isHardcoded: true, useFavicon: false, domain: "instagram.com" };
    }
    // Facebook
    if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
      return { name: "facebook", color: "#1877F2", isHardcoded: true, useFavicon: false, domain: "facebook.com" };
    }
    // Twitter/X
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      return { name: "twitter", color: "#000000", isHardcoded: true, useFavicon: false, domain: "twitter.com" };
    }
    // TikTok
    if (lowerUrl.includes("tiktok.com")) {
      return { name: "tiktok", color: "#010101", isHardcoded: true, useFavicon: false, domain: "tiktok.com" };
    }
    // Threads
    if (lowerUrl.includes("threads.net")) {
      return { name: "threads", color: "#000000", isHardcoded: true, useFavicon: true, domain: "threads.net" };
    }
    // Pinterest
    if (lowerUrl.includes("pinterest.com") || lowerUrl.includes("pinterest.co")) {
      return { name: "pinterest", color: "#E60023", isHardcoded: true, useFavicon: false, domain: "pinterest.com" };
    }
    // Reddit GameDev must be checked before plain Reddit
    if (lowerUrl.includes("reddit.com/r/gamedev")) {
      return { name: "redditgamedev", color: "#FF4500", isHardcoded: true, useFavicon: true, domain: "reddit.com" };
    }
    // Reddit
    if (lowerUrl.includes("reddit.com")) {
      return { name: "reddit", color: "#FF4500", isHardcoded: true, useFavicon: false, domain: "reddit.com" };
    }
    // Tumblr
    if (lowerUrl.includes("tumblr.com")) {
      return { name: "tumblr", color: "#35465C", isHardcoded: true, useFavicon: true, domain: "tumblr.com" };
    }
    // Mastodon
    if (lowerUrl.includes("mastodon.social") || lowerUrl.includes("mastodon.online")) {
      return { name: "mastodon", color: "#6364FF", isHardcoded: true, useFavicon: true, domain: "mastodon.social" };
    }
    // Bluesky
    if (lowerUrl.includes("bsky.app") || lowerUrl.includes("bluesky.app")) {
      return { name: "bluesky", color: "#0085FF", isHardcoded: true, useFavicon: true, domain: "bluesky.app" };
    }
    // BeReal
    if (lowerUrl.includes("bere.al")) {
      return { name: "bereal", color: "#000000", isHardcoded: true, useFavicon: true, domain: "bere.al" };
    }
    // LinkedIn
    if (lowerUrl.includes("linkedin.com")) {
      return { name: "linkedin", color: "#0A66C2", isHardcoded: true, useFavicon: false, domain: "linkedin.com" };
    }
    // Polywork
    if (lowerUrl.includes("polywork.com")) {
      return { name: "polywork", color: "#6359FF", isHardcoded: true, useFavicon: true, domain: "polywork.com" };
    }
    // Wellfound/AngelList
    if (lowerUrl.includes("wellfound.com") || lowerUrl.includes("angel.co")) {
      return { name: "wellfound", color: "#000000", isHardcoded: true, useFavicon: true, domain: lowerUrl.includes("wellfound.com") ? "wellfound.com" : "angel.co" };
    }
    // GitHub
    if (lowerUrl.includes("github.com")) {
      return { name: "github", color: "#FFFFFF", isHardcoded: true, useFavicon: false, domain: "github.com" };
    }
    // GitLab
    if (lowerUrl.includes("gitlab.com")) {
      return { name: "gitlab", color: "#FC6D26", isHardcoded: true, useFavicon: true, domain: "gitlab.com" };
    }
    // Bitbucket
    if (lowerUrl.includes("bitbucket.org")) {
      return { name: "bitbucket", color: "#0052CC", isHardcoded: true, useFavicon: true, domain: "bitbucket.org" };
    }
    // CodePen
    if (lowerUrl.includes("codepen.io")) {
      return { name: "codepen", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "codepen.io" };
    }
    // LeetCode
    if (lowerUrl.includes("leetcode.com")) {
      return { name: "leetcode", color: "#FFA116", isHardcoded: true, useFavicon: true, domain: "leetcode.com" };
    }
    // HackerRank
    if (lowerUrl.includes("hackerrank.com")) {
      return { name: "hackerrank", color: "#00EA64", isHardcoded: true, useFavicon: true, domain: "hackerrank.com" };
    }
    // Codeforces
    if (lowerUrl.includes("codeforces.com")) {
      return { name: "codeforces", color: "#1F8ACB", isHardcoded: true, useFavicon: true, domain: "codeforces.com" };
    }
    // CodeChef
    if (lowerUrl.includes("codechef.com")) {
      return { name: "codechef", color: "#5B4638", isHardcoded: true, useFavicon: true, domain: "codechef.com" };
    }
    // AtCoder
    if (lowerUrl.includes("atcoder.jp")) {
      return { name: "atcoder", color: "#000000", isHardcoded: true, useFavicon: true, domain: "atcoder.jp" };
    }
    // Stack Overflow
    if (lowerUrl.includes("stackoverflow.com")) {
      return { name: "stackoverflow", color: "#F58025", isHardcoded: true, useFavicon: true, domain: "stackoverflow.com" };
    }
    // Dev.to
    if (lowerUrl.includes("dev.to")) {
      return { name: "devto", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "dev.to" };
    }
    // Hashnode
    if (lowerUrl.includes("hashnode.com")) {
      return { name: "hashnode", color: "#2962FF", isHardcoded: true, useFavicon: true, domain: "hashnode.com" };
    }
    // Medium
    if (lowerUrl.includes("medium.com")) {
      return { name: "medium", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "medium.com" };
    }
    // Substack
    if (lowerUrl.includes("substack.com")) {
      return { name: "substack", color: "#FF6719", isHardcoded: true, useFavicon: true, domain: "substack.com" };
    }
    // Behance
    if (lowerUrl.includes("behance.net") || lowerUrl.includes("behance.com")) {
      return { name: "behance", color: "#1769FF", isHardcoded: true, useFavicon: false, domain: "behance.net" };
    }
    // Dribbble
    if (lowerUrl.includes("dribbble.com")) {
      return { name: "dribbble", color: "#EA4C89", isHardcoded: true, useFavicon: false, domain: "dribbble.com" };
    }
    // ArtStation
    if (lowerUrl.includes("artstation.com")) {
      return { name: "artstation", color: "#13AFF0", isHardcoded: true, useFavicon: false, domain: "artstation.com" };
    }
    // Figma
    if (lowerUrl.includes("figma.com")) {
      return { name: "figma", color: "#F24E1E", isHardcoded: true, useFavicon: true, domain: "figma.com" };
    }
    // Notion
    if (lowerUrl.includes("notion.so")) {
      return { name: "notion", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "notion.so" };
    }
    // Adobe Portfolio
    if (lowerUrl.includes("adobe.com")) {
      return { name: "adobe", color: "#FF0000", isHardcoded: true, useFavicon: true, domain: "adobe.com" };
    }
    // Steam
    if (lowerUrl.includes("steamcommunity.com") || lowerUrl.includes("store.steampowered.com")) {
      return { name: "steam", color: "#1B2838", isHardcoded: true, useFavicon: true, domain: "steamcommunity.com" };
    }
    // Epic Games
    if (lowerUrl.includes("epicgames.com")) {
      return { name: "epicgames", color: "#2563EB", isHardcoded: true, useFavicon: true, domain: "epicgames.com" };
    }
    // Itch.io Game Jams must be checked before plain Itch.io
    if (lowerUrl.includes("itch.io/jams")) {
      return { name: "itchiojams", color: "#FA5C5C", isHardcoded: true, useFavicon: true, domain: "itch.io" };
    }
    // Itch.io
    if (lowerUrl.includes("itch.io")) {
      return { name: "itchio", color: "#FA5C5C", isHardcoded: true, useFavicon: true, domain: "itch.io" };
    }
    // Xbox
    if (lowerUrl.includes("xbox.com")) {
      return { name: "xbox", color: "#107C10", isHardcoded: true, useFavicon: true, domain: "xbox.com" };
    }
    // PlayStation Network
    if (lowerUrl.includes("psnprofiles.com")) {
      return { name: "playstation", color: "#003791", isHardcoded: true, useFavicon: true, domain: "psnprofiles.com" };
    }
    // Battle.net
    if (lowerUrl.includes("battle.net")) {
      return { name: "battlenet", color: "#148EFF", isHardcoded: true, useFavicon: true, domain: "battle.net" };
    }
    // YouTube
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return { name: "youtube", color: "#FF0000", isHardcoded: true, useFavicon: false, domain: "youtube.com" };
    }
    // Twitch
    if (lowerUrl.includes("twitch.tv")) {
      return { name: "twitch", color: "#9146FF", isHardcoded: true, useFavicon: false, domain: "twitch.tv" };
    }
    // Vimeo
    if (lowerUrl.includes("vimeo.com")) {
      return { name: "vimeo", color: "#1AB7EA", isHardcoded: true, useFavicon: true, domain: "vimeo.com" };
    }
    // Spotify
    if (lowerUrl.includes("spotify.com")) {
      return { name: "spotify", color: "#1DB954", isHardcoded: true, useFavicon: true, domain: "spotify.com" };
    }
    // SoundCloud
    if (lowerUrl.includes("soundcloud.com")) {
      return { name: "soundcloud", color: "#FF5500", isHardcoded: true, useFavicon: true, domain: "soundcloud.com" };
    }
    // Apple Music
    if (lowerUrl.includes("music.apple.com")) {
      return { name: "applemusic", color: "#FC3C44", isHardcoded: true, useFavicon: true, domain: "music.apple.com" };
    }
    // Discord
    if (lowerUrl.includes("discord.gg") || lowerUrl.includes("discord.com")) {
      return { name: "discord", color: "#5865F2", isHardcoded: true, useFavicon: false, domain: "discord.com" };
    }
    // Telegram
    if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.org")) {
      return { name: "telegram", color: "#2AABEE", isHardcoded: true, useFavicon: true, domain: lowerUrl.includes("t.me") ? "t.me" : "telegram.org" };
    }
    // WhatsApp
    if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp.com")) {
      return { name: "whatsapp", color: "#25D366", isHardcoded: true, useFavicon: true, domain: "whatsapp.com" };
    }
    // Patreon
    if (lowerUrl.includes("patreon.com")) {
      return { name: "patreon", color: "#FF424D", isHardcoded: true, useFavicon: true, domain: "patreon.com" };
    }
    // Ko-fi
    if (lowerUrl.includes("ko-fi.com")) {
      return { name: "ko-fi", color: "#FF5E5B", isHardcoded: true, useFavicon: true, domain: "ko-fi.com" };
    }
    // Buy Me a Coffee
    if (lowerUrl.includes("buymeacoffee.com")) {
      return { name: "buymeacoffee", color: "#FFDD00", isHardcoded: true, useFavicon: true, domain: "buymeacoffee.com" };
    }
    // Gumroad
    if (lowerUrl.includes("gumroad.com")) {
      return { name: "gumroad", color: "#FF90E8", isHardcoded: true, useFavicon: true, domain: "gumroad.com" };
    }
    // Product Hunt
    if (lowerUrl.includes("producthunt.com")) {
      return { name: "producthunt", color: "#DA552F", isHardcoded: true, useFavicon: true, domain: "producthunt.com" };
    }
    // Linktree
    if (lowerUrl.includes("linktr.ee")) {
      return { name: "linktree", color: "#43E55E", isHardcoded: true, useFavicon: true, domain: "linktr.ee" };
    }

    // Game Engines & Development
    // Unreal Marketplace must be checked before plain Unreal Engine
    if (lowerUrl.includes("unrealengine.com/marketplace")) {
      return { name: "unrealmarketplace", color: "#2563EB", isHardcoded: true, useFavicon: true, domain: "unrealengine.com" };
    }
    if (lowerUrl.includes("forums.unrealengine.com") || lowerUrl.includes("unrealengine.com")) {
      return { name: "unrealengine", color: "#2563EB", isHardcoded: true, useFavicon: true, domain: "unrealengine.com" };
    }
    // Unity Asset Store must be checked before plain Unity
    if (lowerUrl.includes("assetstore.unity.com")) {
      return { name: "unityassetstore", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "assetstore.unity.com" };
    }
    if (lowerUrl.includes("discussions.unity.com") || lowerUrl.includes("unity.com")) {
      return { name: "unity", color: "#FFFFFF", isHardcoded: true, useFavicon: true, domain: "unity.com" };
    }
    if (lowerUrl.includes("godotengine.org")) {
      return { name: "godot", color: "#478CBF", isHardcoded: true, useFavicon: true, domain: "godotengine.org" };
    }
    if (lowerUrl.includes("gamemaker.io")) {
      return { name: "gamemaker", color: "#C2185B", isHardcoded: true, useFavicon: true, domain: "gamemaker.io" };
    }
    if (lowerUrl.includes("roblox.com")) {
      return { name: "roblox", color: "#E20338", isHardcoded: true, useFavicon: true, domain: "roblox.com" };
    }
    if (lowerUrl.includes("cryengine.com")) {
      return { name: "cryengine", color: "#F29111", isHardcoded: true, useFavicon: true, domain: "cryengine.com" };
    }
    if (lowerUrl.includes("o3de.org")) {
      return { name: "o3de", color: "#FF9900", isHardcoded: true, useFavicon: true, domain: "o3de.org" };
    }
    if (lowerUrl.includes("defold.com")) {
      return { name: "defold", color: "#FFB800", isHardcoded: true, useFavicon: true, domain: "defold.com" };
    }
    if (lowerUrl.includes("construct.net")) {
      return { name: "construct", color: "#00AAFF", isHardcoded: true, useFavicon: true, domain: "construct.net" };
    }
    if (lowerUrl.includes("rpgmakerweb.com")) {
      return { name: "rpgmaker", color: "#CC0000", isHardcoded: true, useFavicon: true, domain: "rpgmakerweb.com" };
    }
    if (lowerUrl.includes("gdevelop.io")) {
      return { name: "gdevelop", color: "#4A90E2", isHardcoded: true, useFavicon: true, domain: "gdevelop.io" };
    }
    if (lowerUrl.includes("cocos.com")) {
      return { name: "cocos", color: "#55C2E1", isHardcoded: true, useFavicon: true, domain: "cocos.com" };
    }

    // 3D / Art / Animation Tools & Communities
    if (lowerUrl.includes("blenderartists.org")) {
      return { name: "blenderartists", color: "#EA7600", isHardcoded: true, useFavicon: true, domain: "blenderartists.org" };
    }
    if (lowerUrl.includes("blendermarket.com")) {
      return { name: "blendermarket", color: "#EA7600", isHardcoded: true, useFavicon: true, domain: "blendermarket.com" };
    }
    if (lowerUrl.includes("sketchfab.com")) {
      return { name: "sketchfab", color: "#1CAAD9", isHardcoded: true, useFavicon: true, domain: "sketchfab.com" };
    }
    if (lowerUrl.includes("cgsociety.org")) {
      return { name: "cgsociety", color: "#005B96", isHardcoded: true, useFavicon: true, domain: "cgsociety.org" };
    }
    if (lowerUrl.includes("cgtrader.com")) {
      return { name: "cgtrader", color: "#1A1A1A", isHardcoded: true, useFavicon: true, domain: "cgtrader.com" };
    }
    if (lowerUrl.includes("turbosquid.com")) {
      return { name: "turbosquid", color: "#00A651", isHardcoded: true, useFavicon: true, domain: "turbosquid.com" };
    }
    if (lowerUrl.includes("mixamo.com")) {
      return { name: "mixamo", color: "#FF0000", isHardcoded: true, useFavicon: true, domain: "mixamo.com" };
    }
    if (lowerUrl.includes("substance3d.adobe.com")) {
      return { name: "substance3d", color: "#FF0000", isHardcoded: true, useFavicon: true, domain: "substance3d.adobe.com" };
    }
    if (lowerUrl.includes("zbrushcentral.com")) {
      return { name: "zbrushcentral", color: "#D4AA00", isHardcoded: true, useFavicon: true, domain: "zbrushcentral.com" };
    }
    if (lowerUrl.includes("polycount.com")) {
      return { name: "polycount", color: "#4A90D9", isHardcoded: true, useFavicon: true, domain: "polycount.com" };
    }
    if (lowerUrl.includes("quixel.com")) {
      return { name: "quixel", color: "#FF6B00", isHardcoded: true, useFavicon: true, domain: "quixel.com" };
    }
    if (lowerUrl.includes("flippednormals.com")) {
      return { name: "flippednormals", color: "#FF4500", isHardcoded: true, useFavicon: true, domain: "flippednormals.com" };
    }
    if (lowerUrl.includes("pureref.com")) {
      return { name: "pureref", color: "#000000", isHardcoded: true, useFavicon: true, domain: "pureref.com" };
    }

    // Game Asset Marketplaces
    if (lowerUrl.includes("gamedevmarket.net")) {
      return { name: "gamedevmarket", color: "#5C6BC0", isHardcoded: true, useFavicon: true, domain: "gamedevmarket.net" };
    }
    if (lowerUrl.includes("opengameart.org")) {
      return { name: "opengameart", color: "#4CAF50", isHardcoded: true, useFavicon: true, domain: "opengameart.org" };
    }
    if (lowerUrl.includes("kenney.nl")) {
      return { name: "kenney", color: "#F7941D", isHardcoded: true, useFavicon: true, domain: "kenney.nl" };
    }
    if (lowerUrl.includes("craftpix.net")) {
      return { name: "craftpix", color: "#FF6B35", isHardcoded: true, useFavicon: true, domain: "craftpix.net" };
    }

    // Game Dev Communities & Forums
    if (lowerUrl.includes("gamejolt.com")) {
      return { name: "gamejolt", color: "#CCFF00", isHardcoded: true, useFavicon: true, domain: "gamejolt.com" };
    }
    if (lowerUrl.includes("indiedb.com")) {
      return { name: "indiedb", color: "#E8A200", isHardcoded: true, useFavicon: true, domain: "indiedb.com" };
    }
    if (lowerUrl.includes("moddb.com")) {
      return { name: "moddb", color: "#AAAAAA", isHardcoded: true, useFavicon: true, domain: "moddb.com" };
    }
    if (lowerUrl.includes("tigsource.com")) {
      return { name: "tigsource", color: "#000000", isHardcoded: true, useFavicon: true, domain: "tigsource.com" };
    }
    if (lowerUrl.includes("gamedev.net")) {
      return { name: "gamedev", color: "#0088CC", isHardcoded: true, useFavicon: true, domain: "gamedev.net" };
    }
    if (lowerUrl.includes("newgrounds.com")) {
      return { name: "newgrounds", color: "#FF6600", isHardcoded: true, useFavicon: true, domain: "newgrounds.com" };
    }
    if (lowerUrl.includes("kongregate.com")) {
      return { name: "kongregate", color: "#FF6600", isHardcoded: true, useFavicon: true, domain: "kongregate.com" };
    }
    if (lowerUrl.includes("gamebanana.com")) {
      return { name: "gamebanana", color: "#FFCC00", isHardcoded: true, useFavicon: true, domain: "gamebanana.com" };
    }
    if (lowerUrl.includes("nexusmods.com")) {
      return { name: "nexusmods", color: "#DA8E35", isHardcoded: true, useFavicon: true, domain: "nexusmods.com" };
    }

    // Game Jams & Competitions
    if (lowerUrl.includes("ldjam.com")) {
      return { name: "ludumdare", color: "#25A6E1", isHardcoded: true, useFavicon: true, domain: "ldjam.com" };
    }
    if (lowerUrl.includes("globalgamejam.org")) {
      return { name: "globalgamejam", color: "#E8302A", isHardcoded: true, useFavicon: true, domain: "globalgamejam.org" };
    }

    // Programming & Scripting (game dev specific)
    if (lowerUrl.includes("shadertoy.com")) {
      return { name: "shadertoy", color: "#000000", isHardcoded: true, useFavicon: true, domain: "shadertoy.com" };
    }
    if (lowerUrl.includes("rosettacode.org")) {
      return { name: "rosettacode", color: "#009999", isHardcoded: true, useFavicon: true, domain: "rosettacode.org" };
    }

    // Pixel Art & 2D Tools
    if (lowerUrl.includes("lospec.com")) {
      return { name: "lospec", color: "#FF6B6B", isHardcoded: true, useFavicon: true, domain: "lospec.com" };
    }
    if (lowerUrl.includes("pixilart.com")) {
      return { name: "pixilart", color: "#FF6B6B", isHardcoded: true, useFavicon: true, domain: "pixilart.com" };
    }
    if (lowerUrl.includes("community.aseprite.org")) {
      return { name: "aseprite", color: "#7B5EA7", isHardcoded: true, useFavicon: true, domain: "community.aseprite.org" };
    }

    // Music & Sound for Games
    if (lowerUrl.includes("freesound.org")) {
      return { name: "freesound", color: "#FF6600", isHardcoded: true, useFavicon: true, domain: "freesound.org" };
    }
    if (lowerUrl.includes("fmod.com")) {
      return { name: "fmod", color: "#000000", isHardcoded: true, useFavicon: true, domain: "fmod.com" };
    }
    if (lowerUrl.includes("audiokinetic.com")) {
      return { name: "wwise", color: "#00AEEF", isHardcoded: true, useFavicon: true, domain: "audiokinetic.com" };
    }
    if (lowerUrl.includes("bandcamp.com")) {
      return { name: "bandcamp", color: "#1DA0C3", isHardcoded: true, useFavicon: true, domain: "bandcamp.com" };
    }

    // Video / Streaming for Game Devs
    if (lowerUrl.includes("kick.com")) {
      return { name: "kick", color: "#53FC18", isHardcoded: true, useFavicon: true, domain: "kick.com" };
    }
    if (lowerUrl.includes("rumble.com")) {
      return { name: "rumble", color: "#85C742", isHardcoded: true, useFavicon: true, domain: "rumble.com" };
    }

    const domain = extractDomainName(trimmed);
    return { name: "custom", color: "#C8C7C7", isHardcoded: false, useFavicon: true, domain };
  }

  if (!hasUrlMarkers) {
    const platformKeywords = [
      "github", "gitlab", "bitbucket", "codepen", "leetcode", "hackerrank", "codeforces", "codechef", "atcoder",
      "stackoverflow", "dev.to", "hashnode", "medium", "substack", "behance", "dribbble", "artstation", "figma",
      "notion", "adobe", "steam", "epicgames", "itch", "xbox", "playstation", "battle", "youtube", "twitch", "vimeo",
      "spotify", "soundcloud", "apple", "discord", "telegram", "whatsapp", "patreon", "kofi", "buymeacoffee", "gumroad",
      "producthunt", "linktree", "gmail", "facebook", "twitter", "snapchat", "instagram", "tiktok", "reddit", "tumblr",
      "mastodon", "bluesky", "bereal", "polywork", "wellfound",
      "unrealengine", "unity", "godot", "gamemaker", "roblox", "cryengine", "o3de", "defold", "construct", "rpgmaker", "gdevelop", "cocos", "blenderartists", "blendermarket", "sketchfab", "cgsociety", "cgtrader", "turbosquid", "mixamo", "substance3d", "zbrushcentral", "polycount", "quixel", "flippednormals", "pureref", "gamedevmarket", "opengameart", "kenney", "craftpix", "gamejolt", "indiedb", "moddb", "tigsource", "gamedev", "newgrounds", "kongregate", "gamebanana", "nexusmods", "ldjam", "globalgamejam", "shadertoy", "rosettacode", "lospec", "pixilart", "aseprite", "freesound", "fmod", "audiokinetic", "bandcamp", "kick", "rumble"
    ];
    const matchesKeyword = platformKeywords.some(keyword => keyword.includes(lowerUrl) || lowerUrl.includes(keyword));

    if (trimmed.length >= 3 && !matchesKeyword) {
      return { name: "snapchat", color: "#FFFC00", isHardcoded: true, useFavicon: false, domain: "snapchat.com" };
    }
  }

  return { name: "empty", color: "#C8C7C7", isHardcoded: false, useFavicon: false, domain: "" };
}

const ProfileSocialBadge = ({ link }: { link: { platform: string; url: string } }) => {
  const info = getPlatformInfo(link.url);
  const [faviconFailed, setFaviconFailed] = useState(false);

  const localSvgPlatforms = [
    "twitter", "github", "linkedin", "instagram", "youtube", 
    "twitch", "discord", "behance", "dribbble", "artstation", 
    "reddit", "tiktok", "snapchat", "pinterest", "facebook", "gmail"
  ];

  const hasLocalSvg = localSvgPlatforms.includes(info.name);

  const IconComp = (() => {
    if (hasLocalSvg) {
      switch (info.name) {
        case "twitter": return XIcon;
        case "github": return GitHubIcon;
        case "linkedin": return LinkedInIcon;
        case "instagram": return InstagramIcon;
        case "youtube": return YouTubeIcon;
        case "twitch": return TwitchIcon;
        case "discord": return DiscordIcon;
        case "behance": return BehanceIcon;
        case "dribbble": return DribbbleIcon;
        case "artstation": return ArtStationIcon;
        case "reddit": return RedditIcon;
        case "tiktok": return TikTokIcon;
        case "snapchat": return SnapchatIcon;
        case "pinterest": return PinterestIcon;
        case "facebook": return FacebookIcon;
        case "gmail": return GmailIcon;
        default: return GlobeIcon;
      }
    }
    return GlobeIcon;
  })();

  const showFavicon = info.useFavicon && info.domain && !faviconFailed;

  const hasError = faviconFailed;
  const iconColor = hasError ? "#C8C7C7" : info.color;
  const borderColor = hasError || !info.isHardcoded || info.color === "#FFFFFF" ? "#2A313C" : info.color;

  return (
    <a
      href={safeExternalUrl(link.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="profile-social-badge"
      aria-label={`${link.platform} profile`}
      style={{
        borderColor,
      }}
    >
      {showFavicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={`https://www.google.com/s2/favicons?domain=${info.domain}&sz=32`} 
          alt={info.name}
          onError={() => setFaviconFailed(true)}
          style={{ width: "16px", height: "16px", borderRadius: "2px" }}
        />
      ) : (
        <IconComp style={{ color: iconColor }} />
      )}
    </a>
  );
};



interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string | null;
  cover?: string | null;
  isVerified: boolean;
  createdAt: string;
  bio?: string | null;
  role?: string | null;
  location?: string | null;
  skills?: string | null;
  socialLinks?: { platform: string; url: string }[] | null;
  experience?: {
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate?: string | null;
    current: boolean;
    description?: string | null;
  }[] | null;
  _count?: {
    posts: number;
    followers: number;
    following: number;
    hubMembers: number;
  };
}

const PRESETS = [
  // Dark Gradients
  { id: "void", name: "Void", category: "Dark Gradients", value: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)" },
  { id: "deep-ocean", name: "Deep Ocean", category: "Dark Gradients", value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { id: "midnight", name: "Midnight", category: "Dark Gradients", value: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { id: "eclipse", name: "Eclipse", category: "Dark Gradients", value: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)" },
  // Emerald/Caliber themed
  { id: "neon-grid", name: "Neon Grid", category: "Emerald/Caliber themed", value: "linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px) 0 0 / 20px 20px, #10141A" },
  { id: "cyber", name: "Cyber", category: "Emerald/Caliber themed", value: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, rgba(16, 185, 129, 0.07) 100%)" },
  { id: "arc-light", name: "Arc Light", category: "Emerald/Caliber themed", value: "linear-gradient(135deg, #001a1f 0%, #003d4a 50%, rgba(16, 185, 129, 0.13) 100%)" },
  { id: "electric", name: "Electric", category: "Emerald/Caliber themed", value: "linear-gradient(to bottom, transparent 55%, rgba(16, 185, 129, 0.3) 59%, #10B981 60%, rgba(16, 185, 129, 0.3) 61%, transparent 65%), linear-gradient(135deg, #0a0e1a 0%, #001b33 100%)" },
  // Dark Colorful
  { id: "crimson", name: "Crimson", category: "Dark Colorful", value: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #6b0000 100%)" },
  { id: "forest", name: "Forest", category: "Dark Colorful", value: "linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0d2d0d 100%)" },
  { id: "royal", name: "Royal", category: "Dark Colorful", value: "linear-gradient(135deg, #0a0a2e 0%, #1a0a4a 50%, #2a0a6a 100%)" },
  { id: "ember", name: "Ember", category: "Dark Colorful", value: "linear-gradient(135deg, #1a0800 0%, #3d1500 50%, #6b2800 100%)" },
  // Game Dev themed
  { id: "pixel-dark", name: "Pixel Dark", category: "Game Dev themed", value: "radial-gradient(rgba(16, 185, 129, 0.1) 1.5px, transparent 1.5px) 0 0 / 16px 16px, #10141A" },
  { id: "circuit", name: "Circuit", category: "Game Dev themed", value: "linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(0deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(45deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px) 0 0 / 40px 40px, #10141A" },
  { id: "scanline", name: "Scanline", category: "Game Dev themed", value: "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 2px, transparent 2px, transparent 4px), #151a22" },
  { id: "noise", name: "Noise", category: "Game Dev themed", value: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\"), #10141A" }
];

function resolveCoverBg(coverValue: string | null | undefined): string {
  if (!coverValue) {
    return "linear-gradient(135deg, #10141A 0%, #15222E 50%, #2A313C 100%)";
  }
  if (coverValue.startsWith("preset:")) {
    const presetId = coverValue.substring(7);
    const preset = PRESETS.find(p => p.id === presetId);
    return preset ? preset.value : "linear-gradient(135deg, #10141A 0%, #15222E 50%, #2A313C 100%)";
  }
  return `url("${coverValue}") center/cover no-repeat`;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { user: currentUser, checkAuth, logout } = useAuthStore();
  const resolvedParams = React.use(params);
  const usernameParam = resolvedParams.username;

  // Layout drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // States
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "portfolio" | "hubs" | "about">("posts");
  const [isFollowed, setIsFollowed] = useState(false);
  const [modalOpen, setModalOpen] = useState<"followers" | "following" | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [followersList, setFollowersList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [followingList, setFollowingList] = useState<any[]>([]);
  
  // Tab Content States
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userPosts, setUserPosts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userPortfolio, setUserPortfolio] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userHubs, setUserHubs] = useState<any[]>([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Add Project Modal States
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTags, setProjectTags] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectError, setProjectError] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Edit Cover Modal States
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [activeCoverTab, setActiveCoverTab] = useState<"presets" | "custom">("presets");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setUploadError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please use JPG, PNG or WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 5MB");
      return;
    }

    setCustomFile(file);
    setSelectedPreset(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustom = () => {
    setCustomFile(null);
    setCustomPreview(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCloseAddProject = () => {
    setIsAddProjectOpen(false);
    setProjectTitle("");
    setProjectDescription("");
    setProjectTags("");
    setProjectLink("");
    setProjectError("");
    setIsSavingProject(false);
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      setProjectError("Title and description are required.");
      return;
    }
    setIsSavingProject(true);
    setProjectError("");
    try {
      const res = await fetch(`/api/users/${cleanUsername}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          tags: projectTags,
          link: projectLink.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProjectError(data.error || "Failed to add project.");
        setIsSavingProject(false);
        return;
      }
      setUserPortfolio((prev) => [data.project, ...prev]);
      handleCloseAddProject();
    } catch {
      setProjectError("Something went wrong. Please try again.");
      setIsSavingProject(false);
    }
  };

  const handleCloseModal = () => {
    setIsEditCoverOpen(false);
    setActiveCoverTab("presets");
    setSelectedPreset(null);
    setCustomFile(null);
    setCustomPreview(null);
    setUploadError("");
    setIsApplying(false);
  };

  const handleApplyCover = async () => {
    setIsApplying(true);
    setUploadError("");
    try {
      if (selectedPreset) {
        const coverVal = `preset:${selectedPreset}`;
        const res = await fetch("/api/users/profile/cover", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cover: coverVal }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save preset cover");
        }

        await res.json();
        setProfileUser(prev => prev ? { ...prev, cover: coverVal } : null);
        if (currentUser) {
          useAuthStore.getState().setAuth({ ...currentUser, cover: coverVal });
        }
        handleCloseModal();
      } else if (customFile) {
        const formData = new FormData();
        formData.append("file", customFile);

        const res = await fetch("/api/users/profile/cover-upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload custom cover");
        }

        const data = await res.json();
        setProfileUser(prev => prev ? { ...prev, cover: data.cover } : null);
        if (currentUser) {
          useAuthStore.getState().setAuth({ ...currentUser, cover: data.cover });
        }
        handleCloseModal();
      }
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "System error applying cover");
    } finally {
      setIsApplying(false);
    }
  };

  // Strip leading '@'
  const cleanUsername = decodeURIComponent(usernameParam).replace(/^@/, "");

  useEffect(() => {
    // Check auth session
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/users/${cleanUsername}`);
        if (!res.ok) {
          throw new Error("User not found");
        }
        const data = await res.json();
        setProfileUser(data.user);
        setIsFollowed(data.isFollowed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [cleanUsername]);

  useEffect(() => {
    const fetchTabData = async () => {
      setIsTabLoading(true);
      try {
        if (activeTab === "posts") {
          const res = await fetch(`/api/users/${cleanUsername}/posts`);
          if (res.ok) {
            const data = await res.json();
            setUserPosts(data.posts || []);
          }
        } else if (activeTab === "portfolio") {
          const res = await fetch(`/api/users/${cleanUsername}/portfolio`);
          if (res.ok) {
            const data = await res.json();
            setUserPortfolio(data.projects || []);
          }
        } else if (activeTab === "hubs") {
          const res = await fetch(`/api/users/${cleanUsername}/hubs`);
          if (res.ok) {
            const data = await res.json();
            setUserHubs(data.hubs || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tab data", error);
      } finally {
        setIsTabLoading(false);
      }
    };

    if (profileUser) {
      fetchTabData();
    }
  }, [cleanUsername, activeTab, profileUser]);

  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        if (modalOpen === "followers") {
          const res = await fetch(`/api/users/${cleanUsername}/followers`);
          if (res.ok) {
            const data = await res.json();
            setFollowersList(data.users || []);
          }
        } else if (modalOpen === "following") {
          const res = await fetch(`/api/users/${cleanUsername}/following`);
          if (res.ok) {
            const data = await res.json();
            setFollowingList(data.users || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch follow data", error);
      }
    };

    if (modalOpen) {
      fetchFollowData();
    }
  }, [cleanUsername, modalOpen]);

  if (isLoading) {
    return (
      <div className="profile-layout">
        <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
        <div className="profile-content">
          <LeftSidebar />
          <main className="profile-main flex items-center justify-center">
            <span className="font-chakra text-lg text-[#10B981] animate-pulse">LOADING SYSTEM PROFILE...</span>
          </main>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-layout">
        <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
        <div className="profile-content">
          <LeftSidebar />
          <main className="profile-main flex flex-col items-center justify-center gap-4">
            <span className="font-chakra text-2xl text-red-500">404 // PROFILE NOT FOUND</span>
            <span className="font-inter text-[#C8C7C7]">The user @{cleanUsername} does not exist on Caliber.</span>
            <Link href="/" className="btn-edit-profile mt-4">Return Home</Link>
          </main>
        </div>
      </div>
    );
  }

  // Check if own profile
  const isOwnProfile = currentUser && currentUser.id === profileUser.id;

  // Render initials fallback
  const initials = `${profileUser.firstName[0]}${profileUser.lastName[0]}`.toUpperCase();

  // Combine fetched user data with specified mock data for evaluation
  const bio = profileUser.bio || "No bio available.";
  const role = profileUser.role || "User";
  const location = profileUser.location || "Earth";
  const joinedDate = new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  // Custom stats
  const postsCount = profileUser._count?.posts || 0;
  const followersCount = profileUser._count?.followers || 0;
  const followingCount = profileUser._count?.following || 0;
  const hubsCount = profileUser._count?.hubMembers || 0;

  // Skills
  const SKILLS = profileUser.skills
    ? profileUser.skills.split(",").map(s => s.trim())
    : [];

  // Toggle follows inside modal
  const handleToggleModalFollow = async (userId: string, listType: "followers" | "following") => {
    try {
      const endpoint = `/api/users/id/${userId}/follow`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to follow/unfollow user");
      }

      const data = await res.json();
      const newIsFollowing = data.isFollowing;

      if (listType === "followers") {
        setFollowersList(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: newIsFollowing } : u));
      } else {
        setFollowingList(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: newIsFollowing } : u));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleFollowProfile = async () => {
    if (!profileUser) return;
    try {
      const endpoint = `/api/users/id/${profileUser.id}/follow`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to follow/unfollow user");
      const data = await res.json();
      setIsFollowed(data.isFollowing);
      // Keep the displayed follower count in sync with the follow state.
      const delta = data.isFollowing ? 1 : -1;
      setProfileUser((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count,
                posts: prev._count?.posts || 0,
                followers: Math.max(0, (prev._count?.followers || 0) + delta),
                following: prev._count?.following || 0,
                hubMembers: prev._count?.hubMembers || 0,
              },
            }
          : null
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostInteraction = (
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
      setUserPosts((prev) => prev.filter((post) => post.id !== postId));
      // Optionally decrement posts count if it's the own profile
      if (isOwnProfile && profileUser) {
        setProfileUser((prev) => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            posts: Math.max(0, (prev._count?.posts || 0) - 1),
            followers: prev._count?.followers || 0,
            following: prev._count?.following || 0,
            hubMembers: prev._count?.hubMembers || 0,
          }
        } : null);
      }
      return;
    }
    setUserPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, ...updatedFields } : post
      )
    );
  };

  return (
    <div className="profile-layout">
      {/* Top Navbar */}
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />

      {/* Main Content Body */}
      <div className="profile-content relative">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Center Main Scrollable Panel */}
        <main className="profile-main">
          <div className="profile-container">
            
            {/* SECTION 1 — COVER + AVATAR + IDENTITY */}
            <section className="profile-header-card">
              {/* Cover Photo */}
              <div 
                className="profile-cover"
                style={{
                  background: resolveCoverBg(profileUser.cover)
                }}
              >
                {isOwnProfile && (
                  <button 
                    onClick={() => setIsEditCoverOpen(true)}
                    className="edit-cover-btn" 
                    aria-label="Edit Cover Banner"
                  >
                    Edit Cover
                  </button>
                )}
              </div>

              {/* Identity info area */}
              <div className="profile-identity-section">
                {/* Avatar Overlay */}
                <div className="profile-avatar-container">
                  {profileUser.avatar ? (
                    profileUser.avatar.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileUser.avatar}
                        alt={`${profileUser.firstName} ${profileUser.lastName}`}
                        className="profile-avatar-img"
                      />
                    ) : (
                      <Image
                        src={profileUser.avatar}
                        alt={`${profileUser.firstName} ${profileUser.lastName}`}
                        width={96}
                        height={96}
                        className="profile-avatar-img"
                      />
                    )
                  ) : (
                    <div className="profile-avatar-fallback">{initials}</div>
                  )}
                </div>

                <div className="profile-identity-row">
                  <div className="profile-meta-info">
                    {/* Full Name & Verified Badge */}
                    <div className="profile-name-row">
                      <h1 className="profile-name">{profileUser.firstName} {profileUser.lastName}</h1>
                      {profileUser.isVerified && (
                        <span className="profile-verified-badge" aria-label="Verified user">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Username Handle */}
                    <div className="profile-handle">@{profileUser.username}</div>

                    {/* Role Pill */}
                    <div className="profile-role-tag">{role}</div>

                    {/* Short Bio */}
                    <p className="profile-bio">{bio}</p>

                    {/* Meta details: Joined & Location */}
                    <div className="profile-details-row">
                      <div className="profile-detail-item">
                        {/* Map pin icon */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{location}</span>
                      </div>
                      <div className="profile-detail-item">
                        {/* Calendar icon */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Joined {joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="profile-actions-wrapper">
                    {isOwnProfile ? (
                      <div className="flex gap-2">
                        <Link href="/settings/profile" className="btn-edit-profile">
                          Edit Profile
                        </Link>
                        <button 
                          onClick={async () => {
                            await logout();
                            window.location.href = "/login";
                          }} 
                          className="btn-edit-profile"
                          style={{ borderColor: "rgba(239, 68, 68, 0.5)", color: "rgba(248, 113, 113, 1)" }}
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className={`btn-follow ${isFollowed ? "following" : ""}`}
                          onClick={handleToggleFollowProfile}
                        >
                          {isFollowed ? "Following" : "Follow"}
                        </button>
                        <Link
                          href={`/messages?to=${profileUser.username}`}
                          className="btn-message"
                        >
                          Message
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2 — STATS BAR */}
            <section className="profile-stats-bar">
              <div className="profile-stat-item">
                <span className="profile-stat-value">{postsCount}</span>
                <span className="profile-stat-label">Posts</span>
              </div>
              <div className="profile-stat-item">
                <span 
                  className="profile-stat-value clickable"
                  onClick={() => setModalOpen("followers")}
                >
                  {followersCount}
                </span>
                <span 
                  className="profile-stat-label clickable"
                  onClick={() => setModalOpen("followers")}
                >
                  Followers
                </span>
              </div>
              <div className="profile-stat-item">
                <span 
                  className="profile-stat-value clickable"
                  onClick={() => setModalOpen("following")}
                >
                  {followingCount}
                </span>
                <span 
                  className="profile-stat-label clickable"
                  onClick={() => setModalOpen("following")}
                >
                  Following
                </span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-value">{hubsCount}</span>
                <span className="profile-stat-label">Hubs Joined</span>
              </div>
            </section>

            {/* SECTION 3 — TABS */}
            <section className="profile-tabs-wrapper">
              <button
                className={`profile-tab ${activeTab === "posts" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("posts")}
              >
                Posts
              </button>
              <button
                className={`profile-tab ${activeTab === "portfolio" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("portfolio")}
              >
                Portfolio
              </button>
              <button
                className={`profile-tab ${activeTab === "hubs" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("hubs")}
              >
                Hubs
              </button>
              <button
                className={`profile-tab ${activeTab === "about" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
            </section>

            {/* TAB CONTENTS */}
            <section className="tab-content-area">
              {isTabLoading && (
                <div className="py-8 text-center text-[#10B981] animate-pulse font-chakra">
                  LOADING DATA...
                </div>
              )}
              
              {/* TAB 1: POSTS */}
              {!isTabLoading && activeTab === "posts" && (
                <div className="flex flex-col gap-4">
                  {userPosts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#C8C7C7]">
                      No posts yet.
                    </div>
                  ) : (
                    userPosts.map((post) => {
                      const formattedPost = {
                        ...post,
                        id: post.id,
                        content: post.content,
                        imageUrl: post.imageUrl,
                        author: {
                          id: post.author.id,
                          firstName: post.author.firstName,
                          lastName: post.author.lastName,
                          username: post.author.username,
                          avatar: post.author.avatar,
                          isVerified: !!post.author.isVerified,
                        },
                        likesCount: post.likesCount,
                        commentsCount: post.commentsCount,
                        repostsCount: post.repostsCount,
                        bookmarksCount: post.bookmarksCount,
                        isLiked: post.isLiked,
                        isBookmarked: post.isBookmarked,
                        isReposted: post.isReposted,
                        isFollowing: post.isFollowing,
                      };
                      return (
                        <PostCard 
                          key={formattedPost.id} 
                          {...formattedPost} 
                          onInteraction={handlePostInteraction}
                        />
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: PORTFOLIO */}
              {!isTabLoading && activeTab === "portfolio" && (
                <div className="portfolio-grid">
                  {userPortfolio.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#C8C7C7] col-span-full">
                      No projects added yet.
                    </div>
                  ) : (
                    userPortfolio.map((item) => (
                      <article key={item.id} className="portfolio-card">
                        <div className="portfolio-thumbnail">
                          {/* Gamepad icon placeholder */}
                          <svg className="portfolio-thumbnail-placeholder" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="6" width="20" height="12" rx="3" />
                            <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
                          </svg>
                        </div>
                        <div className="portfolio-card-info">
                          <h3 className="portfolio-card-title">{item.title}</h3>
                          <p className="portfolio-card-desc">{item.description}</p>
                          <div className="portfolio-tags-row">
                            {item.tags.map((tag: string, tIdx: number) => (
                              <span key={tIdx} className="portfolio-tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                  
                  {/* Own profile "+ Add Project" card */}
                  {isOwnProfile && (
                    <button
                      className="add-project-card"
                      aria-label="Add project portfolio item"
                      onClick={() => setIsAddProjectOpen(true)}
                    >
                      <div className="add-project-icon">+</div>
                      <span className="add-project-text">Add Project</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 3: HUBS */}
              {!isTabLoading && activeTab === "hubs" && (
                <div className="flex flex-col gap-8 w-full">
                  {/* Hubs Section */}
                  <div>
                    <h3 className="font-chakra text-xs font-semibold text-[#10B981] tracking-wider mb-4">JOINED HUBS</h3>
                    {userHubs.length === 0 ? (
                      <div className="py-8 text-center text-sm text-[#C8C7C7]">
                        Not a member of any hubs yet.
                      </div>
                    ) : (
                      <div className="hubs-grid">
                        {userHubs.map((hub) => (
                          <article key={hub.id} className="hub-card">
                            <div className="hub-card-header">
                              <div className="hub-icon-circle">
                                {/* Controller icon */}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="6" width="20" height="12" rx="3" />
                                  <path d="M6 12h4M8 10v4" />
                                  <line x1="15" y1="12" x2="15.01" y2="12" />
                                  <line x1="18" y1="10" x2="18.01" y2="10" />
                                </svg>
                              </div>
                              <div className="hub-meta">
                                <h3 className="hub-name">{hub.name}</h3>
                                <span className="hub-members">{hub.memberCount} Members</span>
                              </div>
                            </div>
                            <span className="hub-role-tag">{hub.role}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ABOUT */}
              {activeTab === "about" && (
                <div className="profile-about-column">
                  {/* Bio */}
                  <div>
                    <h3 className="profile-about-section-label">Bio</h3>
                    <p className="profile-bio" style={{ marginTop: 0 }}>{bio}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="profile-about-section-label">Skills</h3>
                    <div className="profile-about-skills-row">
                      {SKILLS.map((skill, idx) => (
                        <span key={idx} className="profile-skill-pill">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h3 className="profile-about-section-label">Experience</h3>
                    {profileUser.experience && Array.isArray(profileUser.experience) && profileUser.experience.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {profileUser.experience.map((exp: { id: string; role: string; company: string; startDate: string; endDate?: string | null; current: boolean; description?: string | null }) => (
                          <div key={exp.id} className="p-4 border border-[#2A313C] rounded bg-[#10141A]/50">
                            <h4 className="text-[#E0E0E0] font-medium text-lg">{exp.role} <span className="text-[#10B981]">@ {exp.company}</span></h4>
                            <p className="text-sm text-[#8E95A3] mt-1 font-chakra tracking-wide">
                              {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                            </p>
                            {exp.description && (
                              <p className="text-sm text-[#C8C7C7] mt-3 whitespace-pre-wrap font-inter leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-inter text-sm text-[#C8C7C7] italic">No experience added yet</p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="profile-about-section-label">Social Connections</h3>
                    {(() => {
                      const links = profileUser.socialLinks && Array.isArray(profileUser.socialLinks)
                        ? profileUser.socialLinks.slice(0, 8)
                        : [];

                      if (links.length === 0) {
                        return <p className="font-inter text-sm text-[#C8C7C7] italic">No social links added yet</p>;
                      }

                      return (
                        <div className="profile-socials-row">
                          {links.map((link: { platform: string; url: string }, idx: number) => (
                            <ProfileSocialBadge key={idx} link={link} />
                          ))}
                        </div>

                      );
                    })()}
                  </div>
                </div>
              )}
            </section>

          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Mobile sidebar drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* FOLLOWERS / FOLLOWING MODALS */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalOpen === "followers" ? "Followers" : "Following"}
              </h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setModalOpen(null)}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-content">
              {(modalOpen === "followers" ? followersList : followingList).map((usr) => (
                <div key={usr.id} className="modal-user-row">
                  <div className="modal-user-info">
                    <div className="modal-user-avatar">
                      {usr.avatar && usr.avatar.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={usr.avatar}
                          alt={usr.name}
                          className="w-full h-full object-cover"
                        />
                      ) : usr.avatar ? (
                        <Image
                          src={usr.avatar}
                          alt={usr.name}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{usr.firstName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="modal-user-names">
                      <span className="modal-user-name">{usr.firstName} {usr.lastName}</span>
                      <span className="modal-user-handle">@{usr.username}</span>
                    </div>
                  </div>
                  <button
                    className={`modal-user-follow-btn ${usr.isFollowing ? "following" : ""}`}
                    onClick={() => handleToggleModalFollow(usr.id, modalOpen)}
                  >
                    {usr.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
              {(modalOpen === "followers" ? followersList : followingList).length === 0 && (
                <div className="py-8 text-center text-sm text-[#C8C7C7]">
                  No users found in this list.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjectOpen && (
        <div className="modal-overlay" onClick={handleCloseAddProject}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#10141A", border: "1px solid #2A313C" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Add Project</h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseAddProject}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-content" style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    className="font-chakra"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}
                  >
                    TITLE
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Project title"
                    className="font-inter"
                    style={{
                      background: "#0A0D12",
                      border: "1px solid #2A313C",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    className="font-chakra"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}
                  >
                    DESCRIPTION
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="What is this project about?"
                    rows={4}
                    className="font-inter"
                    style={{
                      background: "#0A0D12",
                      border: "1px solid #2A313C",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    className="font-chakra"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}
                  >
                    TAGS
                  </label>
                  <input
                    type="text"
                    value={projectTags}
                    onChange={(e) => setProjectTags(e.target.value)}
                    placeholder="Comma-separated, e.g. Unity, 3D, Shader"
                    className="font-inter"
                    style={{
                      background: "#0A0D12",
                      border: "1px solid #2A313C",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    className="font-chakra"
                    style={{ fontSize: "12px", fontWeight: 600, color: "#10B981", letterSpacing: "0.05em" }}
                  >
                    LINK (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    value={projectLink}
                    onChange={(e) => setProjectLink(e.target.value)}
                    placeholder="https://..."
                    className="font-inter"
                    style={{
                      background: "#0A0D12",
                      border: "1px solid #2A313C",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                {projectError && (
                  <div className="font-inter" style={{ color: "#FF5C5C", fontSize: "13px" }}>
                    {projectError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={handleCloseAddProject}
                    disabled={isSavingProject}
                    className="font-chakra"
                    style={{
                      background: "transparent",
                      border: "1px solid #2A313C",
                      borderRadius: "8px",
                      padding: "10px 18px",
                      color: "#C8C7C7",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={isSavingProject}
                    className="font-chakra"
                    style={{
                      background: "#10B981",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 18px",
                      color: "#0A0D12",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: isSavingProject ? "not-allowed" : "pointer",
                      opacity: isSavingProject ? 0.6 : 1,
                    }}
                  >
                    {isSavingProject ? "Saving..." : "Add Project"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cover Modal */}
      <div className={`cover-modal-overlay ${isEditCoverOpen ? "open" : ""}`}>
        <div className="cover-modal-container">
          <div className="cover-modal-header">
            <h3 className="cover-modal-title">Choose Cover</h3>
            <button 
              onClick={() => handleCloseModal()} 
              className="cover-modal-close"
              type="button"
            >
              &times;
            </button>
          </div>

          {/* Tabs */}
          <div className="cover-modal-tabs">
            <button 
              type="button" 
              onClick={() => setActiveCoverTab("presets")}
              className={`cover-modal-tab ${activeCoverTab === "presets" ? "active" : ""}`}
            >
              Presets
            </button>
            <button 
              type="button" 
              onClick={() => setActiveCoverTab("custom")}
              className={`cover-modal-tab ${activeCoverTab === "custom" ? "active" : ""}`}
            >
              Custom
            </button>
          </div>

          {/* Preset Tab Content */}
          {activeCoverTab === "presets" && (
            <div className="cover-modal-presets-scroll">
              {["Dark Gradients", "Emerald/Caliber themed", "Dark Colorful", "Game Dev themed"].map((cat) => (
                <div key={cat} className="mb-4">
                  <div className="cover-preset-category-title">{cat}</div>
                  <div className="cover-preset-grid">
                    {PRESETS.filter(p => p.category === cat).map(preset => (
                      <div 
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          setCustomFile(null);
                          setCustomPreview(null);
                          setUploadError("");
                        }}
                        className={`cover-preset-card ${selectedPreset === preset.id ? "selected" : ""}`}
                        style={{ background: preset.value }}
                      >
                        <div className="cover-preset-card-name">{preset.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center text-xs text-[#C8C7C7]/50 font-inter my-2">
                More presets coming soon
              </div>
            </div>
          )}

          {/* Custom Upload Tab Content */}
          {activeCoverTab === "custom" && (
            <div className="cover-custom-upload-container">
              <div 
                className={`cover-upload-area ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                {customPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customPreview} alt="Cover Preview" className="cover-preview-img" />
                ) : (
                  <>
                    <div className="cover-upload-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="cover-upload-text">Drag and drop your image here</span>
                    <span className="cover-upload-subtext">or</span>
                    <button type="button" className="cover-browse-btn" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>Browse Files</button>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg,image/png,image/webp" 
                  style={{ display: "none" }}
                />
              </div>

              {customPreview && (
                <button 
                  type="button" 
                  onClick={handleRemoveCustom} 
                  className="text-xs text-[#C8C7C7] hover:text-[#10B981] transition-colors"
                >
                  Remove Image
                </button>
              )}

              <div className="cover-requirements-list mt-2">
                <span>&bull; Accepted formats: JPG, PNG, WEBP</span>
                <span>&bull; Recommended size: 1500 &times; 500px</span>
                <span>&bull; Max file size: 5MB</span>
              </div>

              {uploadError && (
                <div className="cover-upload-error mt-2">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="cover-modal-footer">
            <button 
              type="button" 
              onClick={() => handleCloseModal()} 
              className="cover-btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleApplyCover} 
              disabled={isApplying || (!selectedPreset && !customFile)}
              className="cover-btn-apply"
            >
              {isApplying ? "APPLYING..." : "APPLY COVER"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
