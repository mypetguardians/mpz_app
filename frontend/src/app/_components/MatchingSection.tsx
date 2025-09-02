import { useState } from "react";

import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { CustomModal } from "@/components/ui/CustomModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGetUserAIPersonalityTest } from "@/hooks/query/useGetUserAIPersonalityTest";
import { useGetAIPersonalityTest } from "@/hooks/query/useGetAIPersonalityTest";
import { PetCardAnimal } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";
import { AIRecommendResponse } from "@/types/ai-matching";

interface MatchingSectionProps {
  variant: PetCardVariant;
  showLocationFilter?: boolean;
  locations?: string[];
  isLoading?: boolean;
  error?: Error | null;
  isExpertAnalysis?: boolean;
  aiMatchingResult?: AIRecommendResponse | null;
}

export function MatchingSection({
  variant,
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
  aiMatchingResult = null,
}: MatchingSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 유저의 test_id
  const { data: userAITestInfo, isLoading: aiTestLoading } =
    useGetUserAIPersonalityTest(isAuthenticated ? user?.id || "" : "");
  // test_id로 매칭결과
  const testId = userAITestInfo?.tests?.[0]?.test_id;
  const { data: userAIMatchingResult, isLoading: aiLoading } =
    useGetAIPersonalityTest(testId || "");

  const finalAIMatchingResult = aiMatchingResult || userAIMatchingResult;

  const handleMatchingClick = () => {
    if (isAuthenticated) {
      window.location.href = "/matching";
    } else {
      setShowLoginModal(true);
    }
  };

  const handleKakaoLogin = () => {
    window.location.href = "/login";
  };

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
          <MiniButton text="바로가기" onClick={handleMatchingClick} />
        </div>

        {/* 로그인 모달 */}
        <CustomModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="로그인이 필요합니다"
          description="반려동물 성향 테스트를 이용하려면 로그인해주세요."
          variant="variant2"
          ctaText="카카오톡으로 로그인하기"
          onCtaClick={handleKakaoLogin}
        />

        {/* PetSection 섹션 */}
        {isAuthenticated &&
          (() => {
            if (isLoading || aiTestLoading || aiLoading) {
              if (isExpertAnalysis) {
                // 로딩 상태에서는 아무것도 표시하지 않음
                return null;
              }

              return (
                <div className="mb-8">
                  {showLocationFilter && (
                    <div className="flex items-center overflow-x-auto scrollbar-hide gap-[6px] mb-4">
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

            if (error) {
              if (isExpertAnalysis) {
                // 에러 상태에서는 아무것도 표시하지 않음
                return null;
              }

              return (
                <PetSectionError
                  title=""
                  rightSlot=""
                  showLocationFilter={showLocationFilter}
                  locations={locations}
                />
              );
            }

            // AI 매칭 결과가 있으면 해당 데이터를 변환하여 사용
            let transformedAnimals: PetCardAnimal[] = [];

            if (finalAIMatchingResult) {
              // AIPersonalityTestResult 구조인지 확인
              if (
                "result" in finalAIMatchingResult &&
                finalAIMatchingResult.result?.ai_recommendation
                  ?.animal_recommendations
              ) {
                // AIPersonalityTestResult 구조
                transformedAnimals =
                  finalAIMatchingResult.result.ai_recommendation.animal_recommendations.map(
                    (animal) => ({
                      id: String(animal.animal_id),
                      name: String(animal.animal_name || "이름 없음"),
                      breed: String(animal.breed || "믹스견"),
                      isFemale:
                        String(animal.gender) === "암" ||
                        String(animal.gender) === "여성",
                      status: "보호중" as const,
                      centerId: String(animal.center_name || "AI 매칭"),
                      animalImages: [
                        {
                          id: "0",
                          imageUrl: "/img/dummyImg.png", // AI 매칭 결과에는 이미지가 없으므로 기본 이미지 사용
                          orderIndex: 0,
                        },
                      ],
                      foundLocation: String(
                        animal.found_location || "AI 매칭 추천"
                      ),
                    })
                  );
              } else if (
                "data" in finalAIMatchingResult &&
                finalAIMatchingResult.data?.animal_recommendations
              ) {
                // 기존 AIRecommendResponse 구조도 지원
                transformedAnimals =
                  finalAIMatchingResult.data.animal_recommendations.map(
                    (animal: Record<string, unknown>) => ({
                      id: String(animal.animal_id),
                      name: String(animal.animal_name),
                      breed: String(animal.breed || "믹스견"),
                      isFemale: String(animal.gender) === "암",
                      status: "보호중" as const,
                      centerId: String(animal.center_name || "AI 매칭"),
                      animalImages: [
                        {
                          id: "0",
                          imageUrl: "/img/dummyImg.png",
                          orderIndex: 0,
                        },
                      ],
                      foundLocation: String(
                        animal.found_location || "AI 매칭 추천"
                      ),
                    })
                  );
              }
            }

            // AI 매칭 결과가 없으면 빈 배열로 설정
            if (!transformedAnimals.length) {
              transformedAnimals = [];
            }

            // ExpertAnalysis 모드일 때
            if (isExpertAnalysis) {
              const analysisAnimals = transformedAnimals?.slice(0, 3) || [];

              // 결과가 없으면 아무것도 표시하지 않음
              if (analysisAnimals.length === 0) {
                return null;
              }

              return (
                <>
                  <div className="flex flex-col gap-3">
                    {analysisAnimals.map((animal) => (
                      <PetCard
                        key={animal.id}
                        pet={animal as PetCardAnimal}
                        variant="variant2"
                      />
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
                  <div className="flex items-center overflow-x-auto scrollbar-hide gap-[6px]">
                    {locations.map((loc) => (
                      <MiniButton key={loc} text={loc} variant="outline" />
                    ))}
                  </div>
                )}
                <div
                  className={`flex gap-3 overflow-x-auto scrollbar-hide flex-nowrap ${
                    variant === "variant2" ? "flex-col" : ""
                  } ${
                    variant === "variant3"
                      ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
                      : ""
                  }`}
                >
                  {transformedAnimals?.map((animal) => (
                    <PetCard
                      key={animal.id}
                      pet={animal as PetCardAnimal}
                      variant={variant}
                    />
                  ))}
                </div>
              </>
            );
          })()}
      </MainSection>
    </>
  );
}
