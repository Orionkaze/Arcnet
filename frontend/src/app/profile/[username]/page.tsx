"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import PostCard from "@/components/home/PostCard";
import "../profile.css";

// Mock followers list for modal
const MOCK_USERS = [
  { id: "1", name: "Maya 3D", username: "maya_3d", handle: "@maya.artist.ANET", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=maya", isFollowing: false },
  { id: "2", name: "Deepak", username: "deepak", handle: "@deepak.founder.ANET", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=deepak", isFollowing: true },
  { id: "3", name: "Sarah Dev", username: "sarah_gamedev", handle: "@sarah.dev.ANET", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sarah", isFollowing: false },
  { id: "4", name: "Rohan Animator", username: "rohan_anim", handle: "@rohan.anim.ANET", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rohan", isFollowing: true },
];

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { user: currentUser, checkAuth } = useAuthStore();
  const resolvedParams = React.use(params);
  const usernameParam = resolvedParams.username;

  // Layout drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // States
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "portfolio" | "hubs" | "about">("posts");
  const [isFollowed, setIsFollowed] = useState(false);
  const [modalOpen, setModalOpen] = useState<"followers" | "following" | null>(null);
  const [followersList, setFollowersList] = useState(MOCK_USERS);
  const [followingList, setFollowingList] = useState(MOCK_USERS.filter(u => u.isFollowing));

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
          // If user doesn't exist in DB but it's our requested mock user, simulate it
          if (cleanUsername.toLowerCase() === "arcavon_akshit" || cleanUsername.toLowerCase() === "arcavon-akshit") {
            setProfileUser({
              id: "mock-id-arcavon",
              firstName: "Arcavon",
              lastName: "Akshit",
              username: "Arcavon_Akshit",
              avatar: null,
              isVerified: true,
              createdAt: "2024-01-01T00:00:00.000Z",
            });
            setIsLoading(false);
            return;
          }
          throw new Error("User not found");
        }
        const data = await res.json();
        setProfileUser(data.user);
      } catch (err: any) {
        // Fallback for demo purposes if it is Arcavon Akshit
        if (cleanUsername.toLowerCase() === "arcavon_akshit" || cleanUsername.toLowerCase() === "arcavon-akshit") {
          setProfileUser({
            id: "mock-id-arcavon",
            firstName: "Arcavon",
            lastName: "Akshit",
            username: "Arcavon_Akshit",
            avatar: null,
            isVerified: true,
            createdAt: "2024-01-01T00:00:00.000Z",
          });
        } else {
          setError(err.message || "Failed to load user profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [cleanUsername]);

  if (isLoading) {
    return (
      <div className="profile-layout">
        <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
        <div className="profile-content">
          <LeftSidebar />
          <main className="profile-main flex items-center justify-center">
            <span className="font-chakra text-lg text-[#00EAFF] animate-pulse">LOADING SYSTEM PROFILE...</span>
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
            <span className="font-inter text-[#C8C7C7]">The user @{cleanUsername} does not exist on ARCNET.</span>
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
  const isMockUser = profileUser.username.toLowerCase() === "arcavon_akshit";
  const bio = isMockUser 
    ? "Game developer and tech founder. Building ARCNET — the hub for game creators worldwide."
    : "Building the future of gaming on ARCNET.";
  const role = isMockUser ? "Game Developer" : "Game Creator";
  const location = isMockUser ? "India" : "Global";
  const joinedDate = isMockUser 
    ? "January 2024"
    : new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  // Custom stats
  const postsCount = isMockUser ? 48 : 12;
  const followersCount = isMockUser ? "1.2K" : "0";
  const followingCount = isMockUser ? "340" : "0";
  const hubsCount = isMockUser ? 6 : 2;

  // Mock Post List
  const MOCK_POSTS = [
    {
      username: profileUser.username,
      handle: isMockUser ? "@Tech.Hero.ANET" : `@${profileUser.username}.ANET`,
      text: "Today I made this asset using all of my knowledge till now. It felt really good finishing it even after all the problem. See it in the image below",
      isFollowing: isFollowed,
      hasImage: true,
      likes: 42,
      comments: 8,
      shares: 5,
      reposts: 12,
      avatar: profileUser.avatar
    },
    {
      username: profileUser.username,
      handle: isMockUser ? "@Tech.Hero.ANET" : `@${profileUser.username}.ANET`,
      text: "Just released a patch update for my platformer! Added double jumping and fixed high-resolution camera tracking issues. Check out the project tab for the gameplay build link.",
      isFollowing: isFollowed,
      hasImage: false,
      likes: 18,
      comments: 3,
      shares: 1,
      reposts: 2,
      avatar: profileUser.avatar
    },
    {
      username: profileUser.username,
      handle: isMockUser ? "@Tech.Hero.ANET" : `@${profileUser.username}.ANET`,
      text: "Had a great brainstorming session with developers from the Game Developers Hub. ARCNET is really bringing game creators together. The AVGC sector in India is about to explode!",
      isFollowing: isFollowed,
      hasImage: false,
      likes: 29,
      comments: 7,
      shares: 4,
      reposts: 8,
      avatar: profileUser.avatar
    }
  ];

  // Portfolio items
  const PORTFOLIO_ITEMS = [
    { title: "Project Neon", desc: "Cyberpunk first-person shooter prototype built in Unreal Engine 5.", tags: ["UE5", "C++", "3D"] },
    { title: "Space Odyssey", desc: "VR space flight simulator with realistic physics and orbital mechanics.", tags: ["Unity", "C#", "VR"] },
    { title: "Retro Quest", desc: "A pixel-art 2D platformer for retro retro console lovers.", tags: ["Unity", "C#", "2D"] },
    { title: "Medieval Realms", desc: "Multiplayer strategy game featuring procedurally generated terrain.", tags: ["Blender", "C#", "Multi"] }
  ];

  // Hubs items
  const HUBS_ITEMS = [
    { name: "Game Developers", members: "12.4K Members", role: "Moderator" },
    { name: "2D / 3D Artists", members: "8.2K Members", role: "Member" },
    { name: "Game Jams", members: "5.6K Members", role: "Member" },
    { name: "Find Team", members: "4.1K Members", role: "Moderator" },
    { name: "Animators", members: "3.2K Members", role: "Member" },
    { name: "Storywriters", members: "1.8K Members", role: "Member" }
  ];

  // Skills
  const SKILLS = isMockUser 
    ? ["Unity", "Unreal Engine", "Blender", "C#", "Game Design", "3D Modelling"]
    : ["Unity", "C#", "Game Design"];

  // Toggle follows inside modal
  const handleToggleModalFollow = (userId: string, listType: "followers" | "following") => {
    if (listType === "followers") {
      setFollowersList(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u));
      // Sync following list
      const clickedUser = followersList.find(u => u.id === userId);
      if (clickedUser) {
        if (!clickedUser.isFollowing) {
          setFollowingList(prev => [...prev, { ...clickedUser, isFollowing: true }]);
        } else {
          setFollowingList(prev => prev.filter(u => u.id !== userId));
        }
      }
    } else {
      setFollowingList(prev => prev.filter(u => u.id !== userId));
      setFollowersList(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: false } : u));
    }
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
              <div className="profile-cover">
                <div className="w-full h-full bg-[linear-gradient(135deg,#10141A_0%,#1A2534_100%)] opacity-80" />
                {isOwnProfile && (
                  <button className="edit-cover-btn" aria-label="Edit Cover Banner">
                    Edit Cover
                  </button>
                )}
              </div>

              {/* Identity info area */}
              <div className="profile-identity-section">
                {/* Avatar Overlay */}
                <div className="profile-avatar-container">
                  {profileUser.avatar ? (
                    <Image
                      src={profileUser.avatar}
                      alt={`${profileUser.firstName} ${profileUser.lastName}`}
                      width={96}
                      height={96}
                      className="profile-avatar-img"
                    />
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
                      <Link href="/settings/profile" className="btn-edit-profile">
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        <button
                          className={`btn-follow ${isFollowed ? "following" : ""}`}
                          onClick={() => setIsFollowed(!isFollowed)}
                        >
                          {isFollowed ? "Following" : "Follow"}
                        </button>
                        <button className="btn-message">
                          Message
                        </button>
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
              
              {/* TAB 1: POSTS */}
              {activeTab === "posts" && (
                <div className="profile-posts-list">
                  {MOCK_POSTS.map((post, idx) => (
                    <PostCard key={idx} {...post} />
                  ))}
                </div>
              )}

              {/* TAB 2: PORTFOLIO */}
              {activeTab === "portfolio" && (
                <div className="portfolio-grid">
                  {PORTFOLIO_ITEMS.map((item, idx) => (
                    <article key={idx} className="portfolio-card">
                      <div className="portfolio-thumbnail">
                        {/* Gamepad icon placeholder */}
                        <svg className="portfolio-thumbnail-placeholder" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="6" width="20" height="12" rx="3" />
                          <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
                        </svg>
                      </div>
                      <div className="portfolio-card-info">
                        <h3 className="portfolio-card-title">{item.title}</h3>
                        <p className="portfolio-card-desc">{item.desc}</p>
                        <div className="portfolio-tags-row">
                          {item.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="portfolio-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                  
                  {/* Own profile "+ Add Project" card */}
                  {isOwnProfile && (
                    <button className="add-project-card" aria-label="Add project portfolio item">
                      <div className="add-project-icon">+</div>
                      <span className="add-project-text">Add Project</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 3: HUBS */}
              {activeTab === "hubs" && (
                <div className="hubs-grid">
                  {HUBS_ITEMS.map((hub, idx) => (
                    <article key={idx} className="hub-card">
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
                          <span className="hub-members">{hub.members}</span>
                        </div>
                      </div>
                      <span className="hub-role-tag">{hub.role}</span>
                    </article>
                  ))}
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
                    <div className="profile-exp-item">
                      <h4 className="profile-exp-role">Lead Game Developer</h4>
                      <span className="profile-exp-company-date">Arcavon Studios &bull; Jan 2024 - Present</span>
                    </div>
                    <div className="profile-exp-item">
                      <h4 className="profile-exp-role">Indie Game Creator</h4>
                      <span className="profile-exp-company-date">Self Employed &bull; 2020 - 2023</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="profile-about-section-label">Social Connections</h3>
                    <div className="profile-socials-row">
                      <a href="#" className="profile-social-link" aria-label="Twitter X profile">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                      <a href="#" className="profile-social-link" aria-label="GitHub profile">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                      </a>
                      <a href="#" className="profile-social-link" aria-label="LinkedIn profile">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                      <a href="#" className="profile-social-link" aria-label="Portfolio website">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </a>
                    </div>
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
                      <Image
                        src={usr.avatar}
                        alt={usr.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="modal-user-names">
                      <span className="modal-user-name">{usr.name}</span>
                      <span className="modal-user-handle">{usr.handle}</span>
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
    </div>
  );
}
