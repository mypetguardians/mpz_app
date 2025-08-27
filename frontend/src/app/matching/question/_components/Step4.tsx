"use client";

import React from "react";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step4({ onNext }: StepProps) {
  const [selectedGoOut, setSelectedGoOut] = React.useState<string | null>(null);
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedGoOut !== null) {
      setStepAnswer(4, { type: "time", value: selectedGoOut });
      onNext();
    }
  };

  const GoOutOptions = [
    {
      id: 1,
      text: "거의 항상 집에 있거나, 집을 비우는 시간이 하루 2시간 미만이에요.",
    },
    {
      id: 2,
      text: "하루 2~4시간 정도 집을 비워요.",
    },
    {
      id: 3,
      text: "하루 4~6시간 정도 집을 비워요.",
    },
    {
      id: 4,
      text: "하루 6~8시간 정도 집을 비워요.",
    },
    {
      id: 5,
      text: "하루 8시간 이상 또는 불규칙적으로 집을 비우는 경우가 많아요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q4.</h4>
        <h2 className="text-bk mb-6">
          하루 중 집을 비우는 시간은 평균적으로 어느 정도인가요?
        </h2>

        <div className="flex flex-col gap-3">
          {GoOutOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedGoOut === option.text}
              onClick={() => setSelectedGoOut(option.text)}
              className="w-full text-left"
            >
              <span className="text-sm">{option.text}</span>
            </SelectButton>
          ))}
        </div>
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="다음으로"
        onPrimaryButtonClick={handleNext}
      />
    </>
  );
}

export default Step4;
