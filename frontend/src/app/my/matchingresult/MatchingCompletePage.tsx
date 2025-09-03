"use client";

import React from "react";
import Image from "next/image";
import { X, ShareNetwork, ArrowClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { usePostAnimalMatching } from "@/hooks/mutation/usePostAnimalMatching";
import { mainPetInfo } from "@/app/mock";
import { AIRecommendResponse } from "@/types/ai-matching";

// 매칭 결과 타입 정의
type MatchingResultType = "perfect" | "good" | "moderate" | "silent";

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
    message: "반려동물과의 삶은 소중하지만 \n쉬운 일만은 아니에요.",
    subtitle:
      "배변훈련, 건강관리, 예상치 못한 병원비까지...\n함께 잘 할 수 있을까?\n스스로에게 한번 더 물어봐주세요\n충분히 고민해보고, 여유가 생겼을 때 다시 만나는 것도 괜찮아요.",
    image: "/illust/result02.svg",
    imageAlt: "결과2 일러스트",
  },
  moderate: {
    message: "당신의 에너지가\n누군가에게 큰 선물이 될 수 있어요.",
    subtitle:
      "함께 달리고, 함께 배우고, \n매일을 모험처럼 살아가는 걸 좋아하는 아이가 있어요.\n활기찬 하루를 함께 나눌 친구를 소개해드릴게요.",
    image: "/illust/result03.svg",
    imageAlt: "결과3 일러스트",
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

// 매칭된 동물 목록 데이터는 컴포넌트 내에서 동적으로 가져옴

// AI 매칭 결과를 기반으로 매칭 타입 결정하는 함수
function getMatchingTypeFromAIResult(
  aiResult: AIRecommendResponse | null
): MatchingResultType {
  if (!aiResult?.data?.matching_report) return "perfect";

  const { confidence_level, recommended_count } = aiResult.data.matching_report;

  // 신뢰도와 추천 수를 기반으로 매칭 타입 결정
  if (confidence_level === "높음" && recommended_count >= 4) return "perfect";
  if (confidence_level === "높음" && recommended_count >= 2) return "good";
  if (confidence_level === "보통" && recommended_count >= 2) return "moderate";
  return "silent";
}

// 매칭 결과 컴포넌트
function MatchingResult({
  type,
  aiResult,
}: {
  type: MatchingResultType;
  aiResult: AIRecommendResponse | null;
}) {
  const { user } = useAuth();
  const result = matchingResults[type];

  // AI 매칭 결과가 있으면 분석 이유 정보 사용
  const analysisReason = aiResult?.data?.analysis_reason;

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
      {/* 디버깅용 */}
      {analysisReason && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 max-w-sm">
          <h6 className="text-sm font-semibold text-bk mb-2">AI 분석 결과</h6>
          <p className="text-xs text-dg mb-2">
            <strong>성격 유형:</strong> {analysisReason.user_personality_type}
          </p>
          <p className="text-xs text-dg mb-2">
            <strong>라이프스타일:</strong> {analysisReason.lifestyle_match}
          </p>
          <p className="text-xs text-dg">
            <strong>경험 수준:</strong> {analysisReason.experience_level}
          </p>
        </div>
      )}
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
        <p className="text-dg text-sm">결과는 매일 업데이트 돼요.</p>
        {/* 디버깅용 */}
        {aiMatchingResult?.data?.matching_report && (
          <div className="mt-2 p-3 bg-brand-light/10 rounded-lg">
            <p className="text-xs text-brand">
              <strong>매칭 신뢰도:</strong>{" "}
              {aiMatchingResult.data.matching_report.confidence_level}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {animals.map((animal: unknown, index: number) => {
          // AI 매칭 결과인지 mainPetInfo인지 확인
          const animalData = animal as Record<string, unknown>;
          const isAIMatching = animalData.animal_id;

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
                  status: "보호중" as const,
                  centerId: String(animalData.center_name || "AI 매칭"),
                  animalImages: [
                    {
                      id: "0",
                      imageUrl: "/img/dummyImg.png", // AI 매칭 결과에는 이미지가 없으므로 기본 이미지 사용
                      orderIndex: 0,
                    },
                  ],
                  foundLocation: String(
                    animalData.found_location || "AI 매칭 추천"
                  ),
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
                  status: "보호중" as const,
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
  type: MatchingResultType;
  isLoading?: boolean;
}) {
  const result = matchingResults[type];
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
    : result.image;
  const currentAlt = isLoading
    ? `로딩 중 일러스트 ${currentImageIndex + 1}`
    : result.imageAlt;

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
  const { aiMatchingResult, answers, setAIMatchingResult } =
    useMatchingStepStore(user?.id);

  const { mutate: postAnimalMatching } = usePostAnimalMatching({
    onSuccess: (data) => {
      setAIMatchingResult(data);
    },
    onError: () => {
      // 실패해도 페이지는 계속 표시
    },
  });

  // useGetUserAIPersonalityTest로 AI 테스트 결과 가져오기 (필요시 사용)
  // const { data: aiTestResult } = useGetUserAIPersonalityTest(user?.id ?? "");

  // AI 매칭 결과를 기반으로 매칭 타입 결정
  const matchingType: MatchingResultType =
    getMatchingTypeFromAIResult(aiMatchingResult);

  React.useEffect(() => {
    // 결과가 없고 사용자 정보가 있으면 이 페이지에서 AI 매칭 요청 실행
    if (!aiMatchingResult && user?.id) {
      const preferences: Record<string, string | number | boolean> = {};

      Object.entries(answers).forEach(([, answer]) => {
        if (answer) {
          preferences[answer.type] = answer.value;
        }
      });

      postAnimalMatching({ user_id: user.id, preferences, limit: 5 });
    }

    // 로딩 상태 제어: 결과 도착 시 해제, 아니면 짧은 지연 후 해제
    if (aiMatchingResult) {
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [aiMatchingResult, answers, postAnimalMatching, user?.id]);

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
          <BigButton
            variant="variant5"
            left={<ShareNetwork size={20} />}
            className="w-full py-4"
          >
            결과 공유하기
          </BigButton>
          <div className="flex justify-center">
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
