"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { useCheckCenterFavorite } from "@/hooks/query/useCheckCenterFavorite";
import { useToggleCenterFavorite } from "@/hooks/mutation/useToggleCenterFavorite";
import { useAuth } from "@/components/providers/AuthProvider";
import { Center, transformRawCenterToCenter } from "@/types/center";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";
import { CustomModal } from "@/components/ui/CustomModal";
import { useRouter } from "next/navigation";

function CenterTab() {
  const searchParams = useSearchParams();
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const toggleFavorite = useToggleCenterFavorite();
  const listRef = useRef<HTMLDivElement>(null);

  // URL에서 region 파라미터 읽기
  const regionFromUrl = searchParams.get("region");

  // 검색 쿼리 파라미터를 sessionStorage에 저장 (센터 상세페이지 뒤로가기 시 사용)
  useEffect(() => {
    const searchString = searchParams.toString();
    const paramsToStore = searchString ? `?${searchString}` : "";
    sessionStorage.setItem("centerListSearchParams", paramsToStore);
  }, [searchParams]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCenters({
    region: regionFromUrl || undefined,
  });

  // React Query 데이터에서 센터 목록 추출
  const allCenters = useMemo(() => {
    if (!data) return [];
    return data.pages
      .flatMap((page) => page.data || [])
      .filter((center) => center && typeof center === "object")
      .map(transformRawCenterToCenter);
  }, [data]);

  // 버추얼 스크롤 (window 스크롤 기반)
  const virtualizer = useWindowVirtualizer({
    count: allCenters.length,
    estimateSize: () => 63,
    gap: 16,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // 마지막 가상 아이템 근처 도달 시 다음 페이지 로드
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= allCenters.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, allCenters.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 좋아요 토글 핸들러
  const handleLikeToggle = (centerId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const currentFavorite =
      localFavorites[centerId] !== undefined
        ? localFavorites[centerId]
        : allCenters.find((c) => c.id === centerId)?.isFavorited || false;

    setLocalFavorites((prev) => ({
      ...prev,
      [centerId]: !currentFavorite,
    }));

    toggleFavorite.mutate(
      { centerId },
      {
        onSuccess: (data: { is_favorited: boolean }) => {
          const isFavorited = data.is_favorited ?? false;
          setLocalFavorites((prev) => ({
            ...prev,
            [centerId]: isFavorited,
          }));
        },
        onError: () => {
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
      <div className="flex flex-col space-y-4 px-4">
        {[...Array(5)].map((_, index) => (
          <CenterCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500">센터 목록을 불러오는데 실패했습니다</div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (allCenters.length === 0 && !isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="text-gray-500">등록된 센터가 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      {/* 버추얼 스크롤 리스트 */}
      <div ref={listRef} className="px-4">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const center = allCenters[virtualRow.index];
            if (!center || !center.id) return null;
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <CenterCardWithFavorite
                  center={center}
                  isAuthenticated={isAuthenticated}
                  onLikeToggle={handleLikeToggle}
                  localFavorite={localFavorites[center.id]}
                  imagePriority={virtualRow.index < 3}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 추가 로딩 스켈레톤 */}
      {isFetchingNextPage && (
        <div className="flex flex-col space-y-4 px-4 mt-4">
          {[...Array(3)].map((_, index) => (
            <CenterCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}

      {/* 로그인 모달 */}
      <CustomModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인이 필요합니다"
        description="찜하기 기능을 사용하려면 로그인이 필요합니다."
        variant="variant2"
        ctaText="카카오톡으로 로그인하기"
        onCtaClick={() => {
          setShowLoginModal(false);
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        }}
        subLinkText="나중에 하기"
        onSubLinkClick={() => setShowLoginModal(false)}
      />
    </div>
  );
}

// 좋아요 상태를 확인하는 개별 센터 카드 컴포넌트
function CenterCardWithFavorite({
  center,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  imagePriority,
}: {
  center: Center;
  isAuthenticated: boolean;
  onLikeToggle: (centerId: string) => void;
  localFavorite?: boolean;
  imagePriority?: boolean;
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
      imageUrl={center.imageUrl || ""}
      name={center.name}
      location={center.location || "주소 정보 없음"}
      isSubscribed={center.isSubscriber || false}
      isLiked={isLiked}
      onLikeToggle={() => onLikeToggle(center.id)}
      centerId={center.id}
      imagePriority={imagePriority}
    />
  );
}

export { CenterTab };
