import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./IconButton";
import { SealCheck, Heart, UsersThree } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center gap-3">
        <div className="relative w-[63px] h-[63px] rounded-md border border-lg overflow-hidden flex-shrink-0 bg-gray-300 flex items-center justify-center">
          {hasValidImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="63px"
              className="object-cover"
              priority={imagePriority}
              onError={() => {
                setHasImageError(true);
              }}
            />
          ) : (
            <UsersThree size={40} className="text-gray-500" weight="light" />
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 gap-1">
          <div className="flex items-center gap-1">
            <h4 className="text-bk">{name}</h4>
            {isSubscribed && (
              <SealCheck size={14} className="text-brand-light" weight="fill" />
            )}
          </div>
          <h6 className="text-dg">{location}</h6>
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
