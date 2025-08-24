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

export function Step3({ onNext }: StepProps) {
  const [selectedSensitivity, setSelectedSensitivity] = React.useState<
    number | null
  >(null);
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedSensitivity !== null) {
      setStepAnswer(3, { type: "sensitivity", value: selectedSensitivity });
      onNext();
    }
  };

  const activityOptions = [
    {
      id: 1,
      icon: "/icon/sensitivity01.svg",
      text: "낯선 상황은 불편하고 긴장돼요. 가능하면 피하고 싶어요.",
    },
    {
      id: 2,
      icon: "/icon/sensitivity02.svg",
      text: "처음엔 부담스럽지만, 시간이 지나면 익숙해지긴 해요.",
    },
    {
      id: 3,
      icon: "/icon/sensitivity03.svg",
      text: "새로운 만남이나 장소에 호기심이 생기고, 꽤 즐기는 편이에요.",
    },
    {
      id: 4,
      icon: "/icon/sensitivity04.svg",
      text: "새로운 사람, 새로운 환경에서 에너지를 얻어요! 완전 좋아해요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q3.</h4>
        <h2 className="text-bk mb-6">
          새로운 사람을 만나거나 낯선 장소에 가는 걸 어떻게 느끼시나요?
        </h2>

        <div className="flex flex-col gap-3">
          {activityOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedSensitivity === option.id}
              onClick={() => setSelectedSensitivity(option.id)}
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

export default Step3;
