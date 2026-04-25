"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useGetCenterById } from "@/hooks/query/useGetCenters";
import { useToggleCenterFavorite, useCheckCenterFavorite } from "@/hooks";
import { useKakaoSDK } from "@/hooks/useKakaoSDK";
import { Container } from "@/components/common/Container";
import { CenterDetailHeader, CenterDetailTabs } from ".";
import type { TabType } from "./types";
import { CenterFilterOverlay } from "../filter/CenterFilterOverlay";

interface CenterDetailClientProps {
  id: string;
}

export default function CenterDetailClient({ id }: CenterDetailClientProps) {
  const searchParams = useSearchParams();
  const { isLoaded, isInitialized } = useKakaoSDK();

  // API 호출
  const { data: center, isLoading: centerLoading } = useGetCenterById(id);
  const { data: favoriteStatus } = useCheckCenterFavorite(id);
  const toggleCenterFavorite = useToggleCenterFavorite();

  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>("animals");

  // URL 쿼리 파라미터에서 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "animals") {
      setActiveTab("animals");
    }
  }, [searchParams]);

  // 데이터 준비
  const isFavorite = favoriteStatus?.is_favorited || false;

  // 이벤트 핸들러
  const handleFavoriteToggle = () => {
    toggleCenterFavorite.mutate({ centerId: id });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 로딩 상태 처리
  if (centerLoading) {
    return (
      <Container className="min-h-screen">
        <div className="text-center py-8">로딩 중...</div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (!center) {
    return (
      <Container className="min-h-screen">
        <div className="text-center py-8">보호센터를 찾을 수 없습니다.</div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen">
      <CenterDetailHeader
        centerName={center.name}
        centerId={id}
        verified={center.verified}
        centerDescription={center.description}
        centerImageUrl={center.imageUrl}
        centerRegion={center.region}
        isKakaoLoaded={isLoaded}
        isKakaoInitialized={isInitialized}
      />

      <CenterDetailTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        center={center}
        isFavorite={isFavorite}
        onFavoriteToggle={handleFavoriteToggle}
      />
      <CenterFilterOverlay />
    </Container>
  );
}
