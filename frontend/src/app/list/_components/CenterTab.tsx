"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { useBatchCenterFavorites } from "@/hooks/query/useBatchCenterFavorites";
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
  const scrollRestoredRef = useRef(false);

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

  // 찜 상태 일괄 조회
  const centerIds = useMemo(() => allCenters.map((c) => c.id), [allCenters]);
  const { data: batchFavorites } = useBatchCenterFavorites(
    centerIds,
    isAuthenticated && centerIds.length > 0
  );

  const getScrollElement = useCallback(() => {
    return document.getElementById("list-scroll-container");
  }, []);

  // 버추얼 스크롤 (스크롤 컨테이너 기반)
  const virtualizer = useVirtualizer({
    count: allCenters.length,
    estimateSize: () => 63,
    gap: 16,
    overscan: 3,
    getScrollElement,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // 상세 이동 전 스크롤 위치 저장
  const saveScrollPosition = useCallback(() => {
    const el = getScrollElement();
    if (el) {
      sessionStorage.setItem("centerListScrollTop", String(el.scrollTop));
    }
  }, [getScrollElement]);

  // 뒤로가기 시 스크롤 위치 복원
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (allCenters.length === 0) return;

    const saved = sessionStorage.getItem("centerListScrollTop");
    if (saved) {
      const scrollTarget = parseInt(saved);
      const el = getScrollElement();
      if (el) {
        el.scrollTo(0, scrollTarget);
        requestAnimationFrame(() => {
          el.scrollTo(0, scrollTarget);
          // 복원 성공 확인 후에만 완료 처리
          if (el.scrollTop > 0) {
            scrollRestoredRef.current = true;
            sessionStorage.removeItem("centerListScrollTop");
          }
        });
      }
    }
  }, [allCenters.length, getScrollElement]);

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
        : batchFavorites?.[centerId] ?? false;

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
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <CenterCardWithFavorite
                  center={center}
                  isAuthenticated={isAuthenticated}
                  onLikeToggle={handleLikeToggle}
                  localFavorite={localFavorites[center.id]}
                  batchFavorite={batchFavorites?.[center.id]}
                  imagePriority={virtualRow.index < 3}
                  onNavigate={() => {
                    saveScrollPosition();
                    router.push(`/list/center/${center.id}`);
                  }}
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
const CenterCardWithFavorite = React.memo(function CenterCardWithFavorite({
  center,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  batchFavorite,
  imagePriority,
  onNavigate,
}: {
  center: Center;
  isAuthenticated: boolean;
  onLikeToggle: (centerId: string) => void;
  localFavorite?: boolean;
  batchFavorite?: boolean;
  imagePriority?: boolean;
  onNavigate: () => void;
}) {
  const isLiked =
    isAuthenticated &&
    (localFavorite !== undefined
      ? localFavorite
      : batchFavorite ?? false);

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
      onCardClick={onNavigate}
    />
  );
}, (prev, next) => {
  return (
    prev.center.id === next.center.id &&
    prev.localFavorite === next.localFavorite &&
    prev.batchFavorite === next.batchFavorite
  );
});

export { CenterTab };
