"use client";

import React from "react";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step5({ onNext }: StepProps) {
  const [selectedExperience, setSelectedExperience] = React.useState<
    string | null
  >(null);
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedExperience !== null) {
      setStepAnswer(5, { type: "experience", value: selectedExperience });
      onNext();
    }
  };

  const ExperienceOptions = [
    {
      id: 1,
      text: "전혀 없어요.",
    },
    {
      id: 2,
      text: "어느정도(1~3년) 키워본 경험이 있고, 기본적인 지식은 있어요.",
    },
    {
      id: 3,
      text: "3년 이상 키워본 경험이 있고, 다양한 상황에 대처할 수 있어요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q5.</h4>
        <h2 className="text-bk mb-6">
          반려동물을 키워본 경험이 얼마나 되나요?
        </h2>

        <div className="flex flex-col gap-3">
          {ExperienceOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedExperience === option.text}
              onClick={() => setSelectedExperience(option.text)}
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

export default Step5;
