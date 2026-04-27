"use client";

import { useState, useEffect, useMemo } from "react";
import Image, { type ImageProps } from "next/image";
import { getProxyImageUrl } from "@/lib/getProxyImageUrl";
import { cn } from "@/lib/utils";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThlMCIvPjwvc3ZnPg==";

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
  const [hasError, setHasError] = useState(false);
  const proxiedImageUrl = useMemo(() => getProxyImageUrl(imageUrl), [imageUrl]);
  const shouldShowFallback = !proxiedImageUrl || hasError;

  useEffect(() => {
    setHasError(false);
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
      <Image
        {...imageProps}
        key={proxiedImageUrl}
        src={proxiedImageUrl}
        alt={alt}
        className={cn("object-cover", imageClassName)}
        sizes={imageProps.sizes || "(max-width: 420px) 50vw, 33vw"}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        onLoad={(event) => {
          onLoad?.(event);
        }}
        onError={(event) => {
          setHasError(true);
          onError?.(event);
        }}
      />
    </div>
  );
}
