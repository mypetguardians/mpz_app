import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconButton } from "./IconButton";
import { SealCheck, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CenterCardProps {
  imageUrl: string;
  name: string;
  location: string;
  verified?: boolean;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  centerId?: string;
}

function CenterCard({
  imageUrl,
  name,
  location,
  verified = false,
  isLiked = false,
  onLikeToggle,
  centerId,
}: CenterCardProps) {
  const router = useRouter();

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
    >
      <div className="flex items-center gap-3">
        <div className="relative w-[63px] h-[63px] rounded-md overflow-hidden flex-shrink-0 bg-gray-800">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col justify-center min-w-0 gap-1">
          <div className="flex items-center gap-1">
            <h4 className="text-bk">{name}</h4>
            {verified && (
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
