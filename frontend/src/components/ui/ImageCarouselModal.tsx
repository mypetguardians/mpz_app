"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import { IconButton } from "./IconButton";
import { getProxyImageUrl } from "@/lib/getProxyImageUrl";

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
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(() =>
    images.map(() => false)
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: hasMultipleImages,
    align: "center",
    skipSnaps: !hasMultipleImages,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const proxiedImages = useMemo(
    () => images.map((image) => getProxyImageUrl(image) ?? "/img/dummyImg.png"),
    [images]
  );

  useEffect(() => {
    setImageLoaded(images.map(() => false));
  }, [images]);

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
          size="iconL"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-1"
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
            size="iconL"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-1"
          />
        </div>
      )}

      {/* 이미지 */}
      <div className="relative w-full h-full grid place-items-center px-6 sm:px-16 py-20">
        <div
          className="pointer-events-auto relative max-h-[85vh] max-w-[95vw] w-full touch-pan-x"
          ref={emblaRef}
          style={{ touchAction: "pan-x pinch-zoom" }}
          onMouseDown={(e) => {
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
          onMouseUp={(e) => {
            if (dragStart) {
              const deltaX = Math.abs(e.clientX - dragStart.x);
              const deltaY = Math.abs(e.clientY - dragStart.y);
              // 드래그가 아닌 단순 클릭인 경우 (5px 이내 이동)
              if (deltaX < 5 && deltaY < 5) {
                onClose();
              }
              setDragStart(null);
            }
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            setDragStart({ x: touch.clientX, y: touch.clientY });
          }}
          onTouchEnd={(e) => {
            if (dragStart) {
              const touch = e.changedTouches[0];
              const deltaX = Math.abs(touch.clientX - dragStart.x);
              const deltaY = Math.abs(touch.clientY - dragStart.y);
              // 드래그가 아닌 단순 탭인 경우 (10px 이내 이동)
              if (deltaX < 10 && deltaY < 10) {
                onClose();
              }
              setDragStart(null);
            }
          }}
        >
          <div className="flex h-full w-full gap-6 px-6">
            {proxiedImages.map((image, index) => (
              <div
                key={image + index}
                className="relative flex-[0_0_100%] w-full aspect-auto touch-pan-x"
                style={{ touchAction: "pan-x pinch-zoom", minHeight: "320px" }}
              >
                {!imageLoaded[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                )}
                <Image
                  src={image}
                  alt={`이미지 ${index + 1}`}
                  fill
                  className="object-contain object-center select-none"
                  sizes="(min-width: 1024px) 70vw, 70vw"
                  draggable={false}
                  onLoadingComplete={() => {
                    setImageLoaded((prev) => {
                      const next = [...prev];
                      next[index] = true;
                      return next;
                    });
                  }}
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
            size="iconL"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="bg-white/10 hover:bg-white/20 text-white p-1"
          />
        </div>
      )}

      {/* 하단 썸네일 (이미지가 여러 개일 때만) */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[10002] max-w-[90vw]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
            {proxiedImages.map((img, index) => (
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
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
