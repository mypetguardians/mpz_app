"use client";

import { useState, useEffect } from "react";
import { CenterCard } from "@/components/ui/CenterCard";
import { CenterInfo } from "@/app/mock";

const ITEMS_PER_PAGE = 4;

function CenterTab() {
  const [centers, setCenters] = useState<typeof CenterInfo>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedCenters, setLikedCenters] = useState<Set<string>>(new Set());

  // 무한스크롤 시뮬레이션 (데이터 반복 X)
  const loadMoreCenters = () => {
    if (loading || !hasMore) return;

    setLoading(true);

    setTimeout(() => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newCenters = CenterInfo.slice(startIndex, endIndex);

      if (newCenters.length === 0) {
        setHasMore(false);
      } else {
        setCenters((prev) => [...prev, ...newCenters]);
        setPage((prev) => prev + 1);
        if (endIndex >= CenterInfo.length) setHasMore(false);
      }

      setLoading(false);
    }, 500);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadMoreCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loading, hasMore]);

  const handleLikeToggle = (centerId: string) => {
    setLikedCenters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  if (centers.length === 0 && !loading) {
    return (
      <div>
        <div className="text-gray-500 text-center py-8">
          찜한 센터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 px-4">
        {centers.map((center, idx) => (
          <div key={center.id ?? idx}>
            <CenterCard
              imageUrl={center.imgUrl}
              name={center.name}
              location={center.location}
              verified={center.id === "1" || center.id === "3"} // 예시: 특정 센터만 인증됨
              isLiked={likedCenters.has(center.id)}
              onLikeToggle={() => handleLikeToggle(center.id)}
              centerId={center.id}
            />
          </div>
        ))}
      </div>
      {loading && (
        <div className="text-center py-4">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      )}
    </div>
  );
}

export { CenterTab };
