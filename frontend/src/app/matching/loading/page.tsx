"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

// 매칭 진행 단계별 데이터
const matchingSteps = [
  {
    message: "당신의 성향을 분석하고 있어요",
    subtitle: "잠시만 기다려주세요...",
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

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function MatchingLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const { aiMatchingResult } = useMatchingStepStore();

  // URL에서 매칭 결과 데이터 가져오기
  const resultParam = searchParams.get("result");

  useEffect(() => {
    // AI 매칭 결과가 이미 있다면 바로 결과 페이지로 이동
    if (aiMatchingResult) {
      router.push("/matching/result?type=perfect");
      return;
    }

    // 1초마다 단계 변경
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < matchingSteps.length - 1) {
          return prev + 1;
        } else {
          // 마지막 단계에서도 AI 매칭 결과를 확인
          clearInterval(stepInterval);
          setTimeout(() => {
            if (aiMatchingResult) {
              router.push("/matching/result?type=perfect");
            } else if (resultParam) {
              // 결과 데이터가 있으면 결과 페이지로 전달
              router.push(
                `/matching/result?type=perfect&result=${resultParam}`
              );
            } else {
              // AI 매칭 결과가 없어도 결과 페이지로 이동 (기본 데이터 사용)
              router.push("/matching/result?type=perfect");
            }
          }, 1500);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(stepInterval);
  }, [router, resultParam, aiMatchingResult]);

  const currentStepData = matchingSteps[currentStep];

  return (
    <div className="flex flex-col px-4 py-20 items-center gap-9 flex-1 justify-center">
      {/* 매칭 진행 상태 */}
      <div className="flex flex-col gap-2 items-center">
        <h6 className="text-brand">매칭 진행 중</h6>
        <h2 className="text-bk text-center">
          {currentStepData.message.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              {index < currentStepData.message.split("\n").length - 1 && <br />}
            </span>
          ))}
        </h2>
        <h6 className="text-dg text-center">
          {currentStepData.subtitle.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              {index < currentStepData.subtitle.split("\n").length - 1 && (
                <br />
              )}
            </span>
          ))}
        </h6>
      </div>

      {/* 애니메이션 이미지 */}
      <div className="flex justify-center">
        <Image
          src={currentStepData.image}
          alt={currentStepData.imageAlt}
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

// 로딩 상태를 표시하는 fallback 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex flex-col px-4 py-20 items-center gap-9 flex-1 justify-center">
      <div className="flex flex-col gap-2 items-center">
        <h6 className="text-brand">매칭 진행 중</h6>
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
