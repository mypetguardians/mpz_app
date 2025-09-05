"use client";

import { useState, useEffect, useCallback } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { useCheckCenterFavorite } from "@/hooks/query/useCheckCenterFavorite";
import { useToggleCenterFavorite } from "@/hooks/mutation/useToggleCenterFavorite";
import { useAuth } from "@/components/providers/AuthProvider";
import { Center, transformRawCenterToCenter } from "@/types/center";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";

function CenterTab() {
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );
  const { isAuthenticated } = useAuth();
  const toggleFavorite = useToggleCenterFavorite();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCenters();

  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (data) {
      const allCentersData = data.pages
        .flatMap((page) => {
          // API 응답 구조에 따라 data 필드에서 센터 데이터 추출
          return page.data || [];
        })
        .filter((center) => center && typeof center === "object")
        .map(transformRawCenterToCenter);
      setAllCenters(allCentersData);
    }
  }, [data]);

  const loadMoreCenters = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // 스크롤 이벤트 처리 (디바운싱 적용)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 기존 타이머 클리어
      clearTimeout(timeoutId);

      // 100ms 후에 스크롤 처리 실행
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // 페이지 하단에서 800px 이내에 도달하면 다음 페이지 로드
        if (scrollTop + windowHeight >= documentHeight - 800) {
          loadMoreCenters();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMoreCenters]);

  // 좋아요 토글 핸들러
  const handleLikeToggle = (centerId: string) => {
    if (!isAuthenticated) {
      return;
    }

    // 현재 찜하기 상태 확인 (로컬 상태 또는 API 응답)
    const currentFavorite =
      localFavorites[centerId] !== undefined
        ? localFavorites[centerId]
        : allCenters.find((c) => c.id === centerId)?.isFavorited || false;

    // 즉시 로컬 상태 업데이트 (optimistic update) - 현재 상태의 반대
    setLocalFavorites((prev) => ({
      ...prev,
      [centerId]: !currentFavorite,
    }));

    toggleFavorite.mutate(
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

  // 로딩 상태 처리 - 스켈레톤 표시
  if (isLoading && allCenters.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4">
        {[...Array(5)].map((_, index) => (
          <CenterCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">센터 목록을 불러오는데 실패했습니다</div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (allCenters.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">등록된 센터가 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 px-4">
        {allCenters
          .filter((center) => center && center.id)
          .map((center, idx) => (
            <CenterCardWithFavorite
              key={center.id ?? idx}
              center={center}
              isAuthenticated={isAuthenticated}
              onLikeToggle={handleLikeToggle}
              localFavorite={localFavorites[center.id]}
            />
          ))}
      </div>

      {/* 추가 로딩 스켈레톤 */}
      {isFetchingNextPage && (
        <div className="flex flex-col gap-4 px-4 mt-4">
          {[...Array(3)].map((_, index) => (
            <CenterCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// 좋아요 상태를 확인하는 개별 센터 카드 컴포넌트
function CenterCardWithFavorite({
  center,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
}: {
  center: Center;
  isAuthenticated: boolean;
  onLikeToggle: (centerId: string) => void;
  localFavorite?: boolean;
}) {
  // 로컬 상태가 있으면 API 호출을 비활성화
  const { data: favoriteData } = useCheckCenterFavorite(
    center.id,
    isAuthenticated && localFavorite === undefined
  );

  // 로컬 상태가 있으면 로컬 상태 사용, 없으면 API 응답 사용
  const isLiked =
    isAuthenticated &&
    (localFavorite !== undefined
      ? localFavorite
      : favoriteData
      ? favoriteData.is_favorited
      : false);

  return (
    <CenterCard
      imageUrl="/img/dummyImg.png"
      name={center.name}
      location={center.location || "주소 정보 없음"}
      verified={center.verified || false}
      isLiked={isLiked}
      onLikeToggle={isAuthenticated ? () => onLikeToggle(center.id) : undefined}
      centerId={center.id}
    />
  );
}

export { CenterTab };
