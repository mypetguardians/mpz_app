import React from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { MiniButton } from "@/components/ui/MiniButton";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import type { Animal } from "@/types/animal";
import type { ApiPostResponse, Post } from "@/types/posts";

interface RelatedPostsProps {
  currentPet: Animal;
  title?: string;
}

export default function RelatedPosts({ currentPet }: RelatedPostsProps) {
  const router = useRouter();

  // 선택된 동물 ID와 관련된 게시물 가져오기
  const {
    data: postsData,
    isLoading,
    error,
  } = useGetPublicPosts({
    animalId: currentPet.id,
    page_size: 6,
  });

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
        <h2 className="text-bk mb-4">관련 게시물</h2>
        <div className="text-center py-4 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-3">
        <h2 className="text-bk mb-4">관련 게시물</h2>
        <div className="text-center py-4 text-red-500">
          게시물을 불러오는데 실패했습니다
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3 flex flex-col gap-4">
      <div>
        <h2 className="text-bk mb-4">이 아이에 대해 더 알고싶다면</h2>
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
            <p className="text-sm mt-1">첫 번째 게시물을 작성해보세요!</p>
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
