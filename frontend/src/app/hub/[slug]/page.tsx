"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/home/Navbar";
import PostCard from "@/components/home/PostCard";
import PostSkeleton from "@/components/home/PostSkeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { io, Socket } from "socket.io-client";
import "../../home.css";

interface Channel {
  id: string;
  name: string;
  hubId: string;
  createdAt: string;
}

interface MessageAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  isVerified: boolean;
}

interface MessageReaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface Message {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  replyToId: string | null;
  createdAt: string;
  author: MessageAuthor;
  replyTo?: {
    id: string;
    content: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      username: string | null;
      avatar: string | null;
    };
  } | null;
  reactions: MessageReaction[];
}

interface HubMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    isVerified: boolean;
    lastSeen: string;
    isOnline: boolean;
  };
}

interface HubData {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  onlineCount: number;
  isPrivate?: boolean;
  joinCode?: string | null;
  allowMembersToInvite?: boolean;
  channels: Channel[];
  joined: boolean;
  userRole: string | null;
  moderators: {
    id: string;
    role: string;
    user: MessageAuthor;
  }[];
}

interface PostType {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  author: MessageAuthor;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
  isFollowing: boolean;
  hub?: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export default function HubPage() {
  const { slug } = useParams() as { slug: string };
  const { user } = useAuthStore();

  // Navigation / views
  const [viewMode, setViewMode] = useState<"chat" | "feed">("chat");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hub metadata
  const [hub, setHub] = useState<HubData | null>(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Messages (Chat View)
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Private-hub join-request gate state
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinRequestLoading, setJoinRequestLoading] = useState(false);
  const [joinRequestFeedback, setJoinRequestFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Emoji picker for the chat input
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

  // Show a transient in-UI toast (~3s)
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Request access to a private hub via join code
  const handleRequestToJoin = async () => {
    if (!user) {
      showToast("Please log in to request access.");
      return;
    }
    const code = joinCodeInput.trim();
    if (!code) {
      setJoinRequestFeedback({ type: "error", text: "Enter a join code to request access." });
      return;
    }
    setJoinRequestLoading(true);
    setJoinRequestFeedback(null);
    try {
      const res = await fetch("/api/hubs/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoinRequestFeedback({ type: "success", text: "Request sent — you'll get access once approved." });
        setJoinCodeInput("");
      } else {
        setJoinRequestFeedback({ type: "error", text: data.error || "Failed to send request." });
      }
    } catch {
      setJoinRequestFeedback({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setJoinRequestLoading(false);
    }
  };
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Community Feed View
  const [posts, setPosts] = useState<PostType[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [postingNewPost, setPostingNewPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Members panel (Right Side)
  const [members, setMembers] = useState<HubMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersSearch, setMembersSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(true);

  // Manage Requests Modal
  interface HubJoinRequest {
    id: string;
    status: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      avatar: string | null;
    };
  }
  const [isManageRequestsOpen, setIsManageRequestsOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState<HubJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Hub Details & Group Settings
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch join requests when manage modal opens
  useEffect(() => {
    if (!isManageRequestsOpen || !hub || hub.userRole !== "owner") return;

    async function fetchRequests() {
      setRequestsLoading(true);
      try {
        const res = await fetch(`/api/hubs/${hub?.slug}/requests`);
        if (res.ok) {
          const data = await res.json();
          setJoinRequests(data.requests || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRequestsLoading(false);
      }
    }
    fetchRequests();
  }, [isManageRequestsOpen, hub]);

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/hubs/${hub?.slug}/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (action === "approve") {
          setHub((prev) => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Emoji picker states
  const [showEmojiPickerForId, setShowEmojiPickerForId] = useState<string | null>(null);

  // Scroll and typing references
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emojiList = ["👍", "❤️", "🔥", "🚀", "😂", "👏", "😮", "🎉"];

  const handleToggleSettings = async (allow: boolean) => {
    if (!hub) return;
    setUpdatingSettings(true);
    try {
      const res = await fetch(`/api/hubs/${hub.slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowMembersToInvite: allow }),
      });
      if (res.ok) {
        setHub({ ...hub, allowMembersToInvite: allow });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleMemberAction = async (targetUserId: string, action: "promote" | "demote" | "kick") => {
    if (!hub) return;
    if (action === "kick") {
      if (!confirm("Are you sure you want to remove this user from the hub?")) return;
    }
    setActionLoading(`${action}-${targetUserId}`);
    try {
      const res = await fetch(`/api/hubs/${hub.slug}/members/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Refresh members
        const membersRes = await fetch(`/api/hubs/${slug}/members?onlineOnly=${onlineOnly ? "true" : "false"}&search=${membersSearch}`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }
        if (action === "kick") {
          setHub((prev) => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev);
        }
      } else {
        const data = await res.json();
        showToast(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(error);
      showToast("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  // 1. Fetch Hub metadata & channels on load
  useEffect(() => {
    async function fetchHubMetadata() {
      setHubLoading(true);
      try {
        const res = await fetch(`/api/hubs/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            notFound();
          }
          throw new Error("Failed to load hub metadata");
        }
        const data = await res.json();
        setHub(data.hub);
        setChannels(data.hub.channels || []);
        if (data.hub.channels && data.hub.channels.length > 0) {
          setSelectedChannel(data.hub.channels[0]);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setHubLoading(false);
      }
    }
    fetchHubMetadata();
  }, [slug]);

  // 2. Fetch Chat messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return;

    async function fetchChannelMessages() {
      setChatLoading(true);
      try {
        const res = await fetch(`/api/channels/${selectedChannel?.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setChatLoading(false);
        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          }
        }, 100);
      }
    }

    fetchChannelMessages();
  }, [selectedChannel]);

  // 3. Socket.io Connection & Presence
  useEffect(() => {
    if (!user) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("identify", { userId: user.id });
      if (hub) {
        socket.emit("join_hub", hub.id);
      }
    });

    socket.on("online_users", (userIds: string[]) => {
      setMembers((prev) =>
        prev.map((m) =>
          userIds.includes(m.user.id) ? { ...m, user: { ...m.user, isOnline: true } } : m
        )
      );
    });

    socket.on("user_online", (userId: string) => {
      setMembers((prev) =>
        prev.map((m) => (m.user.id === userId ? { ...m, user: { ...m.user, isOnline: true } } : m))
      );
    });

    socket.on("user_offline", (userId: string) => {
      setMembers((prev) =>
        prev.map((m) => (m.user.id === userId ? { ...m, user: { ...m.user, isOnline: false } } : m))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user, hub]);

  // 4. Socket.io Channel Subscription & Real-time Messages
  useEffect(() => {
    if (!selectedChannel || !socketRef.current) return;

    const socket = socketRef.current;
    socket.emit("join_channel", selectedChannel.id);

    const handleNewMessage = (newMsg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate appending if we optimistically added it
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        
        // Auto scroll to bottom if already near the bottom
        setTimeout(() => {
          const container = chatContainerRef.current;
          if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            if (isNearBottom) {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 50);
        
        return [...prev, newMsg];
      });
    };

    socket.on("new_message", handleNewMessage);

    // Typing indicators (Private only)
    const handleTyping = ({ username }: { userId: string, username: string }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) return [...prev, username];
        return prev;
      });
    };

    const handleStopTyping = ({ username }: { userId: string, username: string }) => {
      if (!username) return; // defensive check
      setTypingUsers((prev) => prev.filter((name) => name !== username));
    };

    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.emit("leave_channel", selectedChannel.id);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
    };
  }, [selectedChannel]);

  // 4. Fetch community feed posts when tab is changed to feed
  useEffect(() => {
    if (viewMode !== "feed") return;

    async function fetchHubPosts() {
      setFeedLoading(true);
      try {
        const res = await fetch(`/api/hubs/${slug}/posts?page=1&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setFeedLoading(false);
      }
    }

    fetchHubPosts();
  }, [slug, viewMode]);

  // 5. Fetch members when side panel is open/search query changes
  useEffect(() => {
    if (!hub) return;

    async function fetchHubMembers() {
      setMembersLoading(true);
      try {
        const query = new URLSearchParams({
          search: membersSearch,
          online: onlineOnly ? "true" : "false",
          limit: "50",
        });
        const res = await fetch(`/api/hubs/${slug}/members?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setMembersLoading(false);
      }
    }

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchHubMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [slug, hub, membersSearch, onlineOnly]);

  // Monitor chat scrolling to auto scroll vs show "jump to bottom" button
  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const threshold = 150; // pixels from bottom
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsScrolledToBottom(isAtBottom);
  };

  // Join or leave hub toggle
  const handleJoinToggle = async () => {
    if (!user) {
      showToast("Please log in to join hubs.");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`/api/hubs/${slug}/join`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setHub((prev) => prev ? { ...prev, joined: data.joined, memberCount: data.memberCount } : null);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setJoining(false);
    }
  };

  // When message text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    
    // Only emit typing for Private Hubs as requested
    if (hub?.isPrivate && socketRef.current && selectedChannel && user) {
      socketRef.current.emit("typing", { channelId: selectedChannel.id, userId: user.id, username: user.firstName });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stop_typing", { channelId: selectedChannel.id, userId: user.id, username: user.firstName });
      }, 1500);
    }
  };

  // Send a chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChannel || !hub?.joined) return;

    const text = messageText.trim();
    if (!text) return;

    if (text.length > 1000) {
      showToast("Message cannot exceed 1000 characters");
      return;
    }

    setMessageText("");
    const replyId = replyingTo?.id || null;
    setReplyingTo(null);

    // Stop typing immediately when sending
    if (hub?.isPrivate && socketRef.current && user) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit("stop_typing", { channelId: selectedChannel.id, userId: user.id, username: user.firstName });
    }

    // Optimistic message append
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
      id: tempId,
      content: text,
      channelId: selectedChannel.id,
      authorId: user.id,
      replyToId: replyId,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified || false,
      },
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        author: {
          id: replyingTo.author.id,
          firstName: replyingTo.author.firstName,
          lastName: replyingTo.author.lastName,
          username: replyingTo.author.username,
          avatar: replyingTo.author.avatar,
        }
      } : null,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch(`/api/channels/${selectedChannel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, replyToId: replyId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429) {
          setRateLimitError(errData.error || "Rate limit reached. Try again later.");
          setTimeout(() => setRateLimitError(null), 5000);
        } else {
          showToast(errData.error || "Failed to send message");
        }
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      const data = await res.json();
      // Replace optimistic message with actual db message, but check if the socket beat us to it
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) {
          // Socket already added the real message, just remove the temp one
          return prev.filter((m) => m.id !== tempId);
        }
        // Otherwise replace the temp one with the real one
        return prev.map((m) => (m.id === tempId ? data.message : m));
      });
    } catch (err) {
      console.warn(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Toggle emoji reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    setShowEmojiPickerForId(null);

    // Optimistic reaction toggle
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;

        const alreadyReacted = m.reactions.find((r) => r.userId === user.id && r.emoji === emoji);
        let updatedReactions = [...m.reactions];

        if (alreadyReacted) {
          updatedReactions = updatedReactions.filter((r) => r.id !== alreadyReacted.id);
        } else {
          updatedReactions.push({
            id: Math.random().toString(),
            emoji,
            messageId,
            userId: user.id,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username || "",
            },
          });
        }

        return { ...m, reactions: updatedReactions };
      })
    );

    try {
      const res = await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Handle Create Post in Community Feed
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hub) return;

    const contentText = newPostContent.trim();
    if (!contentText) return;

    setPostingNewPost(true);
    setPostError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentText,
          imageUrl: newPostImageUrl.trim() || null,
          hubId: hub.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create post");
      }

      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setNewPostContent("");
      setNewPostImageUrl("");
    } catch (err) {
      const error = err as Error;
      setPostError(error.message || "Something went wrong. Please try again.");
    } finally {
      setPostingNewPost(false);
    }
  };

  const handlePostInteractionUpdate = (postId: string, updatedFields: Partial<PostType>) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, ...updatedFields } : post
      )
    );
  };

  // Date Header formatting for Chat
  const getFormattedDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <div className="home-layout flex flex-col h-screen w-screen overflow-hidden bg-[#10141A]">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />

      {/* Global in-UI toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#00EAFF] text-[#10141A] font-chakra font-bold text-xs py-2 px-4 rounded-md shadow-[0_0_15px_rgba(0,234,255,0.4)] z-[200] animate-fade-in">
          {toast}
        </div>
      )}

      {hubLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#00EAFF] font-chakra mt-14">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00EAFF] mb-4"></div>
          Loading ARCNET Hub...
        </div>
      ) : !hub ? (
        <div className="flex-grow flex items-center justify-center text-white mt-14">
          Hub not found.
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden mt-14 relative">
          
          {/* COLUMN 1: LEFT SIDEBAR (Hub Info, Channels, Join/Leave) */}
          <aside className="w-[260px] min-w-[260px] border-r border-[#2A313C] bg-[#10141A] p-4 flex flex-col justify-between select-none h-full">
            <div className="flex flex-col overflow-y-auto space-y-4 pr-1">
              
              {/* Hub Meta Card */}
              <div className="p-3 bg-[#161c24] border border-[#2A313C] rounded-lg relative">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{hub.icon}</span>
                  <div>
                    <h2 
                      className="font-chakra font-bold text-base text-white tracking-wider cursor-pointer hover:text-[#00EAFF] transition-colors flex items-center gap-1.5"
                      onClick={() => setIsDetailsOpen(true)}
                      title="View Hub Details"
                    >
                      {hub.name}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </h2>
                    <span className="text-[10px] font-chakra text-[#00EAFF] uppercase tracking-widest">
                      {hub.isPrivate ? "Private Hub" : "Public Hub"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#C8C7C7] mt-2 leading-relaxed font-inter">
                  {hub.description}
                </p>

                {/* Member Metrics */}
                <div className="flex items-center gap-4 mt-3 text-[11px] font-chakra border-t border-[#2A313C]/50 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00E676]"></span>
                    <span className="text-white font-bold">{hub.onlineCount}</span>
                    <span className="text-[#C8C7C7]">Online</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C8C7C7]/50"></span>
                    <span className="text-white font-bold">{hub.memberCount}</span>
                    <span className="text-[#C8C7C7]">Members</span>
                  </div>
                </div>
              </div>

              {/* View Selector (Chat vs Community Feed) */}
              <div className="grid grid-cols-2 gap-2 bg-[#161c24]/50 p-1 rounded-lg border border-[#2A313C]/50">
                <button
                  onClick={() => setViewMode("chat")}
                  className={`py-1.5 text-xs font-chakra font-bold rounded uppercase transition-all tracking-wider ${
                    viewMode === "chat"
                      ? "bg-[#00EAFF] text-[#10141A] shadow-[0_0_8px_rgba(0,234,255,0.3)]"
                      : "text-[#C8C7C7] hover:text-white"
                  }`}
                >
                  Chatroom
                </button>
                <button
                  onClick={() => setViewMode("feed")}
                  className={`py-1.5 text-xs font-chakra font-bold rounded uppercase transition-all tracking-wider ${
                    viewMode === "feed"
                      ? "bg-[#00EAFF] text-[#10141A] shadow-[0_0_8px_rgba(0,234,255,0.3)]"
                      : "text-[#C8C7C7] hover:text-white"
                  }`}
                >
                  Feed
                </button>
              </div>

              {/* Channels List */}
              <div className="flex flex-col">
                <span className="font-chakra text-[10px] text-orange-500 uppercase tracking-widest font-bold mb-2 pl-1.5">
                  Channels
                </span>
                <div className="space-y-0.5">
                  {channels.map((chan) => (
                    <button
                      key={chan.id}
                      onClick={() => {
                        setSelectedChannel(chan);
                        setViewMode("chat");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-xs transition-all font-inter border-l-2 ${
                        selectedChannel?.id === chan.id && viewMode === "chat"
                          ? "bg-cyan-950/20 text-[#00EAFF] border-[#00EAFF]"
                          : "text-[#C8C7C7] border-transparent hover:bg-[#161c24]/50 hover:text-white"
                      }`}
                    >
                      <span className="text-[#00EAFF]/70 font-chakra">#</span>
                      <span className="truncate">{chan.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Join/Leave trigger */}
            <div className="border-t border-[#2A313C] pt-3">
              {user ? (
                <button
                  onClick={handleJoinToggle}
                  disabled={joining}
                  className={`w-full py-2.5 rounded font-chakra font-bold text-xs uppercase tracking-wider transition-all border ${
                    hub.joined
                      ? "bg-transparent text-[#FF4D4D] border-[#FF4D4D]/40 hover:bg-[#FF4D4D]/10 hover:border-[#FF4D4D]"
                      : "bg-[#00EAFF] text-[#10141A] border-[#00EAFF] hover:bg-[#00d0e0] shadow-[0_0_10px_rgba(0,234,255,0.25)]"
                  }`}
                >
                  {joining ? "Processing..." : hub.joined ? "Leave Hub" : "Join Hub"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 rounded bg-transparent border border-[#00EAFF] text-[#00EAFF] font-chakra font-bold text-xs uppercase tracking-wider hover:bg-[#00EAFF]/10 transition-all"
                >
                  Login to Join
                </Link>
              )}
            </div>
          </aside>

          {/* COLUMN 2: CENTER PANE (Chatroom or Feed) */}
          <main className="flex-1 flex flex-col bg-[#10141A] h-full overflow-hidden">
            
            {/* View Header */}
            <header className="h-[56px] border-b border-[#2A313C] px-4 flex items-center justify-between flex-shrink-0 select-none bg-[#10141A]">
              <div className="flex items-center gap-2">
                <span className="text-[#00EAFF] font-chakra text-lg">#</span>
                <h1 className="font-chakra font-bold text-sm text-white tracking-wide uppercase">
                  {viewMode === "chat" ? selectedChannel?.name || "chat" : `${hub.name} Feed`}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {hub.userRole === "owner" && (
                  <button
                    onClick={() => setIsManageRequestsOpen(true)}
                    className="p-1.5 px-3 rounded border border-[#00EAFF] text-[#00EAFF] hover:bg-[#00EAFF]/10 text-xs font-chakra font-bold uppercase tracking-wider transition-all"
                  >
                    Manage Requests
                  </button>
                )}
                {/* Members Panel toggle */}
                <button
                  onClick={() => setShowMembersPanel(!showMembersPanel)}
                  className={`p-2 rounded text-[#C8C7C7] hover:text-white transition-all cursor-pointer ${
                    showMembersPanel ? "text-[#00EAFF]" : ""
                  }`}
                  title="Toggle Member Panel"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Check Privacy Access */}
            {hub.isPrivate && !hub.joined ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#10141A]">
                <div className="w-16 h-16 rounded-full bg-[#161c24] border border-[#2A313C] flex items-center justify-center shadow-lg mb-4 text-3xl">
                  🔒
                </div>
                <h2 className="font-chakra font-bold text-xl text-white mb-2 uppercase tracking-widest">
                  Private Hub
                </h2>
                <p className="font-inter text-sm text-[#C8C7C7] max-w-sm leading-relaxed mb-6">
                  You need to be a member to view messages, channels, and feed in this hub. Enter the join code below to request access.
                </p>

                {/* Join-code request affordance */}
                <div className="w-full max-w-sm flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRequestToJoin();
                        }
                      }}
                      placeholder="Enter join code"
                      className="flex-1 bg-[#161c24] border border-[#2A313C] text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] font-chakra tracking-[0.15em] uppercase text-center placeholder:tracking-normal placeholder:normal-case"
                    />
                    <button
                      onClick={handleRequestToJoin}
                      disabled={joinRequestLoading}
                      className="px-4 py-2.5 bg-[#00EAFF] text-[#10141A] font-chakra font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#00d0e0] shadow-[0_0_10px_rgba(0,234,255,0.25)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {joinRequestLoading ? "Sending..." : "Request to Join"}
                    </button>
                  </div>
                  {joinRequestFeedback && (
                    <p
                      className={`text-xs font-chakra ${
                        joinRequestFeedback.type === "success" ? "text-[#00E676]" : "text-[#FF4D4D]"
                      }`}
                    >
                      {joinRequestFeedback.type === "success" ? "✓ " : "⚠️ "}
                      {joinRequestFeedback.text}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* CHATROOM SECTION */}
                {viewMode === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                
                {/* rate limit notification toast */}
                {rateLimitError && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#FF4D4D] text-[#10141A] font-chakra font-bold text-xs py-2 px-4 rounded-md shadow-[0_0_15px_rgba(255,77,77,0.4)] z-30 animate-pulse">
                    ⚠️ {rateLimitError}
                  </div>
                )}

                {/* Local Pinned Message banner */}
                {pinnedMessage && (
                  <div className="bg-[#161c24] border-b border-[#2A313C] px-4 py-2 flex items-center justify-between text-xs font-inter z-10 flex-shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#00EAFF]">📌</span>
                      <span className="text-[#C8C7C7] truncate">
                        <strong>@{pinnedMessage.author.username}</strong>: {pinnedMessage.content}
                      </span>
                    </div>
                    <button
                      onClick={() => setPinnedMessage(null)}
                      className="text-[#C8C7C7] hover:text-[#FF4D4D] font-chakra text-[10px] tracking-wider uppercase font-bold pl-3"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Messages Scroller */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 relative min-h-0"
                >
                  {chatLoading ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#C8C7C7] font-chakra">
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#C8C7C7] px-6 select-none">
                      <span className="text-4xl mb-2">💬</span>
                      <h3 className="font-chakra font-bold text-sm text-white mb-1">
                        Welcome to #{selectedChannel?.name}!
                      </h3>
                      <p className="text-xs max-w-sm">
                        This channel is quiet. Be the first to start a conversation here!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        // Check if we need to insert a date divider
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const isNewDay = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                        return (
                          <div key={msg.id} className="space-y-2">
                            
                            {/* Date divider */}
                            {isNewDay && (
                              <div className="flex items-center gap-2 py-3 select-none">
                                <div className="flex-1 h-[1px] bg-[#2A313C]/40"></div>
                                <span className="font-chakra text-[10px] text-[#C8C7C7] uppercase tracking-wider px-2 bg-[#10141A]">
                                  {getFormattedDateHeader(msg.createdAt)}
                                </span>
                                <div className="flex-1 h-[1px] bg-[#2A313C]/40"></div>
                              </div>
                            )}

                            {/* Single Message Wrapper */}
                            <div className="group flex gap-3 hover:bg-[#161c24]/30 p-1.5 rounded-lg transition-colors relative">
                              
                              {/* Avatar */}
                              {msg.author.username ? (
                                <Link
                                  href={`/profile/${msg.author.username}`}
                                  className="w-8 h-8 rounded-full bg-[#2A313C] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs select-none hover:ring-2 hover:ring-[#00EAFF] transition-all"
                                >
                                  {msg.author.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={msg.author.avatar}
                                      alt={msg.author.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    msg.author.firstName.charAt(0).toUpperCase()
                                  )}
                                </Link>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#2A313C] overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs select-none">
                                  {msg.author.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={msg.author.avatar}
                                      alt={msg.author.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    msg.author.firstName.charAt(0).toUpperCase()
                                  )}
                                </div>
                              )}

                              {/* Message Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 select-none">
                                  {msg.author.username ? (
                                    <Link
                                      href={`/profile/${msg.author.username}`}
                                      className="font-inter font-bold text-xs text-white hover:underline cursor-pointer"
                                    >
                                      {msg.author.firstName} {msg.author.lastName}
                                    </Link>
                                  ) : (
                                    <span className="font-inter font-bold text-xs text-white">
                                      {msg.author.firstName} {msg.author.lastName}
                                    </span>
                                  )}
                                  {msg.author.isVerified && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#00EAFF">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                  )}
                                  <span className="text-[10px] text-[#C8C7C7]">
                                    @{msg.author.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {/* Reply details if message is nested */}
                                {msg.replyTo && (
                                  <div className="mt-1 flex items-center gap-2 bg-[#161c24] border-l-2 border-[#00EAFF] px-2 py-1 rounded text-[11px] text-[#C8C7C7] select-none truncate max-w-lg">
                                    <span className="text-[#00EAFF]">↪</span>
                                    <span>
                                      <strong>@{msg.replyTo.author.username}</strong>: {msg.replyTo.content}
                                    </span>
                                  </div>
                                )}

                                <p className="text-xs text-[#E4F0FF] leading-relaxed mt-1 font-inter whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>

                                {/* Emoji Reaction Pills */}
                                {msg.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5 select-none">
                                    {Object.entries(
                                      msg.reactions.reduce((acc, current) => {
                                        acc[current.emoji] = acc[current.emoji] || [];
                                        acc[current.emoji].push(current);
                                        return acc;
                                      }, {} as Record<string, MessageReaction[]>)
                                    ).map(([emoji, list]) => {
                                      const hasMyReaction = list.some((r) => r.userId === user?.id);
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => handleToggleReaction(msg.id, emoji)}
                                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-chakra transition-all cursor-pointer ${
                                            hasMyReaction
                                              ? "bg-cyan-950/20 text-[#00EAFF] border-[#00EAFF]"
                                              : "bg-[#161c24] text-[#C8C7C7] border-[#2A313C] hover:border-white"
                                          }`}
                                        >
                                          <span>{emoji}</span>
                                          <span className="font-bold">{list.length}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Hover Message Utilities (Reply, React, Pin) */}
                              <div className="absolute right-2 -top-3 hidden group-hover:flex items-center gap-1 bg-[#161c24] border border-[#2A313C] rounded shadow-md px-1 py-0.5 z-10 select-none">
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="p-1 text-[#C8C7C7] hover:text-[#00EAFF] rounded transition-all cursor-pointer"
                                  title="Reply"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 17 4 12 9 7" />
                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                  </svg>
                                </button>
                                
                                {/* Reaction Picker Trigger */}
                                <div className="relative">
                                  <button
                                    onClick={() => setShowEmojiPickerForId(showEmojiPickerForId === msg.id ? null : msg.id)}
                                    className="p-1 text-[#C8C7C7] hover:text-[#00EAFF] rounded transition-all cursor-pointer"
                                    title="Add Reaction"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                      <line x1="9" y1="9" x2="9.01" y2="9" />
                                      <line x1="15" y1="9" x2="15.01" y2="9" />
                                    </svg>
                                  </button>

                                  {showEmojiPickerForId === msg.id && (
                                    <div className="absolute right-0 bottom-6 bg-[#161c24] border border-[#2A313C] rounded-lg shadow-xl p-1.5 flex gap-1 z-20 animate-fade-in">
                                      {emojiList.map((emoji) => (
                                        <button
                                          key={emoji}
                                          onClick={() => handleToggleReaction(msg.id, emoji)}
                                          className="hover:scale-130 transition-transform text-sm cursor-pointer p-0.5"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => setPinnedMessage(msg)}
                                  className="p-1 text-[#C8C7C7] hover:text-[#00EAFF] rounded transition-all cursor-pointer"
                                  title="Pin Message"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                  </svg>
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                      {/* Typing indicator inside scrolling list */}
                      {typingUsers.length > 0 && (
                        <div className="flex gap-3 py-1 items-center select-none text-[10px] font-chakra text-[#00EAFF] animate-pulse">
                          <div className="flex gap-0.5 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                          <span>
                            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Scroll Jump trigger */}
                {!isScrolledToBottom && messages.length > 5 && (
                  <button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                      setIsScrolledToBottom(true);
                    }}
                    className="absolute bottom-[90px] right-6 bg-[#00EAFF] text-[#10141A] font-chakra font-bold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,234,255,0.4)] hover:scale-105 transition-transform cursor-pointer z-10"
                  >
                    ⬇ Jump to bottom
                  </button>
                )}

                {/* Reply state Banner above input */}
                {replyingTo && (
                  <div className="bg-[#161c24] border-t border-[#2A313C] px-4 py-2 flex items-center justify-between text-xs font-inter flex-shrink-0 select-none">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#00EAFF]">↪ Replying to</span>
                      <span className="text-white font-bold truncate">@{replyingTo.author.username}</span>
                      <span className="text-[#C8C7C7] truncate italic">&ldquo;{replyingTo.content}&rdquo;</span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-[#FF4D4D] hover:underline font-chakra text-[10px] font-bold tracking-wider uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Chat Form Area */}
                <div className="p-4 border-t border-[#2A313C] bg-[#10141A] flex-shrink-0 relative">
                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="absolute -top-6 left-4 text-[10px] font-chakra text-[#00EAFF] italic tracking-widest flex items-center gap-1 animate-pulse select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] inline-block animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] inline-block animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00EAFF] inline-block animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="ml-1">
                        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is typing..." : "are typing..."}
                      </span>
                    </div>
                  )}
                  {hub.joined ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                      <div className="flex-grow bg-[#161c24] border border-[#2A313C] rounded-lg px-3 py-2 flex flex-col">
                        <textarea
                          placeholder={`Message #${selectedChannel?.name || "channel"}`}
                          value={messageText}
                          onChange={handleTextChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          rows={Math.min(3, messageText.split("\n").length || 1)}
                          maxLength={1000}
                          className="bg-transparent border-none text-white text-xs w-full focus:outline-none resize-none font-inter leading-relaxed"
                        />
                        <div className="flex justify-between items-center mt-2 text-[10px] font-chakra text-[#C8C7C7] select-none pt-1 border-t border-[#2A313C]/20">
                          <div className="flex gap-2 relative">
                            {/* Emoji picker trigger */}
                            <button
                              type="button"
                              onClick={() => setShowInputEmojiPicker((prev) => !prev)}
                              className="hover:text-[#00EAFF] transition-colors"
                            >
                              😊 Insert Emoji
                            </button>
                            {showInputEmojiPicker && (
                              <div className="absolute bottom-6 left-0 bg-[#10141A] border border-[#2A313C] rounded-lg shadow-xl p-1.5 flex gap-1 z-30 animate-fade-in">
                                {["👍", "🔥", "🚀", "😂", "🎉", "🎨", "🎮", "❤️"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      setMessageText((prev) => prev + emoji);
                                      setShowInputEmojiPicker(false);
                                    }}
                                    className="hover:scale-125 transition-transform text-sm cursor-pointer p-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className={messageText.length > 900 ? "text-[#FF4D4D]" : ""}>
                            {messageText.length} / 1000
                          </span>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="h-[48px] px-5 bg-[#00EAFF] hover:bg-[#00d0e0] text-[#10141A] font-chakra font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </form>
                  ) : (
                    <div className="bg-[#161c24] border border-[#2A313C]/50 rounded-lg p-4 text-center select-none">
                      <p className="text-xs text-[#C8C7C7] mb-2.5 font-inter">
                        You are viewing #{selectedChannel?.name || "channel"} in read-only mode.
                      </p>
                      <button
                        onClick={handleJoinToggle}
                        disabled={joining}
                        className="px-6 py-2 bg-[#00EAFF] text-[#10141A] font-chakra font-bold text-xs uppercase tracking-wider rounded hover:bg-[#00d0e0] shadow-[0_0_10px_rgba(0,234,255,0.2)] transition-all cursor-pointer"
                      >
                        {joining ? "Joining..." : "Join Hub to Chat"}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* COMMUNITY FEED SECTION */}
            {viewMode === "feed" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Inline Post Creation Box */}
                {user && hub.joined && (
                  <div className="bg-[#161c24] border border-[#2A313C] rounded-lg p-4">
                    <form onSubmit={handleCreatePost} className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-xs">
                          {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            user.firstName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-grow">
                          <textarea
                            placeholder={`Post updates, asset showcases, or discussion for #${hub.name}...`}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="w-full bg-[#10141A] border border-[#2A313C] text-white text-xs p-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] resize-none font-inter leading-relaxed"
                          />
                          <input
                            type="text"
                            placeholder="Optional Image URL (https://...)"
                            value={newPostImageUrl}
                            onChange={(e) => setNewPostImageUrl(e.target.value)}
                            className="w-full mt-2 bg-[#10141A] border border-[#2A313C] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#00EAFF] font-inter"
                          />
                        </div>
                      </div>

                      {postError && (
                        <div className="text-[#FF4D4D] text-xs font-chakra pl-11">
                          ⚠️ {postError}
                        </div>
                      )}

                      <div className="flex justify-between items-center pl-11">
                        <span className="text-[10px] font-chakra text-[#C8C7C7]">
                          {newPostContent.length} / 500 characters
                        </span>
                        <button
                          type="submit"
                          disabled={postingNewPost || !newPostContent.trim()}
                          className="px-5 py-2 bg-[#00EAFF] hover:bg-[#00d0e0] text-[#10141A] font-chakra font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {postingNewPost ? "Posting..." : "Share Post"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Posts List */}
                {feedLoading ? (
                  <div className="space-y-4">
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-10 text-[#C8C7C7] select-none">
                    <span className="text-4xl">📭</span>
                    <h3 className="font-chakra font-bold text-sm text-white mt-2 mb-1">
                      No posts in this Hub yet
                    </h3>
                    <p className="text-xs">
                      Be the first to create a post and start the community board!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={`${post.id}-${post.likesCount}-${post.isLiked}-${post.isBookmarked}-${post.isReposted}-${post.isFollowing}-${post.commentsCount}`}
                        {...post}
                        onInteraction={handlePostInteractionUpdate}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
              </>
            )}
          </main>

          {/* COLUMN 3: RIGHT PANEL (Members List) */}
          <aside
            className={`h-full border-l border-[#2A313C] bg-[#10141A] flex flex-col select-none transition-all duration-300 ${
              showMembersPanel ? "w-[260px] opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
            }`}
          >
            <div className="p-4 flex-shrink-0">
              <h3 className="font-chakra font-bold text-xs uppercase tracking-wider text-[#00EAFF] mb-3">
                Hub Members
              </h3>
              
              {/* Member Search input */}
              <input
                type="text"
                placeholder="Search members..."
                value={membersSearch}
                onChange={(e) => setMembersSearch(e.target.value)}
                className="w-full bg-[#161c24] border border-[#2A313C] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#00EAFF] font-inter"
              />

              {/* Online Only filter pill */}
              <div className="flex items-center justify-between mt-3 text-[10px] font-chakra text-[#C8C7C7]">
                <span>Filter Active</span>
                <button
                  onClick={() => setOnlineOnly(!onlineOnly)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    onlineOnly ? "bg-[#00EAFF]" : "bg-[#2A313C]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-[#10141A] transition-transform duration-200 ${
                      onlineOnly ? "translate-x-4" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
              {membersLoading && members.length === 0 ? (
                <div className="text-center py-4 text-[#C8C7C7] text-xs font-chakra">
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-[#C8C7C7] text-xs italic font-inter">
                  No members found.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by Online vs Offline */}
                  {(() => {
                    const onlineGroup = members.filter((m) => m.user.isOnline);
                    const offlineGroup = members.filter((m) => !m.user.isOnline);

                    return (
                      <>
                        {/* ONLINE GROUP */}
                        {onlineGroup.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="font-chakra text-[10px] text-[#00E676] uppercase tracking-wider font-bold mb-1">
                              Online — {onlineGroup.length}
                            </h4>
                            {onlineGroup.map((m) => (
                              <div key={m.id} className="flex items-center gap-2.5 py-1">
                                <div className="relative flex-shrink-0">
                                  <div className="w-7 h-7 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-xs">
                                    {m.user.avatar ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={m.user.avatar} alt={m.user.firstName} className="w-full h-full object-cover" />
                                    ) : (
                                      m.user.firstName.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  {/* Online green indicator dot */}
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00E676] border-2 border-[#10141A] z-10 translate-x-[10%] translate-y-[10%]"></span>
                                </div>
                                <div className="truncate flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-inter font-bold text-white truncate">
                                      {m.user.firstName} {m.user.lastName}
                                    </span>
                                    {m.user.isVerified && (
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#00EAFF" className="flex-shrink-0">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#C8C7C7] flex items-center gap-1.5 select-none">
                                    <span className="truncate">@{m.user.username}</span>
                                    {m.role !== "member" && (
                                      <span className="px-1 bg-[#00EAFF]/10 text-[#00EAFF] rounded text-[8px] font-chakra uppercase font-bold border border-[#00EAFF]/20 flex-shrink-0">
                                        {m.role}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* OFFLINE GROUP */}
                        {offlineGroup.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="font-chakra text-[10px] text-[#C8C7C7] uppercase tracking-wider font-bold mb-1">
                              Offline — {offlineGroup.length}
                            </h4>
                            {offlineGroup.map((m) => (
                              <div key={m.id} className="flex items-center gap-2.5 py-1 opacity-70">
                                <div className="relative flex-shrink-0">
                                  <div className="w-7 h-7 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-xs">
                                    {m.user.avatar ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={m.user.avatar} alt={m.user.firstName} className="w-full h-full object-cover" />
                                    ) : (
                                      m.user.firstName.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  {/* Offline grey indicator dot */}
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#8b949e] border-2 border-[#10141A] z-10 translate-x-[10%] translate-y-[10%]"></span>
                                </div>
                                <div className="truncate flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-inter font-bold text-white truncate">
                                      {m.user.firstName} {m.user.lastName}
                                    </span>
                                    {m.user.isVerified && (
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#00EAFF" className="flex-shrink-0">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#C8C7C7] flex items-center gap-1.5 select-none">
                                    <span className="truncate">@{m.user.username}</span>
                                    {m.role !== "member" && (
                                      <span className="px-1 bg-[#2A313C] text-[#C8C7C7] rounded text-[8px] font-chakra uppercase font-bold flex-shrink-0">
                                        {m.role}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </aside>

        </div>
      )}

      {/* Manage Join Requests Modal */}
      {isManageRequestsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#10141A] border border-[#2A313C] rounded-lg w-[500px] max-w-[90vw] max-h-[80vh] flex flex-col shadow-2xl relative">
            
            <header className="px-6 py-4 border-b border-[#2A313C] flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-chakra font-bold text-white tracking-wider uppercase">
                Manage Join Requests
              </h2>
              <button
                onClick={() => setIsManageRequestsOpen(false)}
                className="text-[#C8C7C7] hover:text-white transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="p-6 overflow-y-auto flex-1">
              {requestsLoading ? (
                <div className="flex justify-center text-[#00EAFF] font-chakra py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00EAFF] mr-3"></div>
                  Loading requests...
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8 text-[#C8C7C7] font-inter text-sm">
                  No pending requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {joinRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-[#161c24] border border-[#2A313C] rounded hover:border-[#00EAFF]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-xs select-none">
                          {req.user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={req.user.avatar} alt={req.user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            req.user.firstName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-inter font-bold text-white">
                            {req.user.firstName} {req.user.lastName}
                          </span>
                          <span className="text-xs text-[#C8C7C7]">
                            @{req.user.username}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRequestAction(req.id, "approve")}
                          className="px-3 py-1.5 rounded bg-[#00EAFF]/10 text-[#00EAFF] border border-[#00EAFF]/30 hover:bg-[#00EAFF] hover:text-[#10141A] font-chakra font-bold text-xs uppercase transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, "reject")}
                          className="px-3 py-1.5 rounded bg-transparent text-[#FF4D4D] border border-[#FF4D4D]/30 hover:bg-[#FF4D4D]/10 font-chakra font-bold text-xs uppercase transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hub Details Modal */}
      {isDetailsOpen && hub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#10141A] border border-[#2A313C] rounded-lg w-[500px] max-w-[90vw] shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#2A313C] flex justify-between items-center bg-[#161c24]">
              <h2 className="text-lg font-chakra font-bold text-white tracking-wider flex items-center gap-2">
                <span className="text-2xl">{hub.icon}</span> {hub.name} Details
              </h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-[#C8C7C7] hover:text-white transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[11px] font-chakra text-[#00EAFF] uppercase tracking-widest mb-2">Description</h3>
                <p className="text-sm text-[#C8C7C7] font-inter leading-relaxed">
                  {hub.description || "No description provided."}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-[#161c24] border border-[#2A313C] rounded-md p-3 flex flex-col items-center justify-center">
                  <span className="text-2xl font-chakra font-bold text-white">{hub.memberCount}</span>
                  <span className="text-[10px] font-chakra text-[#C8C7C7] uppercase tracking-widest mt-1">Members</span>
                </div>
                <div className="flex-1 bg-[#161c24] border border-[#2A313C] rounded-md p-3 flex flex-col items-center justify-center">
                  <span className="text-2xl font-chakra font-bold text-white">{hub.isPrivate ? "Private" : "Public"}</span>
                  <span className="text-[10px] font-chakra text-[#C8C7C7] uppercase tracking-widest mt-1">Status</span>
                </div>
              </div>

              {/* Invite Code (if available) */}
              {hub.isPrivate && hub.joinCode && (
                <div className="bg-[#161c24] border border-[#2A313C] rounded-md p-4 flex flex-col items-center">
                  <span className="text-[11px] font-chakra text-[#00EAFF] uppercase tracking-widest mb-2">Invite Code</span>
                  <div className="flex items-center gap-3 w-full max-w-[200px]">
                    <code className="flex-1 bg-black/50 border border-[#2A313C] text-[#00EAFF] font-chakra font-bold text-center py-2 rounded tracking-[0.2em] text-lg select-all">
                      {hub.joinCode}
                    </code>
                    <button
                      onClick={() => {
                        if (hub.joinCode) {
                          navigator.clipboard.writeText(hub.joinCode);
                          showToast("Invite code copied!");
                        }
                      }}
                      className="p-2.5 rounded bg-[#2A313C] hover:bg-[#3b4351] text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#C8C7C7] mt-3 text-center">Share this code with others so they can request to join.</p>
                </div>
              )}

              {/* Admin button */}
              {(hub.userRole === "admin" || hub.userRole === "owner") && (
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full py-2.5 rounded bg-[#00EAFF]/10 border border-[#00EAFF]/30 text-[#00EAFF] font-chakra font-bold text-sm uppercase hover:bg-[#00EAFF] hover:text-[#10141A] transition-all flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Group Settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {isSettingsOpen && hub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#10141A] border border-[#2A313C] rounded-lg w-[600px] max-w-[90vw] h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2A313C] flex justify-between items-center bg-[#161c24] flex-shrink-0">
              <h2 className="text-lg font-chakra font-bold text-white tracking-wider flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsDetailsOpen(true);
                  }}
                  className="mr-2 text-[#C8C7C7] hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                Group Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#C8C7C7] hover:text-white transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
              
              {/* Settings Section */}
              <section>
                <h3 className="text-[11px] font-chakra text-[#00EAFF] uppercase tracking-widest mb-4">Permissions</h3>
                <div className="flex items-center justify-between p-4 bg-[#161c24] border border-[#2A313C] rounded-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white font-inter">Allow members to view invite code</h4>
                    <p className="text-xs text-[#C8C7C7] mt-1">If enabled, any member can see and share the invite code.</p>
                  </div>
                  <button
                    disabled={updatingSettings}
                    onClick={() => handleToggleSettings(!hub.allowMembersToInvite)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${hub.allowMembersToInvite ? "bg-[#00E676]" : "bg-[#2A313C]"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${hub.allowMembersToInvite ? "left-[26px]" : "left-1"}`} />
                  </button>
                </div>
              </section>

              {/* Members Management Section */}
              <section className="flex-1 flex flex-col min-h-0">
                <h3 className="text-[11px] font-chakra text-[#00EAFF] uppercase tracking-widest mb-4 flex justify-between items-end">
                  <span>Role Management</span>
                  <span className="text-[#C8C7C7] lowercase tracking-normal">{members.length} total members</span>
                </h3>
                
                <div className="bg-[#161c24] border border-[#2A313C] rounded-lg flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {membersLoading && members.length === 0 ? (
                      <div className="flex justify-center text-[#00EAFF] font-chakra py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00EAFF] mr-3"></div>
                      </div>
                    ) : (
                      members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-[#2A313C]/30 rounded transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-[10px] select-none text-white">
                              {member.user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={member.user.avatar} alt={member.user.firstName} className="w-full h-full object-cover" />
                              ) : (
                                member.user.firstName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-inter font-bold text-white flex items-center gap-2">
                                {member.user.firstName} {member.user.lastName}
                                {member.role === "owner" && <span className="bg-[#FF9100]/20 text-[#FF9100] text-[9px] px-1.5 py-0.5 rounded uppercase font-chakra">Owner</span>}
                                {member.role === "admin" && <span className="bg-[#00EAFF]/20 text-[#00EAFF] text-[9px] px-1.5 py-0.5 rounded uppercase font-chakra">Admin</span>}
                              </span>
                              <span className="text-xs text-[#C8C7C7]">@{member.user.username}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            {actionLoading === `promote-${member.user.id}` || actionLoading === `demote-${member.user.id}` || actionLoading === `kick-${member.user.id}` ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#00EAFF]"></div>
                            ) : (
                              <>
                                {/* Admins can promote members to admin */}
                                {member.role === "member" && (
                                  <button
                                    onClick={() => handleMemberAction(member.user.id, "promote")}
                                    className="px-2 py-1 bg-[#2A313C] hover:bg-[#00EAFF] text-white hover:text-black rounded text-[10px] font-chakra uppercase transition-colors"
                                  >
                                    Promote
                                  </button>
                                )}
                                {/* Only owner can demote admins */}
                                {member.role === "admin" && hub.userRole === "owner" && (
                                  <button
                                    onClick={() => handleMemberAction(member.user.id, "demote")}
                                    className="px-2 py-1 bg-[#2A313C] hover:bg-[#FF9100] text-white hover:text-black rounded text-[10px] font-chakra uppercase transition-colors"
                                  >
                                    Demote
                                  </button>
                                )}
                                {/* Kick User */}
                                {member.role !== "owner" && (
                                  // Admins can kick members, Owners can kick admins/members
                                  ((member.role === "member") || (member.role === "admin" && hub.userRole === "owner")) && (
                                    <button
                                      onClick={() => handleMemberAction(member.user.id, "kick")}
                                      className="px-2 py-1 bg-[#2A313C] hover:bg-[#FF4D4D] text-white rounded text-[10px] font-chakra uppercase transition-colors"
                                    >
                                      Kick
                                    </button>
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS transition animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(3px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
