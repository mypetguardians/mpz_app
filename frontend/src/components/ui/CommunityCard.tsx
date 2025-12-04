import React, { useMemo, useState } from "react";
import Image from "next/image";

import { ThumbsUp, ChatCircle, User } from "@phosphor-icons/react";
import { ProfileInfo } from "./ProfileInfo";
import { IconButton } from "./IconButton";
import { BottomSheet } from "./BottomSheet";
import type { Post } from "@/types/posts";
import { getRelativeTime } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

// 공용 폴백 이미지 컴포넌트를 외부로 이동
const FallbackImage = ({
  src,
  alt,
  className,
  fill,
  priority = false,
  loading = "lazy",
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  loading?: "lazy" | "eager";
  sizes?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src || src === "") {
    return (
      <div
        className={`bg-lg flex items-center justify-center rounded-md ${className}`}
      >
        <User size={24} weight="regular" className="text-gr" />
      </div>
    );
  }

  // sizes에서 작은 이미지인지 확인 (100px 이하)
  const isSmallImage =
    sizes && /^\d+px$/.test(sizes.trim()) && parseInt(sizes) <= 200;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      {...(fill ? { fill: true } : {})}
      priority={priority}
      loading={loading}
      sizes={
        sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      }
      // 작은 이미지는 quality를 더 낮춰서 파일 크기 최적화
      quality={isSmallImage ? 60 : priority ? 80 : 70}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={() => setHasError(true)}
    />
  );
};

interface User {
  id: string;
  nickname?: string | null;
  image?: string | null;
  createdAt?: string | null;
}

type CommunityCardVariant = "primary" | "variant2" | "variant3" | "variant4";

interface CommunityCardProps {
  item: Post;
  users: User[];
  variant?: CommunityCardVariant;
  onUserClick?: (userId: string) => void;
  currentUserId?: string;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  priority?: boolean; // 첫 화면에 보이는 이미지에 priority 적용
}

export function CommunityCard({
  item,
  users,
  variant = "primary",
  onUserClick,
  //currentUserId,
  onEditPost,
  onDeletePost,
  priority = false,
}: CommunityCardProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();

  const {
    images,
    title,
    content,
    like_count,
    comment_count,
    created_at,
    user_id,
    user_nickname,
    user_image,
    is_liked,
  } = item;

  // images 배열에서 유효한 URL 추출 (API 키 케이스 다양성 대응: imageUrl, image_url, file_url, url)
  const imageUrls = useMemo(() => {
    if (!images || images.length === 0) return [] as string[];
    const extract = (img: unknown): string => {
      if (typeof img === "string") return img;
      if (typeof img === "object" && img !== null) {
        const obj = img as {
          imageUrl?: unknown;
          image_url?: unknown;
          file_url?: unknown;
          url?: unknown;
        };
        const candidate =
          (obj.image_url as string | undefined) ??
          (obj.imageUrl as string | undefined) ??
          (obj.file_url as string | undefined) ??
          (obj.url as string | undefined);
        return typeof candidate === "string" ? candidate : "";
      }
      return "";
    };
    return images
      .map(extract)
      .filter(
        (url: string): url is string => Boolean(url) && url.trim() !== ""
      );
  }, [images]);

  // like, comment, date를 Post 타입에 맞게 매핑
  const like = like_count || 0;
  const comment = comment_count || 0;
  const date = created_at;

  const foundUser = users.find((u) => u.id === user_id);
  const rawNickname = user_nickname || foundUser?.nickname || "알 수 없음";
  const userType = item.user_type;
  const centerName = item.center_name;

  // 센터 계정인 경우 "센터이름 - 닉네임" 형식으로 표시
  const author =
    userType &&
    ["센터관리자", "센터최고관리자", "훈련사"].includes(userType) &&
    centerName
      ? `${centerName} - ${rawNickname}`
      : rawNickname;

  // 현재 로그인된 사용자의 게시물인 경우 Auth context에서 이미지 가져오기
  const isCurrentUserPost = user?.id === user_id;
  const profileImage =
    user_image && user_image.trim() && user_image !== "null"
      ? user_image
      : isCurrentUserPost &&
        user?.image &&
        user.image.trim() &&
        user.image !== "null"
      ? user.image
      : foundUser?.image && foundUser.image.trim() && foundUser.image !== "null"
      ? foundUser.image
      : undefined;

  // const isMyPost = currentUserId && userId && currentUserId === userId;

  const handleEditClick = () => {
    setIsActionSheetOpen(false);
    onEditPost?.(item.id);
  };

  const handleDeleteClick = () => {
    setIsActionSheetOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false);
    onDeletePost?.(item.id);
  };

  const renderGallery = (size = 80) => {
    if (imageUrls.length === 0) return null;

    return (
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
        {imageUrls.map((url: string, i: number) => {
          // URL이 유효한지 확인
          if (!url || url.trim() === "") return null;

          // 첫 번째 이미지만 priority 적용
          const isPriority = priority && i === 0;

          return (
            <div
              key={i}
              className={`relative rounded-md overflow-hidden flex-shrink-0`}
              style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size,
              }}
            >
              <FallbackImage
                src={url}
                alt={`feed-img-${i}`}
                className="object-cover"
                fill
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                sizes={`${size}px`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (variant === "variant2") {
    return (
      <div className="w-full flex flex-col">
        {imageUrls.length > 0 && imageUrls[0] && imageUrls[0].trim() !== "" && (
          <div className="relative w-full aspect-square overflow-hidden rounded-md mb-3">
            <FallbackImage
              src={imageUrls[0]}
              alt={title}
              className="object-cover"
              fill
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 420px"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-gray-300 flex-shrink-0"></div>
          <span className="text-sm font-medium text-gray-700">{author}</span>
        </div>
        <h4 className="text-bk font-bold mb-2">{title}</h4>
        <div className="flex items-center justify-between text-sm text-gray-500">
          {date && <span>{getRelativeTime(date)}</span>}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp
                size={16}
                weight={is_liked ? "fill" : "regular"}
                className={is_liked ? "text-blue-500" : ""}
              />
              {like}
            </span>
            <span className="flex items-center gap-1">
              <ChatCircle size={16} />
              {comment}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "variant3") {
    return (
      <div className="max-w-[420px] border-b border-bg pb-6">
        <div className="flex items-center justify-between mb-2">
          <ProfileInfo
            author={author}
            profileImage={profileImage}
            size="md"
            onClick={onUserClick ? () => onUserClick(user_id) : undefined}
          />
        </div>
        {renderGallery(100)}
        <h4 className="text-bk overflow-hidden">{title}</h4>
        <div className="text-dg body2 line-clamp-3">{content}</div>
        <div className="flex items-center justify-between gap-6 text-gray-400 mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <IconButton
                icon={({ size }) => (
                  <ThumbsUp
                    size={size}
                    weight={is_liked ? "fill" : "regular"}
                    className={is_liked ? "text-blue-500" : ""}
                  />
                )}
                size="iconS"
              />
              {like}
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                icon={({ size }) => <ChatCircle size={size} />}
                size="iconS"
              />
              {comment}
            </div>
          </div>
          {date && <h6 className="text-gr">{getRelativeTime(date)}</h6>}
        </div>
      </div>
    );
  }

  if (variant === "variant4") {
    return (
      <div className="max-w-[420px]">
        <div className="font-bold text-xl mb-2 text-bk dark:text-white">
          {title}
        </div>
        {renderGallery(90)}
        <div className="text-gray-400 text-base mb-2">{content}</div>
        <div className="flex items-center gap-6 text-gray-400 mt-2">
          <div className="flex items-center gap-1">
            <IconButton
              icon={({ size }) => (
                <ThumbsUp
                  size={size}
                  weight={is_liked ? "fill" : "regular"}
                  className={is_liked ? "text-blue-500" : ""}
                />
              )}
              size="iconS"
            />
            {like}
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={({ size }) => <ChatCircle size={size} />}
              size="iconS"
            />
            {comment}
          </div>
          {date && (
            <div className="text-gray-400 text-xs ml-auto">
              {getRelativeTime(date)}
            </div>
          )}
        </div>
        <hr className="mt-5 border-gray-400/30" />
      </div>
    );
  }

  // 기본(primary) 카드
  return (
    <div className="flex gap-4 items-start w-full">
      <div
        className={`flex flex-col flex-1 justify-between ${
          imageUrls.length > 0 ? "h-[119px]" : ""
        }`}
      >
        <div className="flex flex-col gap-1 w-full">
          <ProfileInfo
            author={author}
            profileImage={profileImage}
            size="md"
            className="mb-1"
          />
          <h4 className="text-bk">{title}</h4>
          <h6 className="text-gr line-clamp-2">{content}</h6>
        </div>
        <div className="flex gap-3 text-gr">
          <div className="flex items-center gap-0.5 text-h6b">
            <IconButton
              icon={({ size }) => (
                <ThumbsUp
                  size={size}
                  weight={is_liked ? "fill" : "regular"}
                  className={is_liked ? "text-blue-500" : ""}
                />
              )}
              size="iconS"
            />
            {like}
          </div>
          <div className="flex items-center gap-0.5 text-h6b">
            <IconButton
              icon={({ size }) => <ChatCircle size={size} />}
              size="iconS"
            />
            {comment}
          </div>
        </div>
      </div>
      {imageUrls.length > 0 && (
        <div className="flex-shrink-0">
          <div className="relative w-[112px] h-[119px] rounded-md overflow-hidden">
            <FallbackImage
              src={imageUrls[0]}
              alt={title}
              className="object-cover"
              fill
              priority={priority}
              loading="lazy"
              sizes="112px"
            />
          </div>
        </div>
      )}
      {/* 게시글 작업 선택 바텀시트 */}
      <BottomSheet
        open={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        variant="primary"
        title="게시글 작업을 선택하세요."
        leftButtonText="게시글 수정"
        rightButtonText="게시글 삭제"
        onLeftClick={handleEditClick}
        onRightClick={handleDeleteClick}
      />

      {/* 삭제 확인 모달 */}
      <BottomSheet
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        variant="primary"
        title="정말 삭제하시겠습니까?"
        description="삭제된 정보는 되돌릴 수 없어요."
        leftButtonText="아니요"
        rightButtonText="네, 삭제할래요"
        onLeftClick={() => setIsDeleteModalOpen(false)}
        onRightClick={handleConfirmDelete}
      />
    </div>
  );
}
