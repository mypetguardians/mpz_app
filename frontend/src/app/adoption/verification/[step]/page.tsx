"use client";

import React from "react";
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
import Step7 from "../_components/Step7";
import LinearProgressBar from "@/components/ui/LinearProgressBar";

export default function VeriticationPage() {
  const router = useRouter();
  const { step } = useParams();
  const currentStep = Number(step);

  const stepsMap: Record<number, React.ReactNode> = {
    1: <Step1 onNext={() => router.push("/adoption/verification/2")} />,
    2: <Step2 onNext={() => router.push("/adoption/verification/3")} />,
    3: <Step3 onNext={() => router.push("/adoption/verification/4")} />,
    4: <Step4 onNext={() => router.push("/adoption/verification/5")} />,
    5: <Step5 onNext={() => router.push("/adoption/verification/6")} />,
    6: <Step6 onNext={() => router.push("/adoption/verification/7")} />,
    7: <Step7 onNext={() => router.push("/")} />,
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
          />
        }
      />
      <div className="px-4">{stepsMap[currentStep]}</div>
    </Container>
  );
}
