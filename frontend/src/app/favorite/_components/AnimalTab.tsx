"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PetCard } from "@/components/ui";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { useGetAnimalFavorites } from "@/hooks";

const ITEMS_PER_PAGE = 10;

type FavoriteAnimal = Record<string, unknown> & { id: string };

function AnimalTab() {
  const SCROLL_KEY = "favorite_animals_scrollY";
  const restoredRef = useRef(false);
  const [page, setPage] = useState(1);
  const [accumulatedPets, setAccumulatedPets] = useState<FavoriteAnimal[]>([]);
  const {
    data: favoritesData,
    isLoading,
    error,
    isFetching,
  } = useGetAnimalFavorites(page, ITEMS_PER_PAGE);
  const router = useRouter();

  const currentPets = useMemo(
    () => (favoritesData?.animals as FavoriteAnimal[]) || [],
    [favoritesData]
  );
  const hasMore = (favoritesData?.hasNext as boolean) || false;
  const total = (favoritesData?.total as number) || 0;

  // 페이지 데이터 누적 관리 (무한스크롤)
  useEffect(() => {
    if (!favoritesData) return;
    if (page === 1) {
      setAccumulatedPets(currentPets);
    } else if (currentPets.length > 0) {
      setAccumulatedPets((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const item of currentPets) {
          const id = item.id;
          if (!seen.has(id)) {
            merged.push(item);
            seen.add(id);
          }
        }
        return merged;
      });
    }
  }, [favoritesData, currentPets, page]);

  const pets = useMemo(() => accumulatedPets, [accumulatedPets]);

  // 상세로 이동 전 현재 스크롤 위치 저장
  const navigateToDetail = useCallback(
    (id: string) => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0));
      } catch {}
      router.push(`/list/animal/${id}`);
    },
    [router]
  );

  // 뒤로 돌아왔을 때 스크롤 위치 복원 (데이터 로드 이후 1회만)
  useEffect(() => {
    if (restoredRef.current) return;
    if (isLoading || isFetching) return;

    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        // 렌더 안정화 후 스크롤 (모바일 호환 위해 약간 지연)
        setTimeout(() => {
          window.scrollTo({
            top: Number.isFinite(y) ? y : 0,
            behavior: "auto",
          });
        }, 0);
        restoredRef.current = true;
        sessionStorage.removeItem(SCROLL_KEY);
      }
    } catch {}
  }, [isLoading, isFetching, pets.length]);

  // 무한스크롤 처리
  const loadMorePets = useCallback(() => {
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
        loadMorePets();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMorePets]);

  // 에러 상태
  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-2 text-red-500">
          찜한 동물을 불러오는데 실패했습니다.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 데이터가 없고 로딩 중이 아닌 경우
  if (pets.length === 0 && !isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="text-gray-500">찜한 동물이 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-start gap-2 px-4">
        {pets.map((pet: unknown) => {
          const petData = pet as Record<string, unknown>;
          const petCardData = {
            id: petData.id as string,
            name: petData.name as string,
            breed: petData.breed as string,
            isFemale: petData.isFemale as boolean,
            protection_status:
              (petData.protection_status as
                | "보호중"
                | "안락사"
                | "자연사"
                | "반환") || "보호중",
            adoption_status:
              (petData.adoption_status as
                | "입양가능"
                | "입양진행중"
                | "입양완료"
                | "입양불가") || "입양가능",
            animalImages: Array.isArray(petData.animalImages)
              ? petData.animalImages.map((url: string, index: number) => ({
                  id: `img-${index}`,
                  imageUrl: url,
                  orderIndex: index,
                }))
              : [],
            centerId: petData.centerId as string,
            foundLocation:
              (petData.foundLocation as string) || "위치 정보 없음",
          };

          return (
            <div
              key={petData.id as string}
              className="w-[calc(50%-4px)]"
              onClick={() => navigateToDetail(petData.id as string)}
            >
              <PetCard
                pet={petCardData}
                variant="primary"
                imageSize="full"
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      {/* 로딩 상태 */}
      {(isLoading || isFetching) && (
        <div className="flex flex-wrap justify-start gap-2 px-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="w-[calc(50%-4px)]">
              <PetCardSkeleton
                variant="primary"
                imageSize="full"
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 더 보기 버튼 */}
      {hasMore && !isFetching && (
        <div className="py-4 text-center">
          <button
            onClick={loadMorePets}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            더 보기
          </button>
        </div>
      )}

      {/* 전체 개수 표시 */}
      {total > 0 && (
        <div className="py-2 text-sm text-center text-gray-500">
          총 {total}개의 찜한 동물
        </div>
      )}
    </div>
  );
}

export { AnimalTab };
