"use client";

import { useState } from "react";
import "./home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import PostCard from "@/components/home/PostCard";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";

const MOCK_POSTS = [
  {
    username: "Arcavon_Akshit",
    handle: "@Tech.Hero.ANET",
    text: "Today I made this asset using all of my knowledge till now. It felt really good finishing it even after all the problem. See it in the image below",
    isFollowing: true,
    hasImage: true,
    likes: 42,
    comments: 8,
    shares: 5,
    reposts: 12,
  },
  {
    username: "Deepak",
    handle: "Founder & Chairman @Arcavon",
    text: "Arcavon became a Unicorn today, lessgo",
    isFollowing: false,
    hasImage: false,
    likes: 256,
    comments: 34,
    shares: 89,
    reposts: 67,
  },
  {
    username: "Maya_3D",
    handle: "@maya.artist.ANET",
    text: "Just finished rigging this character for our upcoming indie horror game. The bone structure took forever but the result is so satisfying. Can't wait to show the full animation cycle next week!",
    isFollowing: false,
    hasImage: true,
    likes: 128,
    comments: 22,
    shares: 15,
    reposts: 31,
  },
];

import Link from "next/link";

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />
        <main className="center-feed">
          {MOCK_POSTS.map((post, index) => (
            <PostCard key={index} {...post} />
          ))}
        </main>
        <RightPanel />

        {/* Floating Grid Menu Button */}
        <div className="fixed top-[72px] right-6 z-50">
          <button 
            className="w-9 h-9 rounded-full bg-[#10141A] border-2 border-[#00EAFF] flex items-center justify-center hover:bg-[rgba(0,234,255,0.1)] transition-colors cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00EAFF"
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
        </div>
      </div>
      <MobileBottomNav />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
