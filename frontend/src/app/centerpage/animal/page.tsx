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
import { Add } from "@/components/ui/Add";
import { useQueryClient } from "@tanstack/react-query";

export default function CenterAnimal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedAnimalPosition, setSelectedAnimalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
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
  console.log(allAnimals);
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

  const handleAnimalClick = (animal: Animal, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 116;
    const popupHeight = 120;
    const margin = 20; // 여백 증가

    // 화면 경계 정보
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기본 위치 계산 (카드 중앙 상단)
    let x = rect.left + rect.width / 2 - popupWidth / 2;
    let y = rect.top - popupHeight - margin;

    // 좌우 경계 체크 및 조정
    if (x < margin) {
      x = margin;
    } else if (x + popupWidth > viewportWidth - margin) {
      x = viewportWidth - popupWidth - margin;
    }

    // 상하 경계 체크 및 위치 조정
    if (y < margin) {
      // 위쪽에 공간이 없으면 아래쪽에 표시
      y = rect.bottom + margin;

      // 아래쪽에도 공간이 없으면 카드 위쪽에 겹치게 표시 (마진 없이)
      if (y + popupHeight > viewportHeight - margin) {
        y = rect.top - popupHeight + margin;

        // 그래도 위쪽에 공간이 없으면 카드 중앙에 표시
        if (y < margin) {
          y = rect.top + rect.height / 2 - popupHeight / 2;
        }
      }
    } else if (y + popupHeight > viewportHeight - margin) {
      // 아래쪽에 공간이 없으면 위쪽으로 조정
      y = viewportHeight - popupHeight - margin;

      // 위쪽에도 공간이 없으면 카드 아래쪽에 표시
      if (y < margin) {
        y = rect.bottom + margin;
      }
    }

    // 최종 경계 체크 (절대 화면을 벗어나지 않도록)
    x = Math.max(margin, Math.min(x, viewportWidth - popupWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - popupHeight - margin));

    setSelectedAnimal(animal);
    setSelectedAnimalPosition({ x, y });
    setShowActionButtons(true);
  };

  const handleEditAnimal = () => {
    if (selectedAnimal) {
      router.push(`/centerpage/animal/edit/${selectedAnimal.id}`);
    }
  };

  const handleViewAnimal = () => {
    if (selectedAnimal) {
      router.push(`/list/animal/${selectedAnimal.id}`);
    }
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
          <div className="w-full py-4 text-center">
            <div className="text-red-500">
              센터 정보를 불러오는데 실패했습니다
            </div>
          </div>
        )}

        {centerData && !centerData.id && (
          <div className="w-full py-4 text-center">
            <div className="text-orange-500">
              등록된 센터가 없습니다. 센터를 먼저 등록해주세요.
            </div>
          </div>
        )}

        {error && (
          <div className="w-full py-4 text-center">
            <div className="text-red-500">
              동물 목록을 불러오는데 실패했습니다
            </div>
            <div className="mt-2 text-sm text-gray-500">{error.message}</div>
          </div>
        )}

        {centerData?.id && (
          <div className="flex flex-col items-start gap-1">
            <p className="text-dg font-body2">총 {totalCount}마리</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {allAnimals.map((animal: Animal) => (
                <div key={animal.id} className="w-full">
                  <div onClick={(e) => handleAnimalClick(animal, e)}>
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
                      className="w-full h-full"
                      onAdoptionClick={() => handleAdoptionClick(animal)}
                    />
                  </div>
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
              <div className="w-full py-4 text-center">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            )}

            {/* 데이터가 없을 때 */}
            {!isLoading && allAnimals.length === 0 && !error && (
              <div className="w-full py-8 text-center">
                <div className="text-gray-500">등록된 동물이 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 동물 액션 버튼 */}
      {showActionButtons && selectedAnimal && selectedAnimalPosition && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowActionButtons(false)}
        >
          <div
            className="fixed z-50 transition-all duration-200 ease-out"
            style={{
              left: `${selectedAnimalPosition.x}px`,
              top: `${selectedAnimalPosition.y}px`,
              transform: "translateZ(0)", // 하드웨어 가속
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Add
              buttons={[
                {
                  text: "수정하기",
                  onClick: handleEditAnimal,
                },
                {
                  text: "보러가기",
                  onClick: handleViewAnimal,
                },
              ]}
            />
          </div>
        </div>
      )}

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
