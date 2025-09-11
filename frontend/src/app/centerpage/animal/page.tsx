"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { AddButton } from "@/components/ui/AddButton";
import { PetCard } from "@/components/ui/PetCard";
import { useGetMyCenterAnimalsInfinite } from "@/hooks/query";
import { useGetMyCenter } from "@/hooks/query";
import type { Animal } from "@/types/animal";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useQueryClient } from "@tanstack/react-query";

export default function CenterAnimal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: centerData,
    isLoading: centerLoading,
    error: centerError,
  } = useGetMyCenter();

  const shouldFetchAnimals = !centerLoading && !!centerData?.id;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetMyCenterAnimalsInfinite(
    {
      breed: searchTerm || undefined,
      center_id: centerData?.id,
    },
    {
      enabled: shouldFetchAnimals,
    }
  );

  // 모든 페이지의 동물들을 하나의 배열로 합치기
  const allAnimals =
    data?.pages.flatMap((page: { animals: Animal[] }) => page.animals) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Intersection Observer를 사용한 무한스크롤
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleLoadMore]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (shouldFetchAnimals) {
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [shouldFetchAnimals, refetch]);

  // 수동 새로고침 함수
  const handleRefresh = async () => {
    if (!shouldFetchAnimals) return;

    setIsRefreshing(true);
    try {
      // 캐시 무효화 후 다시 가져오기
      await queryClient.invalidateQueries({
        queryKey: ["myCenterAnimalsInfinite"],
      });
      await refetch();

      setToastMessage("동물 목록이 새로고침되었습니다!");
      setToastType("success");
      setShowToast(true);
    } catch (error) {
      console.error("새로고침 실패:", error);
      setToastMessage("새로고침에 실패했습니다.");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdoptionClick = (pet: Animal) => {
    const animalUrl = `${window.location.origin}/list/animal/${pet.id}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(animalUrl)
        .then(() => {
          setToastMessage("해당 동물의 상세페이지 링크가 복사되었습니다!");
          setToastType("success");
          setShowToast(true);
        })
        .catch(() => {
          // 클립보드 복사 실패 시 fallback
          fallbackCopyTextToClipboard(animalUrl);
        });
    } else {
      // 구형 브라우저 지원
      fallbackCopyTextToClipboard(animalUrl);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      setToastMessage("해당 동물의 상세페이지 링크가 복사되었습니다!");
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
      setToastMessage("링크 복사에 실패했습니다.");
      setToastType("error");
      setShowToast(true);
    }

    document.body.removeChild(textArea);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.push("/centerpage")}
            />
            <h4>동물 관리</h4>
          </div>
        }
        right={
          <IconButton
            icon={({ size }) => <ArrowsClockwise size={size} weight="bold" />}
            size="iconM"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`${isRefreshing ? "animate-spin opacity-50" : ""}`}
          />
        }
      />
      <div className="flex flex-col gap-4 px-4">
        <SearchInput
          placeholder="품종명으로 검색해보세요"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <Link href="/centerpage/animal/add">
          <AddButton>새로운 아이 등록하기</AddButton>
        </Link>

        {centerError && (
          <div className="text-center py-4 w-full">
            <div className="text-red-500">
              센터 정보를 불러오는데 실패했습니다
            </div>
          </div>
        )}

        {centerData && !centerData.id && (
          <div className="text-center py-4 w-full">
            <div className="text-orange-500">
              등록된 센터가 없습니다. 센터를 먼저 등록해주세요.
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4 w-full">
            <div className="text-red-500">
              동물 목록을 불러오는데 실패했습니다
            </div>
            <div className="text-sm text-gray-500 mt-2">{error.message}</div>
          </div>
        )}

        {centerData?.id && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-dg font-body2">총 {totalCount}마리</p>
            <div className="flex flex-wrap justify-start gap-2">
              {allAnimals.map((animal: Animal) => (
                <div key={animal.id} className="w-[calc(50%-4px)]">
                  <PetCard
                    pet={{
                      id: animal.id,
                      name: animal.name || "",
                      isFemale: animal.isFemale,
                      breed: animal.breed,
                      protection_status: animal.protection_status,
                      adoption_status: animal.adoption_status,
                      centerId: animal.centerId,
                      animalImages: animal.animalImages,
                      foundLocation: animal.foundLocation || "위치 정보 없음",
                    }}
                    variant="edit"
                    imageSize="full"
                    className="w-full"
                    onAdoptionClick={() => handleAdoptionClick(animal)}
                  />
                </div>
              ))}
            </div>

            {/* 무한스크롤 트리거 */}
            {hasNextPage && (
              <div
                ref={loadMoreRef}
                className="w-full py-4 text-center text-gray-500"
              >
                {isFetchingNextPage ? "더 많은 동물을 불러오는 중..." : ""}
              </div>
            )}

            {/* 초기 로딩 */}
            {isLoading && allAnimals.length === 0 && (
              <div className="text-center py-4 w-full">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            )}

            {/* 데이터가 없을 때 */}
            {!isLoading && allAnimals.length === 0 && !error && (
              <div className="text-center py-8 w-full">
                <div className="text-gray-500">등록된 동물이 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 토스트 알림 */}
      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </Container>
  );
}
