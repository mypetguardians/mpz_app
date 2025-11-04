import React from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { MiniButton } from "@/components/ui/MiniButton";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import { useGetCenterPosts } from "@/hooks/query/useGetCenterPosts";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Animal } from "@/types/animal";
import type { ApiPostResponse, Post } from "@/types/posts";

interface RelatedPostsProps {
  currentPet: Animal;
  title?: string;
}

export default function RelatedPosts({
  currentPet,
  title = "이 아이에 대해 더 알고싶다면",
}: RelatedPostsProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // 센터 사용자 체크
  const isCenterUser =
    !authLoading &&
    isAuthenticated &&
    (user?.userType === "센터관리자" ||
      user?.userType === "훈련사" ||
      user?.userType === "센터최고관리자");

  // 센터권한자용 게시물 조회 (로그인한 센터 사용자만)
  const centerPostsQuery = useGetCenterPosts(
    {
      animalId: currentPet.id,
      page_size: 6,
    },
    {
      enabled: !authLoading && isAuthenticated && isCenterUser,
    }
  );

  // 일반 사용자용 게시물 조회 (미로그인 및 일반 사용자)
  const publicPostsQuery = useGetPublicPosts({
    animalId: currentPet.id,
    page_size: 6,
  });

  // 권한에 따라 적절한 쿼리 선택
  const activeQuery =
    isCenterUser && !centerPostsQuery.error
      ? centerPostsQuery
      : publicPostsQuery;

  const postsData = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;

  // 현재 동물과 관련된 게시물
  const relatedPosts = postsData?.data || [];

  // 실제로 현재 동물과 연관된 게시물만 필터링
  const filteredPosts = relatedPosts.filter(
    (post: ApiPostResponse) => post.animal_id === currentPet.id
  );

  // 표시할 게시물 결정
  const displayPosts = filteredPosts;

  if (isLoading) {
    return (
      <div className="mx-4 my-3">
        <h2 className="text-bk mb-4">{title}</h2>
        <div className="text-center py-4 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-3">
        <h2 className="text-bk mb-4">{title}</h2>
        <div className="text-center py-4 text-red-500">
          게시물을 불러오는데 실패했습니다
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3 flex flex-col gap-4">
      <div>
        <h2 className="text-bk mb-4">{title}</h2>
        {displayPosts.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {displayPosts.slice(0, 3).map((post: ApiPostResponse) => (
              <div key={post.id} className="flex-shrink-1 w-full">
                <CommunityCard
                  item={post as unknown as Post}
                  users={[]}
                  variant="primary"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>아직 이 아이에 대한 게시물이 없어요</p>
          </div>
        )}
      </div>
      {displayPosts.length > 0 && (
        <MiniButton
          text="더보기"
          variant="filterOff"
          className="py-4 w-full"
          rightIcon={<CaretDown size={12} />}
          onClick={() => router.push(`/community?animalId=${currentPet.id}`)}
        />
      )}
    </div>
  );
}
