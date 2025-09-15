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

export function Step8({ onNext }: StepProps) {
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null);
  const { user } = useAuth();
  const { setStepAnswer } = useMatchingStepStore(user?.id);

  const handleNext = () => {
    if (selectedAge !== null) {
      setStepAnswer(8, { type: "age", value: selectedAge });
      onNext();
    }
  };

  const ageOptions = [
    {
      id: 1,
      icon: "/icon/age01.svg",
      text: "1년 미만 아가",
    },
    {
      id: 2,
      icon: "/icon/age02.svg",
      text: "3년 이하",
    },
    {
      id: 3,
      icon: "/icon/age03.svg",
      text: "7년 이하",
    },
    {
      id: 4,
      icon: "/icon/age04.svg",
      text: "상관 없음",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q7.</h4>
        <h2 className="text-bk">선호하는 강아지 특징이 있다면 알려주세요!</h2>
        <p className="body2 text-brand-light mb-6">선호하는 나이가 궁금해요</p>

        <div className="grid grid-cols-2 gap-2">
          {ageOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="3"
              selected={selectedAge === option.text}
              onClick={() => setSelectedAge(option.text)}
              className="w-full text-left"
              icon={
                <Image
                  src={option.icon}
                  alt={`나이 ${option.id}`}
                  width={50}
                  height={50}
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
        primaryButtonDisabled={selectedAge === null}
      />
    </>
  );
}

export default Step8;
