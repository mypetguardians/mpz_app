"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { getProxyImageUrl } from "@/lib/getProxyImageUrl";
import { cn } from "@/lib/utils";

type ForwardImageProps = Omit<ImageProps, "src" | "alt" | "className">;

interface AnimalImageProps extends ForwardImageProps {
  imageUrl?: string | null;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
  emptyText?: string;
}

/**
 * 공공데이터 이미지를 안전하게 보여주기 위한 컴포넌트.
 */
export default function AnimalImage({
  imageUrl,
  alt,
  containerClassName,
  imageClassName,
  emptyText = "이미지 로딩 실패",
  onLoad,
  onError,
  ...imageProps
}: AnimalImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const proxiedImageUrl = getProxyImageUrl(imageUrl);
  const shouldShowFallback = !proxiedImageUrl || hasError;

  if (shouldShowFallback) {
    return (
      <div
        className={cn(
          "bg-gray-200 flex items-center justify-center text-gray-400",
          containerClassName
        )}
      >
        <span className="text-xs">{emptyText}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <Image
        {...imageProps}
        src={proxiedImageUrl}
        alt={alt}
        className={cn("object-cover", imageClassName)}
        onLoad={(event) => {
          setIsLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setHasError(true);
          setIsLoading(false);
          onError?.(event);
        }}
      />
    </div>
  );
}
