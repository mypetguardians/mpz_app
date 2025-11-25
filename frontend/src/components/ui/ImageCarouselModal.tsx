"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X } from "@phosphor-icons/react";
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
  // 유효한 이미지만 필터링
  const validImages = images.filter((img) => img && img.trim() !== "");
  const hasMultipleImages = validImages.length > 1;

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

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      setCurrentIndex(index);
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (!open) return null;
  if (validImages.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-10 sm:px-6 relative"
      onClick={onClose}
    >
      {/* 닫기 버튼 - 화면 우측 상단 */}
      <IconButton
        icon={({ size }) => <X size={size} />}
        size="iconM"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 text-white p-1"
      />
      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col items-center justify-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 정보 바: 카운터 + 원본 토글 */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
          {validImages.length > 1 && (
            <div className="text-white text-sm font-medium">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* 이미지 */}
        <div ref={emblaRef} className="embla__viewport w-full">
          <div className="embla__container flex">
            {validImages.map((image, index) => (
              <div
                key={index}
                className="embla__slide flex-[0_0_100%] min-w-0 flex items-center justify-center"
              >
                <Image
                  src={image}
                  alt={`Image ${index + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 하단 썸네일 (이미지가 여러 개일 때만) */}
        {hasMultipleImages && (
          <div className="flex w-full justify-center items-center gap-2 p-4 bg-gradient-to-t from-black/50 to-transparent overflow-x-auto rounded-lg">
            {validImages.map((img, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === index
                    ? "border-white scale-110"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
