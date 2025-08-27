import Link from "next/link";

import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { useAuth } from "@/components/providers/AuthProvider";

interface Animal {
  id: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  status: "보호중" | "입양완료" | "무지개다리" | "임시보호중" | "반환" | "방사";
  waitingDays: number | null;
  activityLevel: number | null;
  sensitivity: number | null;
  sociability: number | null;
  separationAnxiety: number | null;
  specialNotes: string | null;
  healthNotes: string | null;
  basicTraining: string | null;
  trainerComment: string | null;
  announceNumber: string | null;
  announcementDate: string | null;
  foundLocation: string | null;
  personality: string | null;
  centerId: string;
  createdAt: string;
  updatedAt: string;
}

interface HomePetSectionProps {
  animals: Animal[];
  variant: "primary" | "detail" | "variant3";
  showLocationFilter?: boolean;
  locations?: string[];
  isLoading?: boolean;
  error?: Error | null;
  isExpertAnalysis?: boolean;
}

export function HomePetSection({
  animals,
  variant,
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
}: HomePetSectionProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {/* MatchingBanner 섹션 */}
      <MainSection
        title={"평생 함께할 가족이니까, \n나와 꼭 맞는 아이를 찾아보세요"}
      >
        <div
          className="flex bg-brand-light/50 py-[27px] px-5 justify-between items-center rounded-lg bg-cover bg-center"
          style={{ backgroundImage: 'url("/illust/HomeBanner.svg")' }}
        >
          <h5 className="text-wh">반려동물 성향 테스트</h5>
          <Link href="/matching">
            <MiniButton text="바로가기" />
          </Link>
        </div>

        {/* PetSection 섹션 */}
        {isAuthenticated &&
          user?.matchingSession &&
          (() => {
            if (isLoading) {
              if (isExpertAnalysis) {
                return (
                  <>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg">동물 정보를 불러오는 중...</div>
                    </div>
                    <MiniButton
                      text="전문가 분석 모아보기"
                      variant="filterOff"
                      className="py-4"
                      rightIcon={<CaretDown size={12} />}
                    />
                  </>
                );
              }

              return (
                <div className="mb-8">
                  {showLocationFilter && (
                    <div className="flex items-center overflow-x-auto gap-[6px] mb-4">
                      {locations.map((loc) => (
                        <div
                          key={loc}
                          className="px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-400 bg-gray-100"
                        >
                          {loc}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center h-32">
                    <div className="text-lg">동물 정보를 불러오는 중...</div>
                  </div>
                </div>
              );
            }

            // 에러가 발생했을 때는 에러 컴포넌트 표시
            if (error) {
              if (isExpertAnalysis) {
                return (
                  <>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg text-red-500">
                        동물 정보를 불러오는데 실패했습니다.
                      </div>
                    </div>
                    <MiniButton
                      text="전문가 분석 모아보기"
                      variant="filterOff"
                      className="py-4"
                      rightIcon={<CaretDown size={12} />}
                    />
                  </>
                );
              }

              return (
                <PetSectionError
                  title=""
                  rightSlot=""
                  showLocationFilter={showLocationFilter}
                  locations={locations}
                  variant={variant}
                />
              );
            }

            const transformedAnimals = animals.map((animal) => ({
              id: animal.id,
              imageUrls: [""], // 목데이터 이미지 사용
              waitingDays: animal.waitingDays || 0,
              tag: animal.status,
              name: animal.name,
              isFemale: animal.isFemale,
              location: animal.foundLocation || "위치 정보 없음",
              description: animal.description || "",
              activityLevel: animal.activityLevel || 3,
              sensitivity: animal.sensitivity || 3,
              sociability: animal.sociability || 3,
              center: animal.centerId,
              weight: animal.weight || 0,
              age: animal.age,
              color: animal.color || "",
              announceNumber: animal.announceNumber || "",
              announcementDate: animal.announcementDate || "",
              foundLocation: animal.foundLocation || "",
              specialNotes: animal.specialNotes || "",
              separationAnxiety: animal.separationAnxiety || 3,
              healthNotes: animal.healthNotes || "",
              basicTraining: animal.basicTraining || "",
              trainerComment: animal.trainerComment || "",
            }));

            // ExpertAnalysis 모드일 때
            if (isExpertAnalysis) {
              const analysisAnimals = transformedAnimals.slice(0, 3);

              return (
                <>
                  <div className="flex flex-col gap-3">
                    {analysisAnimals.map((animal) => (
                      <PetCard key={animal.id} pet={animal} variant="detail" />
                    ))}
                  </div>
                  <MiniButton
                    text="전문가 분석 모아보기"
                    variant="filterOff"
                    className="py-4"
                    rightIcon={<CaretDown size={12} />}
                  />
                </>
              );
            }

            // 일반 PetSection 모드일 때
            return (
              <>
                {showLocationFilter && (
                  <div className="flex items-center overflow-x-auto gap-[6px]">
                    {locations.map((loc) => (
                      <MiniButton key={loc} text={loc} variant="outline" />
                    ))}
                  </div>
                )}
                <div
                  className={`flex gap-3 overflow-x-auto flex-nowrap ${
                    variant === "detail" ? "flex-col" : ""
                  } ${
                    variant === "variant3"
                      ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
                      : ""
                  }`}
                >
                  {transformedAnimals.map((animal) => (
                    <PetCard key={animal.id} pet={animal} variant={variant} />
                  ))}
                </div>
              </>
            );
          })()}
      </MainSection>
    </>
  );
}
