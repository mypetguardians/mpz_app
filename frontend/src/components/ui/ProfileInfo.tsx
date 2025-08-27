import React from "react";
import Image from "next/image";
import { User } from "@phosphor-icons/react";

interface ProfileInfoProps {
  author: string;
  profileImage?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function ProfileInfo({
  author,
  profileImage,
  size = "md",
  className = "",
  onClick,
}: ProfileInfoProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`flex items-center gap-2 ${className} ${
        onClick ? "cursor-pointer hover:opacity-70 transition-opacity" : ""
      }`}
      onClick={onClick}
    >
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-lg`}
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt={author}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-lg flex items-center justify-center p-1`}
          >
            <User size={sizeClasses[size]} weight="bold" className="text-gr" />
          </div>
        )}
      </div>
      <span className={`text-dg ${textSizes[size]}`}>{author}</span>
    </div>
  );
}
