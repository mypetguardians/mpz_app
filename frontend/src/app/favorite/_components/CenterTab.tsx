"use client";

import { useState, useEffect } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenterFavorites, useToggleCenterFavorite } from "@/hooks";

const ITEMS_PER_PAGE = 10;

function CenterTab() {
  const [page, setPage] = useState(1);
  const {
    data: favoritesData,
    isLoading,
    error,
    isFetching,
  } = useGetCenterFavorites(page, ITEMS_PER_PAGE);

  const toggleCenterFavorite = useToggleCenterFavorite();

  const centers = favoritesData?.centers || [];
  const hasMore = favoritesData?.hasNext || false;
  const total = favoritesData?.total || 0;

  // 찜하기 토글 처리
  const handleLikeToggle = (centerId: string) => {
    toggleCenterFavorite.mutate({ centerId });
  };

  // 무한스크롤 처리
  const loadMoreCenters = () => {
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
        loadMoreCenters();
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
          찜한 센터를 불러오는데 실패했습니다.
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
  if (centers.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">찜한 센터가 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 px-4">
        {centers.map((center) => (
          <div key={center.id}>
            <CenterCard
              imageUrl="/img/dummyImg.jpeg" // 더미 이미지 사용
              name={center.name}
              location={center.location || "위치 정보 없음"}
              verified={false} // 임시
              isLiked={center.isFavorited}
              onLikeToggle={() => handleLikeToggle(center.id)}
              centerId={center.id}
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
            onClick={loadMoreCenters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 전체 개수 표시 */}
      {total > 0 && (
        <div className="text-center py-2 text-sm text-gray-500">
          총 {total}개의 찜한 센터
        </div>
      )}
    </div>
  );
}

export { CenterTab };
