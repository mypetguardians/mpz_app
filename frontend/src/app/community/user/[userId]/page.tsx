"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ShareNetwork, User } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { IconButton } from "@/components/ui/IconButton";

import type { Post } from "@/types/posts";
import { useGetPublicPosts } from "@/hooks";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetPublicPosts({ user_id: userId });

  // 로딩 상태 처리
  if (isPostsLoading) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => window.history.back()}
              />
              <h2>작성자가 쓴 다른 글</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (postsError) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => window.history.back()}
              />
              <h2>작성자가 쓴 다른 글</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">데이터를 불러오는데 실패했습니다.</p>
        </div>
      </Container>
    );
  }

  const userPosts = postsData?.data || [];

  return (
    <Container className="min-h-screen bg-white">
      <TopBar
        variant="variant5"
        className="border-b border-lg"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => window.history.back()}
            />
          </div>
        }
        center={
          <h4>
            {userPosts.length > 0
              ? userPosts[0].user_nickname || "사용자"
              : "사용자"}
            님이 쓴 다른 글
          </h4>
        }
        right={
          <IconButton
            icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
            size="iconM"
          />
        }
      />
      <div className="px-4 py-3">
        {/* 사용자 프로필 헤더 */}
        {userPosts.length > 0 ? (
          <div className="flex flex-col items-center gap-2 mx-auto pb-6 border-b border-bg">
            {userPosts[0].user_image && userPosts[0].user_image !== "" ? (
              <Image
                src={userPosts[0].user_image}
                alt={userPosts[0].user_nickname}
                fill
                className="object-cover rounded-full w-16 h-16"
                unoptimized
                onError={(e) => {
                  console.error("ProfileInfo Image load error:", e);
                }}
              />
            ) : (
              <div
                className={`w-16 h-16 bg-lg flex items-center justify-center p-1 rounded-full`}
              >
                <User size={40} weight="regular" className="text-gr" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-bk">
                {userPosts[0].user_nickname || "사용자"}
              </h3>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mx-auto pb-6 border-b border-bg">
            <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden">
              {userPosts[0].user_image && userPosts[0].user_image !== "" ? (
                <Image
                  src={userPosts[0].user_image}
                  alt={userPosts[0].user_nickname}
                  fill
                  className="object-cover rounded-full w-16 h-16"
                  unoptimized
                  onError={(e) => {
                    console.error("ProfileInfo Image load error:", e);
                  }}
                />
              ) : (
                <div
                  className={`w-16 h-16 bg-lg flex items-center justify-center p-1 rounded-full`}
                >
                  <User size={40} weight="regular" className="text-gr" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-bk">사용자</h3>
            </div>
          </div>
        )}

        <div>
          {userPosts.length === 0 ? (
            <div className="flex flex-col min-h-screen items-center justify-center">
              <div className="py-4.5 rounded-lg bg-bg w-full">
                <h5 className="text-gr text-center">
                  아직 업로드된 게시글이 없어요.
                  <br />첫 번째 게시글을 작성해보세요!
                </h5>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer">
              {userPosts.map((item) => (
                <div key={item.id} className="py-4">
                  <a href={`/community/${item.id}`} className="block">
                    <CommunityCard
                      item={item as unknown as Post}
                      users={[]}
                      variant="variant3"
                    />
                  </a>
                </div>
              ))}
            </div>
          )}
          <div className="h-20" />
        </div>
      </div>
    </Container>
  );
}
