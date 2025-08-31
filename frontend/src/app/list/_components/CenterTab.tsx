"use client";

import { useState, useEffect } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { useCheckCenterFavorite } from "@/hooks/query/useCheckCenterFavorite";
import { useToggleCenterFavorite } from "@/hooks/mutation/useToggleCenterFavorite";
import { useAuth } from "@/components/providers/AuthProvider";
import { Center, transformRawCenterToCenter } from "@/types/center";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";

function CenterTab() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );
  const { isAuthenticated } = useAuth();
  const toggleFavorite = useToggleCenterFavorite();

  const {
    data: centersData,
    isLoading: isApiLoading,
    error: apiError,
  } = useGetCenters();

  useEffect(() => {
    if (centersData) {
      const rawCenters = centersData.data || [];
      if (rawCenters) {
        const transformedCenters = rawCenters.map(transformRawCenterToCenter);
        setCenters(transformedCenters);
      } else {
        setCenters([]);
      }
    }
  }, [centersData]);

  // 좋아요 토글 핸들러
  const handleLikeToggle = (centerId: string) => {
    if (!isAuthenticated) {
      return;
    }

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

    toggleFavorite.mutate(
      { centerId },
      {
        onSuccess: (data) => {
          // 성공 시 로컬 상태를 서버 응답으로 업데이트
          const isFavorited =
            data.isFavorited !== undefined
              ? data.isFavorited
              : data.is_favorited ?? false;
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

  // 로딩 상태 처리
  if (isApiLoading && (!centers || centers.length === 0)) {
    return (
      <div className="flex flex-col gap-4 px-4">
        {[...Array(5)].map((_, index) => (
          <CenterCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 에러 상태 처리
  if (apiError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">센터 목록을 불러오는데 실패했습니다</div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!centers || centers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">등록된 센터가 없습니다</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {centers?.map((center, idx) => (
        <CenterCardWithFavorite
          key={center.id ?? idx}
          center={center}
          isAuthenticated={isAuthenticated}
          onLikeToggle={handleLikeToggle}
          localFavorite={localFavorites[center.id]}
        />
      ))}
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
      ? favoriteData.isFavorited || favoriteData.is_favorited
      : false);

  return (
    <CenterCard
      imageUrl="/img/dummyImg.jpeg"
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
