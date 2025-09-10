"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { X } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { usePostAnimalMatching } from "@/hooks/mutation/usePostAnimalMatching";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import type { AIRecommendRequest } from "@/types/ai-matching";
import { useAuth } from "@/components/providers/AuthProvider";
import { IconButton } from "@/components/ui/IconButton";

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
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const { user } = useAuth();
  const { setAIMatchingResult, answers } = useMatchingStepStore(user?.id);

  const { mutate, isPending, isSuccess, isError } = usePostAnimalMatching({
    onSuccess: (res) => {
      setAIMatchingResult(res);
      // 사용자가 다른 페이지로 이동한 경우에도 결과를 저장하고 알림
      if (isNavigatingAway) {
        // 로컬 스토리지에 매칭 완료 상태 저장
        localStorage.setItem("matchingCompleted", "true");
        localStorage.setItem("matchingResult", JSON.stringify(res));
        // 브라우저 알림 또는 토스트 메시지 표시 가능
        console.log("매칭이 완료되었습니다! 결과를 확인해보세요.");
      } else {
        router.replace("/matching/result");
      }
    },
    onError: (error) => {
      if (isNavigatingAway) {
        localStorage.setItem("matchingError", "true");
        console.error("AI 매칭 실패:", error);
      } else {
        router.replace("/matching/result"); // 실패해도 결과 페이지로 이동
        console.error("AI 매칭 실패:", error);
      }
    },
  });

  // 페이지 진입 시 요청 실행
  useEffect(() => {
    if (resultParam && answers) {
      // 스토어의 답변 데이터를 preferences 형태로 변환
      const preferences: Record<string, string | number | boolean> = {};

      Object.entries(answers).forEach(([, answer]) => {
        if (answer) {
          preferences[answer.type] = answer.value;
        }
      });

      const payload: AIRecommendRequest = {
        user_id: resultParam,
        preferences,
        limit: 5,
      };
      mutate(payload);
    }
  }, [resultParam, mutate, answers]);

  // X 버튼 클릭 이벤트 리스너
  useEffect(() => {
    const handleNavigationAway = () => {
      setIsNavigatingAway(true);
    };

    window.addEventListener("matchingNavigationAway", handleNavigationAway);

    return () => {
      window.removeEventListener(
        "matchingNavigationAway",
        handleNavigationAway
      );
    };
  }, []);

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
  const router = useRouter();

  const handleXButtonClick = () => {
    // X 버튼 클릭 시 isNavigatingAway 상태를 true로 설정
    const event = new CustomEvent("matchingNavigationAway");
    window.dispatchEvent(event);
    router.push("/");
  };

  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar
        variant="variant6"
        right={
          <IconButton
            icon={({ size }) => <X size={size} weight="bold" />}
            size="iconM"
            onClick={handleXButtonClick}
          />
        }
      />
      <Suspense fallback={<LoadingFallback />}>
        <MatchingLoadingContent />
      </Suspense>
    </Container>
  );
}
