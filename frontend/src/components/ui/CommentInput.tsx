"use client";

import { useState } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { IconButton } from "./IconButton";

interface CommentInputProps {
  placeholder?: string;
  onSubmit?: (text: string) => void;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "comment" | "reply";
}

export function CommentInput({
  placeholder = "댓글을 남겨보세요",
  onSubmit,
  variant = "primary",
  className = "",
}: CommentInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && onSubmit) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const textColor = variant === "primary" ? "text-gray-500" : "text-black";

  return (
    <div className={`relative bg-gray-100 rounded-lg ${className}`}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={`w-full px-4 py-3 pr-12 bg-bg outline-none text-sm ${textColor} placeholder-gr`}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        <IconButton
          icon={({ size }) => <PaperPlaneRight size={size} weight="fill" />}
          size="iconS"
          onClick={handleSubmit}
          className="text-brand"
        />
      </div>
    </div>
  );
}
