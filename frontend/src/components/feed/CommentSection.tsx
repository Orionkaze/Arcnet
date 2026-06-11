"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments);
        }
      } catch (error) {
        console.error("Failed to load comments", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to submit comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#23262D]">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-[#1A1C23] border border-[#23262D] rounded-full px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00D2FF]"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="text-[#00D2FF] font-semibold text-sm px-3 disabled:opacity-50"
        >
          Post
        </button>
      </form>

      {isLoading ? (
        <div className="text-center text-sm text-gray-500 my-4">Loading comments...</div>
      ) : comments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden relative">
                {comment.user.avatar ? (
                  <Image src={comment.user.avatar} alt="Avatar" layout="fill" objectFit="cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-[#1A1C23] text-[#00D2FF] text-xs">
                    {comment.user.firstName[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="bg-[#1A1C23] border border-[#23262D] rounded-2xl rounded-tl-none px-4 py-2">
                  <span className="font-semibold text-xs text-gray-200 mr-2">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-sm text-gray-300">{comment.content}</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 ml-1">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 my-4">No comments yet.</div>
      )}
    </div>
  );
}
