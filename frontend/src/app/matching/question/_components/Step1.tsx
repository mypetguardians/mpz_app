"use client";

import React from "react";
import Image from "next/image";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { useAuth } from "@/components/providers/AuthProvider";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step1({ onNext }: StepProps) {
  const [selectedActivity, setSelectedActivity] = React.useState<string | null>(
    null
  );
  const { user } = useAuth();
  const { setStepAnswer } = useMatchingStepStore(user?.id);

  const handleNext = () => {
    if (selectedActivity !== null) {
      setStepAnswer(1, { type: "activity", value: selectedActivity });
      onNext();
    }
  };

  const activityOptions = [
    {
      id: 1,
      icon: "/icon/activity01.svg",
      text: "대부분 집에서 시간을 보내요.",
    },
    {
      id: 2,
      icon: "/icon/activity02.svg",
      text: "가끔 산책이나 가벼운 외출을 즐겨요.",
    },
    {
      id: 3,
      icon: "/icon/activity03.svg",
      text: "규칙적으로 운동하거나 야외 활동을 해요.",
    },
    {
      id: 4,
      icon: "/icon/activity04.svg",
      text: "매일 활발하게 움직이고 새로운 활동을 찾아다녀요.",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q1.</h4>
        <h2 className="text-bk mb-6">평소 얼마나 활동적인 편인가요?</h2>

        <div className="flex flex-col gap-3">
          {activityOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="1"
              selected={selectedActivity === option.text}
              onClick={() => setSelectedActivity(option.text)}
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
              <span className="text-sm ml-2">{option.text}</span>
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

export default Step1;
