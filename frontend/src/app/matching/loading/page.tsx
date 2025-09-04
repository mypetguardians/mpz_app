"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { usePostAnimalMatching } from "@/hooks/mutation/usePostAnimalMatching";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import type { AIRecommendRequest } from "@/types/ai-matching";
import { useAuth } from "@/components/providers/AuthProvider";

// 매칭 진행 단계별 데이터
const matchingSteps = [
  {
    message: "당신의 성향을 분석하고 있어요",
    subtitle: "잠시만 기다려주세요. 최대 3분이 소요됩니다...",
    image: "/illust/result01.svg",
    imageAlt: "분석 중 일러스트",
  },
  {
    message: "가장 잘 맞는 아이들을 찾고 있어요",
    subtitle: "조금만 더 기다려주세요...",
    image: "/illust/result02.svg",
    imageAlt: "매칭 중 일러스트",
  },
  {
    message: "완벽한 매칭을 완성했어요!",
    subtitle: "결과를 확인해보세요!",
    image: "/illust/result03.svg",
    imageAlt: "완성 일러스트",
  },
];

function MatchingLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultParam = searchParams.get("result"); // 서버에서 매칭 ID 같은 값 전달받는다고 가정
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const { setAIMatchingResult } = useMatchingStepStore(user?.id);

  const { mutate, isPending } = usePostAnimalMatching({
    onSuccess: (res) => {
      setAIMatchingResult(res);
      router.replace("/matching/result");
    },
    onError: () => {
      router.replace("/matching/result"); // 실패해도 결과 페이지로 이동
    },
  });

  // 페이지 진입 시 요청 실행
  useEffect(() => {
    if (resultParam) {
      const payload: AIRecommendRequest = {
        user_id: resultParam, // 실제 API 스펙에 맞게 수정
        preferences: {},
        limit: 5,
      };
      mutate(payload);
    }
  }, [resultParam, mutate]);

  // 로딩 단계 애니메이션 - pending 상태일 때만 실행
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < matchingSteps.length - 1 ? prev + 1 : prev
      );
    }, 8000); // 8초마다 다음 단계로

    return () => clearInterval(interval);
  }, [isPending]);

  // pending이 끝나면 즉시 결과 페이지로 이동하거나 완료 상태 표시
  useEffect(() => {
    if (!isPending && currentStep > 0) {
      // API 요청이 완료되면 마지막 단계로 설정 후 잠시 보여주고 이동
      setCurrentStep(matchingSteps.length - 1);
    }
  }, [isPending, currentStep]);

  const stepData = matchingSteps[currentStep];

  return (
    <div className="flex flex-col px-4 py-20 items-center gap-9 flex-1 justify-center">
      {/* 매칭 진행 상태 */}
      <div className="flex flex-col gap-2 items-center">
        <h6 className="text-brand">매칭 진행 중...</h6>
        <h2 className="text-bk text-center">{stepData.message}</h2>
        <h6 className="text-dg text-center">{stepData.subtitle}</h6>
      </div>

      {/* 애니메이션 이미지 */}
      <div className="flex justify-center">
        <Image
          src={stepData.image}
          alt={stepData.imageAlt}
          width={330}
          height={240}
          className="object-contain transition-all duration-500 ease-in-out"
          priority
        />
      </div>

      {/* 진행 바 */}
      <div className="w-full max-w-md">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand h-2 rounded-full transition-all duration-1000 ease-in-out"
            style={{
              width: `${((currentStep + 1) / matchingSteps.length) * 100}%`,
            }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          {currentStep + 1} / {matchingSteps.length}
        </div>
      </div>
    </div>
  );
}

// 로딩 상태 fallback
function LoadingFallback() {
  return (
    <div className="flex flex-col px-4 py-20 items-center gap-9 flex-1 justify-center">
      <div className="flex flex-col gap-2 items-center">
        <h6 className="text-brand">매칭 진행 중...</h6>
        <h2 className="text-bk text-center">당신의 성향을 분석하고 있어요</h2>
        <h6 className="text-dg text-center">잠시만 기다려주세요...</h6>
      </div>
      <div className="flex justify-center">
        <Image
          src="/illust/result01.svg"
          alt="분석 중 일러스트"
          width={330}
          height={240}
          className="object-contain"
          priority
        />
      </div>
      <div className="w-full max-w-md">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-brand h-2 rounded-full w-1/3" />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">1 / 3</div>
      </div>
    </div>
  );
}

export default function MatchingLoadingPage() {
  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar variant="variant6" />
      <Suspense fallback={<LoadingFallback />}>
        <MatchingLoadingContent />
      </Suspense>
    </Container>
  );
}
