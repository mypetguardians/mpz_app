"use client";

import React from "react";
import Image from "next/image";
import { X, ArrowClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { PetCard } from "@/components/ui/PetCard";
// import { BigButton } from "@/components/ui/BigButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { mainPetInfo } from "@/app/mock";
import { AIRecommendResponse } from "@/types/ai-matching";

// 매칭 결과 타입 정의
type MatchingResultType =
  | "perfect" // 완벽한 매칭
  | "good" // 좋은 매칭
  | "silent" // 조용한
  | "unsuitable"; // 부적합한 매칭

// 매칭 결과별 데이터
const matchingResults = {
  perfect: {
    message: "당신 같은 보호자가 있다는 게\n얼마나 든든한지 몰라요.",
    subtitle:
      "어려움이 있었던 아이들도 당신 곁에서\n안정감을 찾을 수 있을 거예요.",
    image: "/illust/result01.svg",
    imageAlt: "결과1 일러스트",
  },
  good: {
    message: "당신의 에너지가\n누군가에게 큰 선물이 될 수 있어요.",
    subtitle:
      "함께 달리고, 함께 배우고, \n매일을 모험처럼 살아가는 걸 좋아하는 아이가 있어요.\n활기찬 하루를 함께 나눌 친구를 소개해드릴게요.",
    image: "/illust/result02.svg",
    imageAlt: "결과2 일러스트",
  },
  unsuitable: {
    message: "반려동물과의 삶은 소중하지만 \n쉬운 일만은 아니에요.",
    subtitle:
      "배변훈련, 건강관리, 예상치 못한 병원비까지...\n함께 잘 할 수 있을까? 스스로에게 한번 더 물어봐주세요\n충분히 고민해보고, 여유가 생겼을 때 다시 만나는 것도 괜찮아요.",
    image: "/illust/result02.svg",
    imageAlt: "결과2 일러스트",
  },
  silent: {
    message: "조용한 일상을 즐기는 당신\n그리고 그런 아이들이 있어요.",
    subtitle:
      "낯선 세상에 쉽게 지치는 아이들도\n당신의 차분한 생활 속에서 마음을 놓을 수 있을거에요.\n서로의 속도를 존중하는 따듯한 만남, 함께 만들어볼까요?",
    image: "/illust/result04.svg",
    imageAlt: "결과4 일러스트",
  },
};

// 로딩 중일 때 사용할 일러스트 배열
const loadingImages = [
  "/illust/result01.svg",
  "/illust/result02.svg",
  "/illust/result03.svg",
  "/illust/result04.svg",
];

// AI 매칭 결과를 기반으로 매칭 타입 결정하는 함수
function getMatchingTypeFromAIResult(
  aiResult: AIRecommendResponse | null
): MatchingResultType | null {
  if (!aiResult?.data?.analysis_reason?.user_personality_type) return null;

  const personalityType = aiResult.data.analysis_reason.user_personality_type;

  // user_personality_type에 따라 매칭 타입 결정
  switch (personalityType) {
    case "perfect":
      return "perfect";
    case "good":
      return "good";
    case "silent":
      return "silent";
    case "unsuitable":
      return "unsuitable";
    default:
      return null;
  }
}

// 매칭 결과 컴포넌트
function MatchingResult({
  type,
}: //aiResult,
{
  type: MatchingResultType | null;
  aiResult: AIRecommendResponse | null;
}) {
  const { user } = useAuth();

  // 매칭 타입이 없으면 기본 메시지 표시
  if (!type) {
    return (
      <div className="flex flex-col gap-2 items-center">
        <h6 className="text-brand">{user?.name} 님의 매칭 결과</h6>
        <h2 className="text-bk text-center">
          매칭 분석을 위해
          <br />
          성향 테스트를 완료해주세요
        </h2>
        <h6 className="text-dg text-center">
          더 정확한 매칭을 위해
          <br />
          성향 테스트 결과가 필요합니다
        </h6>
      </div>
    );
  }

  const result = matchingResults[type];
  // AI 매칭 결과가 있으면 분석 이유 정보 사용

  return (
    <div className="flex flex-col gap-2 items-center">
      <h6 className="text-brand">{user?.name} 님의 매칭 결과</h6>
      <h2 className="text-bk text-center">
        {result.message.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            {index < result.message.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h2>
      <h6 className="text-dg text-center">
        {result.subtitle.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            {index < result.subtitle.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h6>
      {/* AI 분석 결과 표시 */}
    </div>
  );
}

// 매칭된 동물 목록 컴포넌트
function MatchedPetsList({
  isLoading,
  aiMatchingResult,
}: {
  isLoading: boolean;
  aiMatchingResult: AIRecommendResponse | null;
}) {
  const { user } = useAuth();

  // AI 매칭 결과가 있으면 그것을 사용, 없으면 기본 동물 목록 사용
  const animals =
    aiMatchingResult?.data?.animal_recommendations ||
    mainPetInfo.filter((pet) => pet.tag === "보호중").slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="text-start mb-4">
          <h2 className="text-bk text-xl font-bold mb-2">
            {user?.nickname} 님과
            <br />꼭 맞는 아이들이에요!
          </h2>
          <p className="text-dg text-sm">결과는 매일 업데이트 돼요.</p>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-start mb-4">
        <h2 className="text-bk text-xl font-bold mb-2">
          {user?.nickname || "사용자"} 님과
          <br />꼭 맞는 아이들이에요!
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {animals.map((animal: unknown, index: number) => {
          const animalData = animal as Record<string, unknown>;
          const isAIMatching = animalData.animal_id;

          // 디버깅용 로그
          console.log(`Animal ${index + 1}:`, {
            isAIMatching,
            activity_level: animalData.activity_level,
            sensitivity: animalData.sensitivity,
            sociability: animalData.sociability,
            separation_anxiety: animalData.separation_anxiety,
          });

          if (isAIMatching) {
            // AI 매칭 결과 데이터
            return (
              <PetCard
                key={String(animalData.animal_id)}
                pet={{
                  id: String(animalData.animal_id),
                  name: String(animalData.animal_name),
                  breed: String(animalData.breed || "믹스견"),
                  isFemale: String(animalData.gender) === "암",
                  protection_status: "보호중" as const,
                  adoption_status: "입양가능" as const,
                  centerId: String(animalData.center_name || "AI 매칭"),
                  animalImages: [
                    {
                      id: "0",
                      imageUrl: "", // AI 매칭 결과에는 이미지가 없으므로 기본 이미지 사용
                      orderIndex: 0,
                    },
                  ],
                  foundLocation: String(
                    animalData.found_location || "AI 매칭 추천"
                  ),
                  // 성향 정보 추가
                  activityLevel: (animalData.activity_level as number) || null,
                  sensitivity: (animalData.sensitivity as number) || null,
                  sociability: (animalData.sociability as number) || null,
                  separationAnxiety:
                    (animalData.separation_anxiety as number) || null,
                }}
                variant="variant2"
                rank={index + 1}
              />
            );
          } else {
            // mainPetInfo 데이터
            const petInfo = animal as (typeof mainPetInfo)[0];
            return (
              <PetCard
                key={petInfo.id}
                pet={{
                  id: petInfo.id,
                  name: petInfo.name,
                  breed: petInfo.color || "",
                  isFemale: petInfo.isFemale,
                  protection_status: "보호중" as const,
                  adoption_status: "입양가능" as const,
                  centerId: petInfo.center,
                  animalImages: petInfo.imageUrls.map(
                    (img: string, imgIndex: number) => ({
                      id: String(imgIndex),
                      imageUrl: img,
                      orderIndex: imgIndex,
                    })
                  ),
                  foundLocation: petInfo.foundLocation,
                }}
                variant="variant2"
                rank={index + 1}
              />
            );
          }
        })}
      </div>
    </div>
  );
}

// 매칭 결과 이미지 컴포넌트
function MatchingResultImage({
  type,
  isLoading = false,
}: {
  type: MatchingResultType | null;
  isLoading?: boolean;
}) {
  const result = type ? matchingResults[type] : null;
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    if (isLoading) {
      // 로딩 중일 때 1초마다 일러스트 변경
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % loadingImages.length);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // 로딩이 끝나면 해당 타입의 일러스트로 고정
      setCurrentImageIndex(0);
    }
  }, [isLoading]);

  const currentImage = isLoading
    ? loadingImages[currentImageIndex]
    : result?.image || "/illust/matching.svg"; // 기본 이미지
  const currentAlt = isLoading
    ? `로딩 중 일러스트 ${currentImageIndex + 1}`
    : result?.imageAlt || "매칭 대기 이미지";

  return (
    <div className="flex justify-center">
      <Image
        src={currentImage}
        alt={currentAlt}
        width={330}
        height={240}
        className="object-contain transition-all duration-500 ease-in-out"
        priority
      />
    </div>
  );
}

export default function MatchingCompletePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  const userStore = useMatchingStepStore(user?.id);
  const anonStore = useMatchingStepStore();
  const aiMatchingResult =
    userStore.aiMatchingResult || anonStore.aiMatchingResult;

  // AI 매칭 결과를 기반으로 매칭 타입 결정
  const matchingType: MatchingResultType | null =
    getMatchingTypeFromAIResult(aiMatchingResult);

  React.useEffect(() => {
    // AI 매칭 결과가 있으면 바로 사용, 없으면 1초 후 로딩 상태 해제
    if (aiMatchingResult) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [aiMatchingResult]);

  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar
        variant="variant6"
        right={
          <IconButton
            icon={({ size }) => <X size={size} weight="bold" />}
            size="iconM"
            onClick={() => router.push("/")}
          />
        }
      />
      <div className="flex flex-col px-4 py-20 items-center gap-9">
        <MatchingResult type={matchingType} aiResult={aiMatchingResult} />
        <MatchingResultImage type={matchingType} isLoading={isLoading} />
        <MatchedPetsList
          isLoading={isLoading}
          aiMatchingResult={aiMatchingResult}
        />

        <div className="flex flex-col gap-3 w-full mt-8">
          {/* TODO 공유 기능 추가 필요 - 현재 '내 결과'만 접근 가능 */}
          {/* <BigButton
            variant="variant5"
            left={<ShareNetwork size={20} />}
            className="w-full py-4"
          >
            결과 공유하기
          </BigButton> */}
          <div className="flex justify-center gap-2">
            <MiniButton
              text="다시 해보기"
              leftIcon={<ArrowClockwise size={16} />}
              variant="primary"
              onClick={() => router.push("/matching")}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
