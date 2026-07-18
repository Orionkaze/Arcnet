import React, { useState, useRef } from "react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { Image as ImageIcon, Smile, X } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  role?: string | null;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (content: string, imageUrl: string) => Promise<void>;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  user,
  onSubmit,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      if (!isPosting) {
        onClose();
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    setIsPosting(true);
    try {
      await onSubmit(content, imageUrl);
      setContent("");
      setImageUrl("");
      onClose();
    } catch (error) {
      console.error("Failed to post:", error);
      // Let the parent handle or show error
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-[#14181F] border border-[#2A313C] rounded-xl shadow-2xl relative flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#C8C7C7] hover:text-white transition-colors"
          disabled={isPosting}
        >
          <X size={20} />
        </button>

        {/* User Info Header */}
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="w-12 h-12 rounded-full bg-[#2A313C] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-lg text-white">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              user.firstName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-white font-inter font-semibold text-lg leading-tight">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-[#C8C7C7] font-inter text-sm">
              {user.role || "Creator @ArcNet"}
            </p>
          </div>
        </div>

        {/* Text Area */}
        <div className="px-6 pb-2">
          <div className="bg-[#1D232D] rounded-xl p-4 border border-transparent focus-within:border-[#2A313C] transition-colors relative min-h-[200px] flex flex-col">
            <textarea
              placeholder="What do you want to talk about ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-white font-inter text-base focus:outline-none resize-none flex-grow"
              style={{ minHeight: "120px" }}
              maxLength={500}
            />

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative mt-4 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Attachment Preview"
                  className="w-full max-h-[300px] object-cover rounded-lg border border-[#2A313C]"
                />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Toolbar Bottom-Right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {/* Emoji Button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-[#C8C7C7] hover:text-[#10B981] p-1.5 rounded-full hover:bg-[rgba(16, 185, 129,0.1)] transition-colors"
                  title="Add Emoji"
                >
                  <Smile size={22} />
                </button>
                
                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl">
                    <EmojiPicker
                      theme={Theme.DARK}
                      onEmojiClick={handleEmojiClick}
                      lazyLoadEmojis={true}
                      searchDisabled={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar & Post Button */}
        <div className="p-6 pt-4 flex items-center justify-between mt-auto">
          {/* Media Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#C8C7C7] hover:text-[#10B981] p-2 rounded-full hover:bg-[rgba(16, 185, 129,0.1)] transition-colors flex items-center justify-center"
              title="Upload from Device"
            >
              <ImageIcon size={24} />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPosting || (!content.trim() && !imageUrl)}
            className="px-8 py-2 bg-transparent border border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-[#10141A] font-chakra font-bold text-sm tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
