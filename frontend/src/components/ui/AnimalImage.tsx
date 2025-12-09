"use client";

import { useState, useEffect, useMemo } from "react";
import Image, { type ImageProps } from "next/image";
import { getProxyImageUrl } from "@/lib/getProxyImageUrl";
import { cn } from "@/lib/utils";

type ForwardImageProps = Omit<ImageProps, "src" | "alt" | "className">;

interface AnimalImageProps extends ForwardImageProps {
  imageUrl?: string | null;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
}

/**
 * 이미지를 안전하게 보여주기 위한 컴포넌트.
 */
export default function AnimalImage({
  imageUrl,
  alt,
  containerClassName,
  imageClassName,
  onLoad,
  onError,
  ...imageProps
}: AnimalImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const proxiedImageUrl = useMemo(() => getProxyImageUrl(imageUrl), [imageUrl]);
  const isProxyUrl = proxiedImageUrl?.startsWith("/api/proxy-image") ?? false;
  const shouldShowFallback = !proxiedImageUrl || hasError;

  // proxiedImageUrl이 변경될 때만 상태 초기화
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [proxiedImageUrl]);

  if (shouldShowFallback) {
    return (
      <div
        className={cn(
          "bg-gray-200 flex items-center justify-center text-gray-400",
          containerClassName
        )}
      >
        <Image
          src="/img/op-image.svg"
          alt={alt || "이미지 없음"}
          width={imageProps.width || 100}
          height={imageProps.height || 100}
          className={cn("object-contain", imageClassName)}
          sizes={imageProps.sizes || "100vw"}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <Image
        {...imageProps}
        key={proxiedImageUrl}
        src={proxiedImageUrl}
        alt={alt}
        className={cn("object-cover", imageClassName)}
        unoptimized={isProxyUrl}
        onLoad={(event) => {
          setIsLoading(false);
          setHasError(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          console.error("AnimalImage: 이미지 로드 실패", {
            proxiedImageUrl,
            imageUrl,
            retryCount,
          });
          setHasError(true);
          setIsLoading(false);
          onError?.(event);
        }}
      />
    </div>
  );
}
