"use client";

import { useState, useEffect } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { useAuth } from "@/components/providers/AuthProvider";
import type { CenterResponseSchema } from "@/server/openapi/routes/center";
import { z } from "zod";

type Center = z.infer<typeof CenterResponseSchema>;

function CenterTab() {
  const [centers, setCenters] = useState<Center[]>([]);
  const { isAuthenticated } = useAuth();

  const {
    data: centersData,
    isLoading: isApiLoading,
    error: apiError,
  } = useGetCenters();

  useEffect(() => {
    if (centersData) {
      // centersData가 배열인 경우 직접 사용, 객체인 경우 centers 속성 사용
      const allCenters = Array.isArray(centersData)
        ? centersData
        : centersData.centers;
      setCenters(allCenters || []);
    }
  }, [centersData]);

  // 로딩 상태 처리
  if (isApiLoading && (!centers || centers.length === 0)) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">로딩 중...</div>
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
    <div>
      <div className="flex flex-col gap-4 px-4">
        {centers?.map((center, idx) => (
          <CenterCard
            key={center.id ?? idx}
            imageUrl="/img/dummyImg.jpeg"
            name={center.name}
            location={center.location || "주소 정보 없음"}
            verified={center.verified || false}
            isLiked={false}
            onLikeToggle={isAuthenticated ? () => {} : undefined}
            centerId={center.id}
          />
        ))}
      </div>
    </div>
  );
}

export { CenterTab };
