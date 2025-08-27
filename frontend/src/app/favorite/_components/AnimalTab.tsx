"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PetCard } from "@/components/ui/PetCard";
import { useGetAnimalFavorites } from "@/hooks";

const ITEMS_PER_PAGE = 10;

function AnimalTab() {
  const [page, setPage] = useState(1);
  const {
    data: favoritesData,
    isLoading,
    error,
    isFetching,
  } = useGetAnimalFavorites(page, ITEMS_PER_PAGE);
  const router = useRouter();
  const pets = favoritesData?.animals || [];
  const hasMore = favoritesData?.hasNext || false;
  const total = favoritesData?.total || 0;

  // 무한스크롤 처리
  const loadMorePets = () => {
    if (isFetching || !hasMore) return;
    setPage((prev) => prev + 1);
  };

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        loadMorePets();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetching, hasMore]);

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          찜한 동물을 불러오는데 실패했습니다.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 데이터가 없고 로딩 중이 아닌 경우
  if (pets.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">찜한 동물이 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-start gap-2 px-4">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="w-[calc(50%-4px)]"
            onClick={() => router.push(`/list/animal/${pet.id}`)}
          >
            <PetCard
              pet={{
                id: pet.id,
                name: pet.name,
                isFemale: pet.isFemale,
                status: pet.status,
                //TODO foundLocation: pet.foundLocation,
                animalImages: ["/img/dummyImg.jpeg"],
              }}
              variant="primary"
              imageSize="full"
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* 로딩 상태 */}
      {(isLoading || isFetching) && (
        <div className="text-center py-4">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {hasMore && !isFetching && (
        <div className="text-center py-4">
          <button
            onClick={loadMorePets}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 전체 개수 표시 */}
      {total > 0 && (
        <div className="text-center py-2 text-sm text-gray-500">
          총 {total}개의 찜한 동물
        </div>
      )}
    </div>
  );
}

export { AnimalTab };
