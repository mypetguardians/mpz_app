import React from "react";
import Image from "next/image";
import { X, Camera } from "@phosphor-icons/react";
import clsx from "clsx";

type ImageCardVariant = "primary" | "variant3" | "add";

interface ImageCardProps {
  src?: string;
  alt?: string;
  variant?: ImageCardVariant;
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export function ImageCard({
  src,
  alt,
  variant = "primary",
  selected = false,
  onRemove,
  onClick,
  className,
}: ImageCardProps) {
  // 카드 사이즈 & border 스타일
  const baseStyle =
    "relative w-[78px] h-[78px] rounded-[10px] flex items-center justify-center bg-bg cursor-pointer transition border-1";
  const selectedStyle = selected
    ? "border-brand/80 shadow-lg scale-105"
    : "border-transparent";

  if (variant === "add") {
    return (
      <div
        className={clsx(baseStyle, "border border-lg bg-white", className)}
        onClick={onClick}
      >
        <Camera size={24} className="text-dg" />
      </div>
    );
  }

  return (
    <div
      className={clsx(baseStyle, selectedStyle, className)}
      onClick={onClick}
    >
      {/* X 아이콘 (오른쪽 상단) */}
      {onRemove && (
        <button
          type="button"
          className="absolute top-[-10px] right-[-10px] bg-black text-white rounded-full w-5 h-5 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="이미지 삭제"
        >
          <X size={16} weight="regular" />
        </button>
      )}
      {src && (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          className="object-cover rounded-[10px]"
          sizes="(max-width: 640px) 100vw, 125px"
        />
      )}
    </div>
  );
}
