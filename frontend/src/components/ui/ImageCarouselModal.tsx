"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
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
  const hasMultipleImages = images.length > 1;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: hasMultipleImages,
    align: "center",
    skipSnaps: !hasMultipleImages,
  });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    if (emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
    }
  }, [initialIndex, emblaApi]);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!emblaApi) return;

    const handleSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", handleSelect);
    handleSelect();

    return () => {
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi]);

  const handlePrevious = useCallback(() => {
    if (!emblaApi) return;
    if (hasMultipleImages) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi, hasMultipleImages]);

  const handleNext = useCallback(() => {
    if (!emblaApi) return;
    if (hasMultipleImages) {
      emblaApi.scrollNext();
    }
  }, [emblaApi, hasMultipleImages]);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      setCurrentIndex(index);
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <div className="absolute top-4 right-4 z-[10002] ">
        <IconButton
          icon={({ size }) => <X size={size} weight="bold" />}
          size="iconM"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2"
        />
      </div>

      {/* 상단 정보 바: 카운터 + 원본 토글 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10002] flex items-center gap-2">
        {images.length > 1 && (
          <div className="bg-black/50 px-3 py-1 rounded-full">
            <span className="text-white text-sm">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}
      </div>

      {/* 이전 버튼 */}
      {hasMultipleImages && (
        <div className="absolute left-4 z-[10002]">
          <IconButton
            icon={({ size }) => <CaretLeft size={size} weight="bold" />}
            size="iconM"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-2"
          />
        </div>
      )}

      {/* 이미지 */}
      <div className="relative w-full h-full grid place-items-center px-6 sm:px-16">
        <div
          className="pointer-events-auto relative h-full w-full max-h-[90vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
          ref={emblaRef}
        >
          <div className="flex h-full w-full">
            {images.map((image, index) => (
              <div
                key={image + index}
                className="relative flex-[0_0_100%] h-full"
              >
                <Image
                  src={image}
                  alt={`이미지 ${index + 1}`}
                  fill
                  className="object-contain object-center"
                  sizes="(min-width: 1024px) 70vw, 90vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      {hasMultipleImages && (
        <div className="absolute right-4 z-[10002]">
          <IconButton
            icon={({ size }) => <CaretRight size={size} weight="bold" />}
            size="iconM"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-2"
          />
        </div>
      )}

      {/* 하단 썸네일 (이미지가 여러 개일 때만) */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[10002] max-w-[90vw]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThumbnailClick(index);
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
