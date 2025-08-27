"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { matchingStepConfig } from "@/lib/matchingStepConfig";
import { X, ArrowLeft } from "@phosphor-icons/react";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import Step1 from "../_components/Step1";
import Step2 from "../_components/Step2";
import Step3 from "../_components/Step3";
import Step4 from "../_components/Step4";
import Step5 from "../_components/Step5";
import Step6 from "../_components/Step6";
import Step7 from "../_components/Step7";
import Step8 from "../_components/Step8";
import Step9 from "../_components/Step9";
import Step10 from "../_components/Step10";
import LinearProgressBar from "@/components/ui/LinearProgressBar";

export default function MatchingQuestionPage() {
  const router = useRouter();
  const { step } = useParams();
  const currentStep = Number(step);

  const { setCurrentStep, markStepCompleted, goToNextStep, canGoToStep } =
    useMatchingStepStore();

  useEffect(() => {
    if (currentStep && canGoToStep(currentStep)) {
      setCurrentStep(currentStep);
    } else if (currentStep > 1) {
      // 접근할 수 없는 단계인 경우 이전 단계로 리다이렉트
      router.push(`/matching/question/${currentStep - 1}`);
    }
  }, [currentStep, setCurrentStep, canGoToStep, router]);

  const handleNext = () => {
    markStepCompleted(currentStep);
    goToNextStep();
    router.push(`/matching/question/${currentStep + 1}`);
  };

  const stepsMap: Record<number, React.ReactNode> = {
    1: <Step1 onNext={handleNext} />,
    2: <Step2 onNext={handleNext} />,
    3: <Step3 onNext={handleNext} />,
    4: <Step4 onNext={handleNext} />,
    5: <Step5 onNext={handleNext} />,
    6: <Step6 onNext={handleNext} />,
    7: <Step7 onNext={handleNext} />,
    8: <Step8 onNext={handleNext} />,
    9: <Step9 onNext={handleNext} />,
    10: <Step10 onNext={() => router.push("/matching/result")} />,
  };

  if (!stepsMap[currentStep]) {
    return <div>잘못된 단계입니다.</div>;
  }

  return (
    <Container className="min-h-screen">
      <LinearProgressBar
        value={currentStep}
        max={matchingStepConfig.totalSteps}
        className="mt-2"
      />
      <TopBar
        variant="variant6"
        left={
          <Link href={`/matching/question/${currentStep - 1}`}>
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
        }
        right={
          <Link href="/">
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
        }
      />
      <div className="px-4">{stepsMap[currentStep]}</div>
    </Container>
  );
}
