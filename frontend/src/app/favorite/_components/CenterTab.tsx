"use client";

import { useState, useEffect, useCallback } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { Buildings } from "@phosphor-icons/react";
import { EmptyState } from "@/components/common/EmptyState";
import { useGetCenterFavorites, useToggleCenterFavorite } from "@/hooks";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";
import type { CenterFavorite } from "@/types/favorites";

const ITEMS_PER_PAGE = 10;

function CenterTab() {
  const [page, setPage] = useState(1);
  const [centers, setCenters] = useState<CenterFavorite[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );
  const {
    data: favoritesData,
    isLoading,
    error,
    isFetching,
  } = useGetCenterFavorites(page, ITEMS_PER_PAGE);

  const toggleCenterFavorite = useToggleCenterFavorite();

  // 페이지 응답이 도착할 때마다 로컬 리스트와 메타데이터 갱신
  useEffect(() => {
    if (!favoritesData) return;

    setHasMore(favoritesData.hasNext);
    setTotal(favoritesData.total);

    setCenters((prev) => {
      if (page === 1) {
        return favoritesData.centers;
      }

      const merged = new Map(prev.map((center) => [center.id, center]));
      favoritesData.centers.forEach((center) => {
        merged.set(center.id, center);
      });
      return Array.from(merged.values());
    });
  }, [favoritesData, page]);

  // 찜하기 토글 처리
  const handleLikeToggle = (centerId: string) => {
    // 현재 찜하기 상태 확인 (로컬 상태 또는 API 응답)
    const currentFavorite =
      localFavorites[centerId] !== undefined
        ? localFavorites[centerId]
        : centers.find((c) => c.id === centerId)?.isFavorited || false;

    // 즉시 로컬 상태 업데이트 (optimistic update) - 현재 상태의 반대
    setLocalFavorites((prev) => ({
      ...prev,
      [centerId]: !currentFavorite,
    }));

    toggleCenterFavorite.mutate(
      { centerId },
      {
        onSuccess: (data) => {
          // 성공 시 로컬 상태를 서버 응답으로 업데이트
          const isFavorited = data.is_favorited ?? false;
          setLocalFavorites((prev) => ({
            ...prev,
            [centerId]: isFavorited,
          }));
        },
        onError: () => {
          // 실패 시 원래 상태로 되돌리기
          setLocalFavorites((prev) => ({
            ...prev,
            [centerId]: currentFavorite,
          }));
        },
      }
    );
  };

  // 무한스크롤 처리
  const loadMoreCenters = useCallback(() => {
    if (isFetching || !hasMore) return;
    setPage((prev) => prev + 1);
  }, [isFetching, hasMore]);

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
  }, [loadMoreCenters]);

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
    return <EmptyState icon={Buildings} title="찜한 센터가 없습니다" description="관심 있는 센터를 찜해보세요" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 p-4">
        {centers.map((center) => {
          const isLiked =
            localFavorites[center.id] !== undefined
              ? localFavorites[center.id]
              : center.isFavorited;

          return (
            <div key={center.id}>
              <CenterCard
                imageUrl={center.imageUrl || "/img/dummyImg.png"}
                name={center.name}
                location={center.location || center.region || "위치 정보 없음"}
                isSubscribed={Boolean(
                  (center as { isSubscriber?: boolean }).isSubscriber
                )}
                isLiked={isLiked}
                onLikeToggle={() => handleLikeToggle(center.id)}
                centerId={center.id}
              />
            </div>
          );
        })}
      </div>

      {/* 로딩 상태 */}
      {(isLoading || isFetching) && (
        <div className="flex flex-col gap-4 px-4">
          {[...Array(3)].map((_, index) => (
            <CenterCardSkeleton key={index} />
          ))}
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
