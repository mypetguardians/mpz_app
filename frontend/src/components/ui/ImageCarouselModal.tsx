"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { IconButton } from "./IconButton";

interface ImageCarouselModalProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageCarouselModal({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageCarouselModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <div className="absolute top-4 right-4 z-[10002]">
        <IconButton
          icon={({ size }) => <X size={size} weight="bold" />}
          size="iconM"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white"
        />
      </div>

      {/* 이미지 카운터 */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10002] bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* 이전 버튼 */}
      {images.length > 1 && (
        <div className="absolute left-4 z-[10002]">
          <IconButton
            icon={({ size }) => <CaretLeft size={size} weight="bold" />}
            size="iconM"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="bg-white/10 hover:bg-white/20 text-white"
          />
        </div>
      )}

      {/* 이미지 */}
      <div
        className="relative w-full h-full flex items-center justify-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-full max-h-full w-auto h-auto">
          <Image
            src={images[currentIndex]}
            alt={`이미지 ${currentIndex + 1}`}
            width={1200}
            height={1200}
            className="object-contain max-w-full max-h-[90vh]"
            unoptimized
          />
        </div>
      </div>

      {/* 다음 버튼 */}
      {images.length > 1 && (
        <div className="absolute right-4 z-[10002]">
          <IconButton
            icon={({ size }) => <CaretRight size={size} weight="bold" />}
            size="iconM"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="bg-white/10 hover:bg-white/20 text-white"
          />
        </div>
      )}

      {/* 하단 썸네일 (이미지가 여러 개일 때만) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[10002] max-w-[90vw]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === index
                    ? "border-white scale-110"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`썸네일 ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
