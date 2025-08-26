import React, { useState } from "react";
import Image from "next/image";

import { ThumbsUp, ChatCircle } from "@phosphor-icons/react";
import { ProfileInfo } from "./ProfileInfo";
import { IconButton } from "./IconButton";
import { BottomSheet } from "./BottomSheet";
import type { Post } from "@/types/posts";
import { getRelativeTime } from "@/lib/utils";

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
}

export function CommunityCard({
  item,
  users,
  variant = "primary",
  onUserClick,
  //currentUserId,
  onEditPost,
  onDeletePost,
}: CommunityCardProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    images,
    title,
    content,
    postLikes,
    comments,
    createdAt,
    userId,
    userNickname,
    userImage,
  } = item;

  // images 배열에서 imageUrl 추출, 이미지가 없으면 빈 배열 반환
  const imageUrls =
    images.length > 0
      ? images.map((img: { imageUrl: string }) => img.imageUrl)
      : [];

  // like, comment, date를 Post 타입에 맞게 매핑
  const like = postLikes?.length || 0;
  const comment = comments?.length || 0;
  const date = createdAt;

  const user = users.find((u) => u.id === userId);
  const author = userNickname || user?.nickname || "알 수 없음";
  const profileImage = userImage || user?.image || undefined;

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
        {imageUrls.map((url: string, i: number) => (
          <div
            key={i}
            className={`relative rounded-sm overflow-hidden flex-shrink-0`}
            style={{
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
            }}
          >
            <Image
              src={url}
              alt={`feed-img-${i}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  if (variant === "variant2") {
    return (
      <div className="w-full flex flex-col">
        {imageUrls.length > 0 && (
          <div className="relative w-full aspect-square overflow-hidden rounded-sm mb-3">
            <Image
              src={imageUrls[0]}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"></div>
          <span className="text-sm font-medium text-gray-700">{author}</span>
        </div>
        <h4 className="text-bk font-bold mb-2">{title}</h4>
        <div className="flex items-center justify-between text-sm text-gray-500">
          {date && <span>{getRelativeTime(date)}</span>}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp size={16} />
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
            onClick={onUserClick ? () => onUserClick(userId) : undefined}
          />
        </div>
        {renderGallery(100)}
        <h4 className="text-bk">{title}</h4>
        <div className="text-dg body2 line-clamp-3">{content}</div>
        <div className="flex items-center justify-between gap-6 text-gray-400 mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <IconButton
                icon={({ size }) => <ThumbsUp size={size} />}
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
              icon={({ size }) => <ThumbsUp size={size} />}
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
    <div className="flex gap-4 items-start">
      {imageUrls.length > 0 && (
        <div className="flex-shrink-0">
          <div className="relative w-[112px] h-[119px] rounded-md overflow-hidden">
            <Image
              src={imageUrls[0]}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div
        className={`flex flex-col flex-1 min-w-0 justify-between ${
          imageUrls.length > 0 ? "h-[119px]" : ""
        }`}
      >
        <div>
          <ProfileInfo
            author={author}
            profileImage={profileImage}
            size="md"
            className="mb-1"
          />
          <h4 className="text-bk">{title}</h4>
          <h6 className="text-gr line-clamp-2">{content}</h6>
        </div>
        <div className="flex items-right gap-3 text-gr ml-auto">
          <div className="flex items-center gap-1 text-h6b">
            <IconButton
              icon={({ size }) => <ThumbsUp size={size} />}
              size="iconS"
            />
            {like}
          </div>
          <div className="flex items-center gap-1 text-h6b">
            <IconButton
              icon={({ size }) => <ChatCircle size={size} />}
              size="iconS"
            />
            {comment}
          </div>
        </div>
      </div>
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
