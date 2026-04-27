import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./IconButton";
import { SealCheck, Heart, UsersThree } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThlMCIvPjwvc3ZnPg==";

interface CenterCardProps {
  imageUrl: string;
  name: string;
  location: string;
  isSubscribed?: boolean;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  centerId?: string;
  imagePriority?: boolean;
}

function CenterCard({
  imageUrl,
  name,
  location,
  isSubscribed = false,
  isLiked = false,
  onLikeToggle,
  centerId,
  imagePriority = false,
}: CenterCardProps) {
  const router = useRouter();
  const [hasImageError, setHasImageError] = useState(false);
  const hasValidImage = imageUrl && imageUrl.trim() !== "" && !hasImageError;

  const handleCardClick = () => {
    if (centerId) {
      router.push(`/list/center/${centerId}`);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between w-full min-w-0 cursor-pointer"
      )}
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      aria-label={`${name} 보호센터 상세 보기`}
      onKeyDown={(e) => { if (e.key === "Enter") handleCardClick(); }}
    >
      <div className="flex items-center flex-1 min-w-0 mr-3 space-x-3">
        <div className="relative w-[63px] h-[63px] rounded-md border border-lg overflow-hidden flex-shrink-0 bg-gray-300 flex items-center justify-center">
          {hasValidImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="63px"
              className="object-cover"
              priority={imagePriority}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              onError={() => {
                setHasImageError(true);
              }}
            />
          ) : (
            <UsersThree size={40} className="text-gray-500" weight="light" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 py-2 space-y-1">
          <div className="flex items-center space-x-1 min-w-0">
            <span className="font-semibold text-[15px] leading-snug text-bk line-clamp-2 min-w-0">{name}</span>
            {isSubscribed && (
              <SealCheck size={16} className="text-brand-light flex-shrink-0" weight="fill" />
            )}
          </div>
          <span className="text-sm text-dg leading-tight line-clamp-1">{location}</span>
        </div>
      </div>
      {/* 오른쪽: 하트 버튼 - 로그인한 경우에만 표시 */}
      {onLikeToggle && (
        <div onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={({ size, className }) => {
              const heartClassName = isLiked
                ? cn(className, "text-brand")
                : cn(className, "text-lg");

              return isLiked ? (
                <Heart size={size} className={heartClassName} weight="fill" />
              ) : (
                <Heart
                  size={size}
                  className={heartClassName}
                  weight="regular"
                />
              );
            }}
            size="iconM"
            label="좋아요"
            onClick={() => {
              console.log("하트 버튼 클릭됨, centerId:", centerId);
              onLikeToggle();
            }}
          />
        </div>
      )}
    </div>
  );
}

export { CenterCard };
