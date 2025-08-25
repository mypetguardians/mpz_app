"use client";

import Image from "next/image";

import { ThumbsUp, DotsThree, Bell } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import type { Post } from "@/types/posts";
import { getRelativeTime } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { useToggleLike, useCheckPostLike } from "@/hooks";

type PostDetail = Post;

type User = {
  id: string;
  nickname: string;
  profileImg: string;
};

interface CommunityDetailProps {
  post: PostDetail;
  users: User[];
  isMyPost?: boolean;
  onReport?: () => void;
  onPostAction?: () => void;
  onUserClick?: (userId: string) => void;
  onLoginRequired?: () => void;
}

export function CommunityDetail({
  post,
  users,
  isMyPost,
  onReport,
  onPostAction,
  onUserClick,
  onLoginRequired,
}: CommunityDetailProps) {
  const { images, title, content, createdAt, userId, contentTags } = post;
  const { isAuthenticated } = useAuth();
  const [currentLikeCount, setCurrentLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const toggleLikeMutation = useToggleLike();
  const { data: likeData } = useCheckPostLike(post.id);

  const user = users.find((u) => u.id === userId);
  const author = user?.nickname || "사용자";
  const profileImage = user?.profileImg;

  // 좋아요 상태 초기화
  useEffect(() => {
    if (likeData) {
      setIsLiked(likeData.isLiked);
      setCurrentLikeCount(likeData.likeCount);
    }
  }, [likeData]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    try {
      const result = await toggleLikeMutation.mutateAsync({ postId: post.id });
      setIsLiked(result.isLiked);
      setCurrentLikeCount(result.likeCount);
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  const renderGallery = () => {
    // 이미지가 없으면 아무것도 표시하지 않음
    if (!images || images.length === 0) {
      return null;
    }

    return (
      <div className="mb-3">
        {images.length === 1 ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={images[0].imageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className={`relative rounded-lg overflow-hidden ${
                  i === 0 && images.length === 3 ? "col-span-2" : ""
                }`}
                style={{
                  height: i === 0 && images.length === 3 ? "200px" : "150px",
                }}
              >
                <Image
                  src={img.imageUrl}
                  alt={`feed-img-${i}`}
                  fill
                  className="object-cover"
                />
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 사용자 정보 */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div
          className={`flex items-center gap-3 ${
            onUserClick
              ? "cursor-pointer hover:opacity-70 transition-opacity"
              : ""
          }`}
          onClick={onUserClick ? () => onUserClick(userId) : undefined}
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={profileImage || "/img/dummyImg.jpeg"}
              alt={author}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{author}</h4>
          </div>
        </div>

        {/* 신고하기 또는 게시글 작업 버튼 */}
        <div>
          {isMyPost ? (
            <IconButton
              icon={({ size }) => <DotsThree size={size} weight="bold" />}
              size="iconM"
              onClick={onPostAction}
              className="text-gray-500 hover:text-gray-700"
            />
          ) : (
            <MiniButton
              text="신고하기"
              leftIcon={<Bell size={20} />}
              onClick={onReport}
              className="text-sm text-gray-500 py-1"
            />
          )}
        </div>
      </div>

      {/* 이미지 갤러리 */}
      {renderGallery()}
      <div className="flex flex-col gap-1 items-start mb-2 px-4">
        {/* 제목 */}
        <h4 className="text-black">{title}</h4>

        {/* 내용 */}
        <p className="text-gray-800 leading-relaxed">
          {content.replace(/#\w+/g, "")}
        </p>

        {/* 날짜 */}
        {createdAt && (
          <div className="text-gray-500 text-sm">
            {getRelativeTime(createdAt)}
          </div>
        )}
      </div>

      {/* 해시태그 */}
      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide px-4">
        <MiniButton
          text={`좋아요 ${currentLikeCount}`}
          leftIcon={<ThumbsUp />}
          variant={isLiked ? "filterOn" : "filterOff"}
          onClick={handleLikeToggle}
          disabled={toggleLikeMutation.isPending}
        />
        {contentTags &&
          contentTags
            .split(",")
            .map((tag, index) => (
              <MiniButton
                key={index}
                text={`#${tag.trim()}`}
                variant="outline"
              />
            ))}
      </div>
    </div>
  );
}
