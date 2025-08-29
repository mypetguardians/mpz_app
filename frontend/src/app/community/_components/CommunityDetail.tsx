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
  const { images, title, content, createdAt, userId, tags, likeCount } = post;
  const { isAuthenticated } = useAuth();
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);

  const toggleLikeMutation = useToggleLike();
  const { data: likeData, isLoading: isLikeLoading } = useCheckPostLike(
    post.id
  );

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

  // 게시글의 기본 좋아요 개수로 초기화
  useEffect(() => {
    if (likeCount !== undefined) {
      setCurrentLikeCount(likeCount);
    }
  }, [likeCount]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    try {
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked
        ? currentLikeCount + 1
        : currentLikeCount - 1;

      setIsLiked(newIsLiked);
      setCurrentLikeCount(newLikeCount);

      const result = await toggleLikeMutation.mutateAsync({ postId: post.id });

      setIsLiked(result.isLiked);
      setCurrentLikeCount(result.likeCount);
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
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
      <div className="mb-3">
        {imageUrls.length === 1 ? (
          <div className="relative w-[330px] h-[330px] overflow-hidden">
            <Image
              src={imageUrls[0]}
              alt={title}
              fill
              className="object-fill"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {imageUrls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                className={`relative rounded-lg overflow-hidden ${
                  i === 0 && imageUrls.length === 3 ? "col-span-2" : ""
                }`}
                style={{
                  height: i === 0 && imageUrls.length === 3 ? "200px" : "150px",
                }}
              >
                <Image
                  src={url}
                  alt={`feed-img-${i}`}
                  fill
                  className="object-fill"
                />
                {i === 3 && imageUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">
                      +{imageUrls.length - 4}
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
          {content.replace(/#[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_-]+/g, "")}
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
          disabled={toggleLikeMutation.isPending || isLikeLoading}
          className={
            toggleLikeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
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
