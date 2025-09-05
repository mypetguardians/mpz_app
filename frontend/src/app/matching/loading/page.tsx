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
    message: "완벽한 매칭을 거의 완성했어요...",
    subtitle: "매칭 결과를 분석하는 중입니다...",
    image: "/illust/result03.svg",
    imageAlt: "완성 일러스트",
  },
];

function MatchingLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultParam = searchParams.get("result");
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const { setAIMatchingResult, answers } = useMatchingStepStore(user?.id);

  const { mutate, isPending, isSuccess, isError } = usePostAnimalMatching({
    onSuccess: (res) => {
      console.log("AI 매칭 성공:", res);
      setAIMatchingResult(res);
      router.replace("/matching/result");
    },
    onError: (error) => {
      console.error("AI 매칭 실패:", error);
      router.replace("/matching/result"); // 실패해도 결과 페이지로 이동
    },
  });

  // 페이지 진입 시 요청 실행
  useEffect(() => {
    if (resultParam && answers) {
      console.log("AI 매칭 요청 시작:", resultParam);
      console.log("사용자 답변 데이터:", answers);

      // 스토어의 답변 데이터를 preferences 형태로 변환
      const preferences: Record<string, string | number | boolean> = {};

      Object.entries(answers).forEach(([stepNum, answer]) => {
        if (answer) {
          preferences[answer.type] = answer.value;
          console.log(`Step ${stepNum}: ${answer.type} = ${answer.value}`);
        }
      });

      console.log("변환된 preferences:", preferences);

      const payload: AIRecommendRequest = {
        user_id: resultParam,
        preferences,
        limit: 5,
      };
      mutate(payload);
    } else {
      console.log("resultParam이 없거나 answers가 없음:", {
        resultParam,
        answers,
      });
    }
  }, [resultParam, mutate, answers]);

  // 로딩 단계 애니메이션 - pending 상태일 때만 실행
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) =>
        prev >= matchingSteps.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isPending]);

  // API 요청 완료 시 결과 페이지로 이동하는 안전장치
  useEffect(() => {
    if (isSuccess || isError) {
      console.log("API 요청 완료 감지 - 결과 페이지로 이동");
      setCurrentStep(matchingSteps.length - 1);
      const timer = setTimeout(() => {
        router.replace("/matching/result");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isError, router]);

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
