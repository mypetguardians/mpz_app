"use client";

import React from "react";
import Image from "next/image";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step2({ onNext }: StepProps) {
  const [selectedSpace, setSelectedSpace] = React.useState<string | null>(null);
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedSpace !== null) {
      setStepAnswer(2, { type: "space", value: selectedSpace });
      onNext();
    }
  };

  const spaceOptions = [
    {
      id: 1,
      icon: "/icon/place01.png",
      text: "조용한 분위기를 좋아해요.",
    },
    {
      id: 2,
      icon: "/icon/place02.png",
      text: "TV나 음악이 종종 켜져있고, 가끔 방문자가 생기기도 해요.",
    },
    {
      id: 3,
      icon: "/icon/place03.png",
      text: "구성원이 많거나 손님이 자주 놀러와 늘 활기찬 편이에요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q2.</h4>
        <h2 className="text-bk mb-6">
          당신의 생활공간에 더 가까운 것은 어떤 편인가요?
        </h2>

        <div className="flex flex-col gap-3">
          {spaceOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedSpace === option.text}
              onClick={() => setSelectedSpace(option.text)}
              className="w-full text-left"
              icon={
                <Image
                  src={option.icon}
                  alt={`활동량 ${option.id}`}
                  width={24}
                  height={24}
                />
              }
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

export default Step2;
