"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useGetBanners } from "@/hooks";

type BannerVariant = "main" | "sub";

interface BannerProps {
  variant: BannerVariant;
  className?: string;
}

export function Banner({ variant, className = "" }: BannerProps) {
  const { data: banners, isLoading } = useGetBanners({ type: variant });

  const targetBanner = useMemo(() => {
    if (!banners?.data || banners.data.length === 0) return null;
    const active = banners.data.filter((b) => b.is_active === true);
    if (active.length === 0) return null;
    const sorted = [...active].sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );
    return sorted[0];
  }, [banners]);

  if (isLoading) {
    return (
      <div className={`py-5 ${className}`}>
        <div
          className={
            variant === "sub"
              ? "relative w-full h-20 overflow-hidden rounded-lg"
              : "relative w-full h-[232px] overflow-hidden"
          }
        >
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!targetBanner) return null;

  const imageUrl = targetBanner.image_url || "/img/banner.jpg";

  const getFullUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const linkUrl = targetBanner.link_url
    ? getFullUrl(targetBanner.link_url)
    : "";

  return (
    <div className={`py-5 ${className}`}>
      <div
        className={
          variant === "sub"
            ? "relative w-full h-20 overflow-hidden rounded-lg cursor-pointer"
            : "relative w-full h-[232px] overflow-hidden cursor-pointer"
        }
        onClick={() => {
          if (linkUrl) {
            window.open(linkUrl, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <Image
          src={imageUrl}
          alt={targetBanner.alt || targetBanner.title || "배너"}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => {
            e.currentTarget.src = "/img/banner.jpg";
          }}
          sizes="100vw"
          priority={variant === "main"}
        />
        {targetBanner.title && (
          <div className="absolute inset-0 flex items-center px-5">
            <span
              className={
                variant === "sub"
                  ? "text-sm font-medium text-white drop-shadow-md"
                  : "text-base font-medium text-white drop-shadow-md"
              }
            >
              {targetBanner.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
