"use client";

import { useState } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";

interface CommentInputProps {
  placeholder?: string;
  onSubmit?: (text: string) => void;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "comment" | "reply";
  disabled?: boolean;
}

export function CommentInput({
  placeholder = "댓글을 남겨보세요",
  onSubmit,
  variant = "primary",
  className = "",
  disabled = false,
}: CommentInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && onSubmit && !disabled) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const textColor = variant === "primary" ? "text-gray-500" : "text-black";

  return (
    <div className={`relative bg-bg rounded-lg ${className}`}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={disabled ? "작성 중..." : placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3 pr-12 bg-transparent outline-none text-sm ${textColor} placeholder-gray-400 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        {disabled ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        ) : (
          <IconButton
            icon={({ size }) => <PaperPlaneRight size={size} weight="fill" />}
            size="iconS"
            onClick={handleSubmit}
            disabled={disabled}
            className="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )}
      </div>
    </div>
  );
}
