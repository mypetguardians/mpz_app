"use client";

import React from "react";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step6({ onNext }: StepProps) {
  const [selectedNurture, setSelectedNurture] = React.useState<number | null>(
    null
  );
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedNurture !== null) {
      setStepAnswer(6, { type: "custom", value: selectedNurture === 1 ? "yes" : "no" });
      onNext();
    }
  };

  const NurtureOptions = [
    {
      id: 1,
      text: "있어요.",
    },
    {
      id: 2,
      text: "없어요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q5-1.</h4>
        <h2 className="text-bk mb-6">현재 키우고 있는 동물이 있나요?</h2>

        <div className="flex flex-col gap-3">
          {NurtureOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedNurture === option.id}
              onClick={() => setSelectedNurture(option.id)}
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

export default Step6;
