import React from "react";
import Image from "next/image";
import { Chip } from "./Chip";
import { cn } from "@/lib/utils";

interface AdoptorListItemProps {
  title: string;
  userName: string;
  timeAgo: string;
  petImage: string;
  petName?: string;
  chipText: string;
  isRejected?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AdoptorListItem({
  title,
  userName,
  timeAgo,
  petImage,
  petName,
  chipText,
  isRejected = false,
  className,
  onClick,
}: AdoptorListItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-lg p-4 border border-gray-200",
        className
      )}
      onClick={onClick}
    >
      {/* Title */}
      <h3 className="text-purple-600 text-sm font-medium mb-3">{title}</h3>

      {/* Content */}
      <div className="flex items-center gap-3">
        {/* Pet Image */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={petImage}
            alt={petName || "반려동물"}
            fill
            className={cn("object-cover rounded-lg", isRejected && "grayscale")}
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-900">
              {userName}
            </span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex-shrink-0">
          <Chip>{chipText}</Chip>
        </div>
      </div>
    </div>
  );
}

export default AdoptorListItem;
