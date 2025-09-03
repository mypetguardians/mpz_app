"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ShareNetwork } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { IconButton } from "@/components/ui/IconButton";
import { useGetUserProfile, useGetPublicPosts } from "@/hooks";
import type { Post } from "@/types/posts";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  // 실제 API를 사용하여 사용자 프로필과 게시글 가져오기
  const {
    data: userProfile,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserProfile();
  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetPublicPosts({ userId });

  // 로딩 상태 처리
  if (isUserLoading || isPostsLoading) {
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
  if (userError || postsError) {
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

  // 사용자 정보가 없는 경우
  if (!userProfile) {
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
          <p className="text-gray-500">사용자를 찾을 수 없습니다.</p>
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
          <h4>{userProfile.nickname || userProfile.name}님이 쓴 다른 글</h4>
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
        <div className="flex flex-col items-center gap-3 mx-auto pb-6 border-b border-bg">
          <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden">
            <Image
              src={userProfile.image || "/img/dummyImg.png"}
              alt={userProfile.nickname || userProfile.name}
              className="object-cover"
              fill
            />
          </div>
          <div>
            <h3 className="font-semibold text-bk">
              {userProfile.nickname || userProfile.name}
            </h3>
          </div>
        </div>

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
