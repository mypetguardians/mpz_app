"use client";

import React from "react";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step7({ onNext }: StepProps) {
  const [selectedAttitude, setSelectedAttitude] = React.useState<string | null>(
    null
  );
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedAttitude !== null) {
      setStepAnswer(7, { type: "custom", value: selectedAttitude });
      onNext();
    }
  };

  const AttitudeOptions = [
    {
      id: 1,
      text: "솔직히 기본적인 돌몸만 해도 벅찰 것 같아요. 아플까봐 걱정되기도 해요.",
    },
    {
      id: 2,
      text: "건강 체크나 간단한 훈련 정도는 시간을 내서 챙기려고 해요.",
    },
    {
      id: 3,
      text: "가족이 된다면, 아플 때나 어려울 때도 끝까지 책임지고 돌볼 각오가 되어 있어요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q6.</h4>
        <h2 className="text-bk mb-6">
          반려동물의 건강관리나 훈련에 대해, 어떤 마음가짐을 가지고 있나요?
        </h2>

        <div className="flex flex-col gap-3">
          {AttitudeOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedAttitude === option.text}
              onClick={() => setSelectedAttitude(option.text)}
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

export default Step7;
