"use client";

import Image from "next/image";

import { ThumbsUp, DotsThree, Bell, User } from "@phosphor-icons/react";
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
  isAuthorSubscriber?: boolean;
}

export function CommunityDetail({
  post,
  users,
  isMyPost,
  onReport,
  onPostAction,
  onUserClick,
  onLoginRequired,
  isAuthorSubscriber,
}: CommunityDetailProps) {
  const {
    images,
    title,
    content,
    created_at,
    user_id,
    tags,
    like_count,
    is_liked,
  } = post;
  const { isAuthenticated } = useAuth();
  const [currentLikeCount, setCurrentLikeCount] = useState(like_count || 0);
  const [isLiked, setIsLiked] = useState(is_liked || false);

  const toggleLikeMutation = useToggleLike();
  const { data: likeData, isLoading: isLikeLoading } = useCheckPostLike(
    post.id,
    isAuthenticated
  );

  const user = users.find((u) => u.id === user_id);
  const author = user?.nickname || "사용자";
  const profileImage = user?.profileImg;

  // 좋아요 상태 초기화
  useEffect(() => {
    if (isAuthenticated && likeData) {
      setIsLiked(likeData.is_liked);
      setCurrentLikeCount(likeData.total_likes);
    } else {
      setIsLiked(is_liked || false);
      setCurrentLikeCount(like_count || 0);
    }
  }, [isAuthenticated, likeData, is_liked, like_count]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    // 로딩 중이면 중복 요청 방지
    if (toggleLikeMutation.isPending || isLikeLoading) {
      return;
    }

    try {
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : currentLikeCount - 1;

      // 낙관적 업데이트
      setIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      const result = await toggleLikeMutation.mutateAsync({ postId: post.id });

      // 서버 응답으로 최종 상태 업데이트
      setIsLiked(result.is_liked);
      setCurrentLikeCount(result.total_likes);
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      // 실패 시 이전 상태로 롤백
      setIsLiked(!isLiked);
      setCurrentLikeCount(
        isLiked ? currentLikeCount - 1 : currentLikeCount + 1
      );
    }
  };

  const renderGallery = () => {
    if (!images || images.length === 0) {
      return null;
    }

    const imageUrls = images
      .map((img: unknown) => {
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
      })
      .filter((url: string) => Boolean(url) && url.trim() !== "");

    if (imageUrls.length === 0) return null;

    return (
      <div className="mb-3 w-full">
        {imageUrls.length === 1 ? (
          <div className="relative w-full max-w-[420px] mx-auto h-[330px] overflow-hidden">
            <Image
              src={imageUrls[0]}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {imageUrls.map((url, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-[330px] h-[330px] overflow-hidden"
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
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 사용자 정보 */}
      <div className="flex items-center justify-between pb-3 px-4">
        <div
          className={`flex items-center gap-3 ${
            onUserClick
              ? "cursor-pointer hover:opacity-70 transition-opacity"
              : ""
          }`}
          onClick={onUserClick ? () => onUserClick(user_id) : undefined}
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            {profileImage && profileImage !== "" ? (
              <Image
                src={profileImage}
                alt={author}
                fill
                className="object-cover rounded-full w-10 h-10"
                unoptimized
                onError={(e) => {
                  console.error("ProfileInfo Image load error:", e);
                }}
              />
            ) : (
              <div
                className={`w-10 h-10 bg-lg flex items-center justify-center p-1 rounded-full`}
              >
                <User size={28} weight="regular" className="text-gr" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{author}</h4>
            {isAuthorSubscriber && (
              <div className="px-2 py-1 bg-orange-100 border border-orange-200 rounded-full">
                <span className="text-xs text-orange-600 font-medium">
                  구독자
                </span>
              </div>
            )}
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
              variant="nomargin"
            />
          )}
        </div>
      </div>

      {/* 이미지 갤러리 */}
      {renderGallery()}
      <div className="flex flex-col gap-2 items-start px-4">
        {/* 제목 */}
        <h4 className="text-black mt-3">{title}</h4>

        {/* 내용 */}
        <p className="text-dg body2">
          {content.replace(/#[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_-]+/g, "")}
        </p>

        {/* 날짜 */}
        {created_at && (
          <div className="text-gray-500 text-sm">
            {getRelativeTime(created_at)}
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
          disabled={
            !isAuthenticated || toggleLikeMutation.isPending || isLikeLoading
          }
          className={
            !isAuthenticated || toggleLikeMutation.isPending || isLikeLoading
              ? "cursor-not-allowed opacity-50"
              : ""
          }
        />
        {tags &&
          Array.isArray(tags) &&
          tags.map(
            (
              tag: string | { tagName?: string; tag_name?: string },
              index: number
            ) => {
              const tagText =
                typeof tag === "string"
                  ? tag
                  : tag.tagName || tag.tag_name || "";
              if (!tagText) return null;

              return (
                <MiniButton
                  key={index}
                  text={`#${tagText}`}
                  variant="outline"
                />
              );
            }
          )}
      </div>
    </div>
  );
}
