"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { stepConfig } from "@/lib/stepConfig";
import { X, ArrowLeft } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import Step1 from "../_components/Step1";
import Step2 from "../_components/Step2";
import Step3 from "../_components/Step3";
import Step4 from "../_components/Step4";
import Step5 from "../_components/Step5";
import Step6 from "../_components/Step6";
import LinearProgressBar from "@/components/ui/LinearProgressBar";

export default function VeriticationPage() {
  const router = useRouter();
  const { step } = useParams();
  const currentStep = Number(step);

  // 스크롤 위치 유지 로직
  useEffect(() => {
    const scrollKey = `adoption-verification-scroll-${currentStep}`;

    // 페이지 로드 시 저장된 스크롤 위치 복원
    const restoreScrollPosition = () => {
      const savedScrollPosition = sessionStorage.getItem(scrollKey);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);
        // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤 복원
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 100);
      }
    };

    // 스크롤 위치 저장 함수
    const saveScrollPosition = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      sessionStorage.setItem(scrollKey, scrollY.toString());
    };

    // 브라우저 뒤로가기/앞으로가기 이벤트 감지
    const handlePopState = () => {
      // 약간의 지연을 두어 페이지가 완전히 로드된 후 스크롤 복원
      setTimeout(restoreScrollPosition, 50);
    };

    // 스크롤 이벤트 리스너 (디바운싱 적용)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 150);
    };

    // 이벤트 리스너 등록
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 초기 스크롤 위치 복원
    restoreScrollPosition();

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentStep]);

  const stepsMap: Record<number, React.ReactNode> = {
    1: <Step1 onNext={() => router.push("/adoption/verification/2")} />,
    2: <Step2 onNext={() => router.push("/adoption/verification/3")} />,
    3: <Step3 onNext={() => router.push("/adoption/verification/4")} />,
    4: <Step4 onNext={() => router.push("/adoption/verification/5")} />,
    5: <Step5 onNext={() => router.push("/adoption/verification/6")} />,
    6: <Step6 onNext={() => router.push("/my/adoption")} />,
  };

  if (!stepsMap[currentStep]) {
    return <div>잘못된 단계입니다.</div>;
  }

  return (
    <Container className="min-h-screen">
      <LinearProgressBar
        value={currentStep}
        max={stepConfig.totalSteps}
        className="mt-2"
      />
      <TopBar
        variant="variant6"
        left={
          currentStep > 1 ? (
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => {
                const prev = Math.max(1, currentStep - 1);
                router.push(`/adoption/verification/${prev}`);
              }}
            />
          ) : undefined
        }
        right={
          <IconButton
            icon={({ size }) => <X size={size} weight="bold" />}
            size="iconM"
            onClick={() => router.push("/list/animal")}
          />
        }
      />
      <div className="px-4">{stepsMap[currentStep]}</div>
    </Container>
  );
}
