"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import "../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

interface ConversationSummary {
  id: string;
  otherUser: PublicUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function fullName(u: PublicUser): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

function initial(u: PublicUser): string {
  return (u.firstName || "?").charAt(0).toUpperCase();
}

function MessagesInner() {
  const { user, checkAuth } = useAuthStore();
  const searchParams = useSearchParams();
  const toUsername = searchParams.get("to");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<PublicUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const handledToRef = useRef(false);
  // Always holds the currently-active conversation id so async fetches can
  // discard responses for a conversation the user has since switched away from.
  const activeIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Guards against setState after the component has unmounted.
  const mountedRef = useRef(true);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.status === 401) {
        setConversations([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error(err);
      showErrorToast("Could not load conversations.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchThread = useCallback(
    async (id: string, opts: { showLoading?: boolean } = {}) => {
      if (opts.showLoading) setLoadingThread(true);
      try {
        const res = await fetch(`/api/conversations/${id}`);
        if (!res.ok) throw new Error("Failed to load conversation");
        const data = await res.json();
        // Discard if the user has switched to a different conversation.
        if (id !== activeIdRef.current) return;
        setMessages(data.messages || []);
        if (data.conversation?.otherUser) {
          setActiveOther(data.conversation.otherUser);
        }
        // Clear the unread badge on the selected conversation locally.
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error(err);
        showErrorToast("Could not load messages.");
      } finally {
        if (opts.showLoading) setLoadingThread(false);
      }
    },
    []
  );

  const selectConversation = useCallback(
    (c: ConversationSummary) => {
      activeIdRef.current = c.id;
      setActiveId(c.id);
      setActiveOther(c.otherUser);
      setMessages([]);
      fetchThread(c.id, { showLoading: true });
    },
    [fetchThread]
  );

  // Initial load: auth + conversation list.
  useEffect(() => {
    checkAuth();
    const timer = setTimeout(() => {
      fetchConversations();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth, fetchConversations]);

  // Handle ?to=<username> — get-or-create a conversation, then select it.
  useEffect(() => {
    if (!toUsername || handledToRef.current) return;
    handledToRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: toUsername }),
        });
        if (!res.ok) throw new Error("Failed to open conversation");
        const data = await res.json();
        const conv = data.conversation;
        if (conv) {
          activeIdRef.current = conv.id;
          setActiveId(conv.id);
          setActiveOther(conv.otherUser);
          setMessages([]);
          fetchThread(conv.id, { showLoading: true });
          fetchConversations();
        }
      } catch (err) {
        console.error(err);
        showErrorToast("Could not start that conversation.");
      }
    })();
  }, [toUsername, fetchThread, fetchConversations]);

  // Poll the active thread every 4s for new messages.
  useEffect(() => {
    if (!activeId) return;
    pollRef.current = setInterval(() => {
      fetchThread(activeId);
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [activeId, fetchThread]);

  // Track mounted state so socket callbacks never setState after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Real-time DM delivery via Socket.io (the 4s poll above stays as a fallback).
  useEffect(() => {
    if (!user) return;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("identify", { userId: user.id });
    });

    const handleNewDm = (incoming: DirectMessage & { conversationId?: string }) => {
      if (!mountedRef.current) return;

      // If the DM belongs to the open thread, append it (deduped by id).
      if (incoming.conversationId && incoming.conversationId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          const { conversationId: _omit, ...msg } = incoming;
          return [...prev, msg];
        });
      }

      // Always refresh the list so previews/unread badges stay current.
      fetchConversations();
    };

    socket.on("new_dm", handleNewDm);

    return () => {
      socket.off("new_dm", handleNewDm);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, fetchConversations]);

  // Auto-scroll to newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setDraft("");
      fetchConversations();
    } catch (err) {
      console.error(err);
      showErrorToast("Message failed to send.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loggedOut = !user && !loadingList;

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">DIRECT MESSAGES</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Messages
            </h1>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Private 1-to-1 conversations with people across the Caliber
              ecosystem.
            </p>
          </div>

          {errorToast && (
            <div className="mb-4 bg-red-500 text-white font-bold font-chakra text-xs py-2 px-3 rounded shadow-lg inline-block">
              {errorToast}
            </div>
          )}

          {loggedOut ? (
            <div className="text-center py-16">
              <div className="text-white font-chakra font-bold text-sm mb-1">
                You&apos;re logged out
              </div>
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                <Link href="/login" className="text-[#10B981] hover:underline">
                  Log in
                </Link>{" "}
                to view and send direct messages.
              </div>
            </div>
          ) : (
            <div className="dm-shell">
              {/* LEFT — conversation list */}
              <div
                className={`dm-list ${activeId ? "dm-hide-mobile" : ""}`}
              >
                {loadingList ? (
                  <div className="flex flex-col gap-3 p-3">
                    <div
                      className="skeleton-card skeleton-shimmer"
                      style={{ height: "64px" }}
                    />
                    <div
                      className="skeleton-card skeleton-shimmer"
                      style={{ height: "64px" }}
                    />
                    <div
                      className="skeleton-card skeleton-shimmer"
                      style={{ height: "64px" }}
                    />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="text-white font-chakra font-bold text-sm mb-1">
                      No conversations yet
                    </div>
                    <div className="text-[var(--c-text-muted)] font-inter text-sm">
                      Start one from someone&apos;s profile.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectConversation(c)}
                        className={`dm-row ${
                          activeId === c.id ? "dm-row-active" : ""
                        }`}
                      >
                        <div className="dm-avatar flex-shrink-0">
                          {c.otherUser.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.otherUser.avatar}
                              alt={fullName(c.otherUser)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initial(c.otherUser)
                          )}
                        </div>
                        <div className="flex-grow min-w-0 text-left">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-inter text-sm font-bold text-white truncate">
                              {fullName(c.otherUser)}
                            </span>
                            {c.lastMessage && (
                              <span className="font-inter text-[11px] text-[#6B7280] flex-shrink-0">
                                {timeAgo(c.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-inter text-xs text-[var(--c-text-muted)] truncate">
                              {c.lastMessage
                                ? c.lastMessage.content
                                : `@${c.otherUser.username ?? "user"}`}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="dm-unread flex-shrink-0">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT — active thread */}
              <div
                className={`dm-thread ${
                  activeId ? "" : "dm-hide-mobile"
                }`}
              >
                {!activeId || !activeOther ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                      </svg>
                    </div>
                    <div className="text-white font-chakra font-bold text-sm mb-1">
                      Select a conversation
                    </div>
                    <div className="text-[var(--c-text-muted)] font-inter text-sm">
                      Pick someone on the left to see your messages.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Thread header */}
                    <div className="dm-thread-header">
                      <button
                        className="dm-back-btn md:hidden"
                        aria-label="Back to conversations"
                        onClick={() => {
                          activeIdRef.current = null;
                          setActiveId(null);
                          setActiveOther(null);
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {activeOther.username ? (
                        <Link
                          href={`/profile/${activeOther.username}`}
                          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                        >
                          <div className="dm-avatar flex-shrink-0">
                            {activeOther.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={activeOther.avatar}
                                alt={fullName(activeOther)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initial(activeOther)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-inter text-sm font-bold text-white truncate">
                              {fullName(activeOther)}
                            </div>
                            <div className="font-inter text-xs text-[var(--c-text-muted)] truncate">
                              @{activeOther.username}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="dm-avatar flex-shrink-0">
                            {initial(activeOther)}
                          </div>
                          <div className="font-inter text-sm font-bold text-white truncate">
                            {fullName(activeOther)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="dm-messages">
                      {loadingThread ? (
                        <div className="flex flex-col gap-3 p-2">
                          <div
                            className="skeleton-card skeleton-shimmer"
                            style={{ height: "40px", width: "60%" }}
                          />
                          <div
                            className="skeleton-card skeleton-shimmer self-end"
                            style={{ height: "40px", width: "50%" }}
                          />
                          <div
                            className="skeleton-card skeleton-shimmer"
                            style={{ height: "40px", width: "45%" }}
                          />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-[var(--c-text-muted)] font-inter text-sm py-10">
                          No messages yet. Say hello.
                        </div>
                      ) : (
                        messages.map((m) => {
                          const mine = user ? m.senderId === user.id : false;
                          return (
                            <div
                              key={m.id}
                              className={`dm-bubble-row ${
                                mine ? "dm-mine" : "dm-theirs"
                              }`}
                            >
                              <div
                                className={`dm-bubble ${
                                  mine ? "dm-bubble-mine" : "dm-bubble-theirs"
                                }`}
                              >
                                <span className="dm-bubble-text">
                                  {m.content}
                                </span>
                                <span className="dm-bubble-time">
                                  {timeAgo(m.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={bottomRef} />
                    </div>

                    {/* Composer */}
                    <div className="dm-composer">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a message..."
                        rows={1}
                        maxLength={2000}
                        className="dm-input"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !draft.trim()}
                        className="dm-send-btn"
                      >
                        {sending ? "..." : "Send"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
        .dm-shell {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--c-border);
          border-radius: 12px;
          overflow: hidden;
          background: var(--c-bg);
          height: calc(100vh - 260px);
          min-height: 420px;
        }
        .dm-list {
          width: 100%;
          overflow-y: auto;
          background: var(--c-bg);
        }
        .dm-thread {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          background: var(--c-bg);
        }
        .dm-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--c-border);
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
          width: 100%;
        }
        .dm-row:hover {
          background: rgba(16, 185, 129, 0.04);
        }
        .dm-row-active {
          background: rgba(16, 185, 129, 0.08);
        }
        .dm-avatar {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: var(--c-border);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          border: 1px solid var(--c-border);
        }
        .dm-unread {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          background: #10B981;
          color: var(--c-bg);
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
        }
        .dm-thread-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--c-border);
          background: var(--c-surface);
        }
        .dm-back-btn {
          background: transparent;
          border: none;
          color: var(--c-text-muted);
          padding: 4px;
          margin-right: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .dm-back-btn:hover {
          color: #10B981;
        }
        .dm-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .dm-bubble-row {
          display: flex;
        }
        .dm-mine {
          justify-content: flex-end;
        }
        .dm-theirs {
          justify-content: flex-start;
        }
        .dm-bubble {
          max-width: 78%;
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dm-bubble-mine {
          background: rgba(16, 185, 129, 0.14);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-bottom-right-radius: 3px;
        }
        .dm-bubble-theirs {
          background: var(--c-surface-2);
          border: 1px solid var(--c-border);
          border-bottom-left-radius: 3px;
        }
        .dm-bubble-text {
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          color: #fff;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .dm-bubble-time {
          font-family: var(--font-inter), sans-serif;
          font-size: 10px;
          color: #6b7280;
          align-self: flex-end;
        }
        .dm-composer {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
          padding: 0.75rem;
          border-top: 1px solid var(--c-border);
          background: var(--c-surface);
        }
        .dm-input {
          flex: 1;
          background: var(--c-surface-2);
          border: 1px solid var(--c-border);
          color: #fff;
          font-family: var(--font-inter), sans-serif;
          font-size: 13px;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          resize: none;
          max-height: 120px;
          outline: none;
          transition: border-color 0.2s;
        }
        .dm-input:focus {
          border-color: #10B981;
        }
        .dm-send-btn {
          background: #10B981;
          color: var(--c-bg);
          font-family: var(--font-chakra-petch), sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 0.6rem 1.1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .dm-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .dm-hide-mobile {
          display: none;
        }
        @media (min-width: 768px) {
          .dm-shell {
            flex-direction: row;
          }
          .dm-list {
            width: 300px;
            flex-shrink: 0;
            border-right: 1px solid var(--c-border);
          }
          .dm-hide-mobile {
            display: flex;
          }
          .dm-list.dm-hide-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  );
}
