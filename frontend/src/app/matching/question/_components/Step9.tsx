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

export function Step9({ onNext }: StepProps) {
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const { setStepAnswer } = useMatchingStepStore();

  const handleNext = () => {
    if (selectedSize !== null) {
      setStepAnswer(9, { type: "size", value: selectedSize });
      onNext();
    }
  };

  const sizeOptions = [
    {
      id: 1,
      icon: "/icon/size01.svg",
      text: "소형",
    },
    {
      id: 2,
      icon: "/icon/size02.svg",
      text: "중형",
    },
    {
      id: 3,
      icon: "/icon/size03.svg",
      text: "대형",
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
        <h4 className="text-brand-light">Q8.</h4>
        <h2 className="text-bk">선호하는 강아지 특징이 있다면 알려주세요!</h2>
        <p className="body2 text-brand-light mb-6">선호하는 크기가 궁금해요</p>

        <div className="grid grid-cols-2 gap-2">
          {sizeOptions.map((option) => (
            <SelectButton
              key={option.id}
              variant="3"
              selected={selectedSize === option.text}
              onClick={() => setSelectedSize(option.text)}
              className="w-full text-left"
              icon={
                <Image
                  src={option.icon}
                  alt={`크기 ${option.id}`}
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
      />
    </>
  );
}

export default Step9;
