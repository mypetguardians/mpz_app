"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AdoptorNotificationCard } from "./AdoptorNotificationCard";
import { useGetCenterAdoptions } from "@/hooks/query/useGetCenterAdoptions";
import type { CenterAdoptionData } from "@/types/center-adoption";

type TabType = "application" | "foster" | "adopter";

interface AdoptorData {
  id: string;
  userName: string;
  profileImage: string;
  timeAgo: string;
  status: "응답 대기 중" | "입양 가능" | "입양 완료" | "거절";
  isGrayscale?: boolean;
  region?: string;
  createdAt?: string;
  animalName?: string;
  animalAdoptionStatus?: string;
  animalProtectionStatus?: string;
}

// API 상태를 UI 상태로 매핑하는 함수
const mapApiStatusToUIStatus = (apiStatus: string): AdoptorData["status"] => {
  switch (apiStatus) {
    case "신청":
      return "응답 대기 중";
    case "미팅":
    case "계약서작성":
      return "입양 가능";
    case "입양완료":
      return "입양 완료";
    case "취소":
      return "거절";
    case "모니터링":
      return "입양 완료"; // 모니터링은 입양 완료로 표시
    default:
      return "응답 대기 중";
  }
};

// API 데이터를 UI 데이터로 변환하는 함수
const transformApiDataToUI = (
  adoption: CenterAdoptionData
): AdoptorData & { apiStatus: string } => {
  const createdAt = new Date(adoption.created_at);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  );

  let timeAgo: string;
  if (diffInHours < 1) {
    timeAgo = "방금 전";
  } else if (diffInHours < 24) {
    timeAgo = `${diffInHours}시간 전`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    timeAgo = `${diffInDays}일 전`;
  }

  return {
    id: adoption.id,
    userName: adoption.user_info.name,
    profileImage: adoption.animal_image || "/img/dummyImg.png", // 실제 동물 이미지 사용, 없으면 기본 이미지
    timeAgo,
    status: mapApiStatusToUIStatus(adoption.status),
    isGrayscale: adoption.status === "취소",
    region: "서울", // API에서 지역 정보가 없으므로 기본값
    createdAt: adoption.created_at,
    apiStatus: adoption.status, // API 상태값 추가
    animalName: adoption.animal_name, // 동물 이름 추가
    animalAdoptionStatus: adoption.animal_adoption_status, // 동물 입양 상태 추가
    animalProtectionStatus: adoption.animal_protection_status, // 동물 보호 상태 추가
  };
};

// API 상태 필터링 함수
const filterApiDataByTab = (
  adoptions: CenterAdoptionData[],
  tabType: TabType
): CenterAdoptionData[] => {
  switch (tabType) {
    case "application":
      // 입양신청 탭: 신청, 미팅, 계약서작성, 입양완료, 모니터링, 취소 상태 모두 표시
      return adoptions;
    case "foster":
      // 임시보호 탭: API에서 이미 is_temporary_protection=true로 필터링된 데이터가 옴
      return adoptions;
    case "adopter":
      // 입양자 탭: 입양완료, 모니터링 상태만 표시
      return adoptions.filter((adoption) =>
        ["입양완료", "모니터링"].includes(adoption.status)
      );
    default:
      return adoptions;
  }
};

function AdoptorListTab() {
  const searchParams = useSearchParams();

  // URL 파라미터에서 탭 타입과 검색어, 필터 가져오기
  const tabType = (searchParams.get("tab") as TabType) || "application";
  const searchQuery = searchParams.get("search") || "";

  // useMemo를 사용하여 필터 배열들을 메모이제이션
  const statusFilter = useMemo(
    () => searchParams.get("status")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  // API 상태 필터링을 위한 매개변수
  const apiStatusFilter = useMemo(() => {
    if (statusFilter.length === 0) return undefined;

    // UI 상태를 API 상태로 매핑
    const statusMap: Record<string, string[]> = {
      "응답 대기 중": ["신청"],
      "입양 가능": ["미팅", "계약서작성"],
      "입양 완료": ["입양완료", "모니터링"],
      거절: ["취소"],
    };

    const apiStatuses = statusFilter
      .flatMap((uiStatus) => statusMap[uiStatus] || [])
      .filter(Boolean);

    return apiStatuses.length > 0 ? apiStatuses.join(",") : undefined;
  }, [statusFilter]);

  // useGetCenterAdoptions 훅 사용
  const {
    data: adoptionsData,
    isLoading,
    error,
  } = useGetCenterAdoptions({
    page: 1,
    limit: 50,
    status: apiStatusFilter,
    is_temporary_protection: tabType === "foster" ? true : undefined,
  });

  // API 데이터를 UI 데이터로 변환
  const adoptors = useMemo(() => {
    if (!adoptionsData?.data) {
      return [];
    }

    // 탭별로 데이터 필터링
    const filteredAdoptions = filterApiDataByTab(adoptionsData.data, tabType);

    // 검색어로 필터링
    const searchFiltered = searchQuery
      ? filteredAdoptions.filter((adoption) =>
          adoption.user_info.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : filteredAdoptions;

    // UI 데이터로 변환
    const result = searchFiltered.map(transformApiDataToUI);

    return result;
  }, [adoptionsData, tabType, searchQuery]);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다
        </div>
      </div>
    );
  }

  if (adoptors.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          {searchQuery || statusFilter.length > 0
            ? "검색 결과가 없습니다"
            : "데이터가 없습니다"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 cursor-pointer">
      {adoptors.map((adoptor) => (
        <AdoptorNotificationCard
          key={adoptor.id}
          id={adoptor.id}
          userName={adoptor.userName}
          profileImage={adoptor.profileImage}
          timeAgo={adoptor.timeAgo}
          status={
            adoptor.status as
              | "신청"
              | "미팅"
              | "계약서작성"
              | "입양완료"
              | "모니터링"
              | "취소"
          }
          isGrayscale={adoptor.isGrayscale}
          tabType={tabType}
          apiStatus={adoptor.apiStatus}
          animalName={adoptor.animalName}
          animalAdoptionStatus={adoptor.animalAdoptionStatus}
          animalProtectionStatus={adoptor.animalProtectionStatus}
        />
      ))}
    </div>
  );
}

export { AdoptorListTab };
