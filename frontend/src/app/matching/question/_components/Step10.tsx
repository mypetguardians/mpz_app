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

export function Step10({ onNext }: StepProps) {
  const [selectedGender, setSelectedGender] = React.useState<number | null>(
    null
  );
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedGender !== null) {
      setStepAnswer(10, { type: "gender", value: selectedGender });
      onNext();
    }
  };

  const genderOptions = [
    {
      id: 1,
      icon: "/icon/gender01.png",
      text: "암",
    },
    {
      id: 2,
      icon: "/icon/gender02.png",
      text: "수",
    },
    {
      id: 3,
      text: "상관 없음",
    },
  ];

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h4 className="text-brand-light">Q9.</h4>
        <h2 className="text-bk">선호하는 강아지 특징이 있다면 알려주세요!</h2>
        <p className="body2 text-brand-light  mb-6">선호하는 성별이 궁금해요</p>

        <div className="flex flex-col gap-2">
          {/* 상단: 암/수 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            {genderOptions.slice(0, 2).map((option) => (
              <SelectButton
                key={option.id}
                variant="3"
                selected={selectedGender === option.id}
                onClick={() => setSelectedGender(option.id)}
                className="w-full text-center"
                icon={
                  option.icon ? (
                    <Image
                      src={option.icon}
                      alt={`성별 ${option.id}`}
                      width={50}
                      height={50}
                    />
                  ) : undefined
                }
              >
                <span className="text-sm">{option.text}</span>
              </SelectButton>
            ))}
          </div>

          {/* 하단: 상관 없음 버튼 */}
          <SelectButton
            variant="3"
            selected={selectedGender === genderOptions[2].id}
            onClick={() => setSelectedGender(genderOptions[2].id)}
            className="w-full text-center"
          >
            <span className="text-sm">{genderOptions[2].text}</span>
          </SelectButton>
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

export default Step10;
