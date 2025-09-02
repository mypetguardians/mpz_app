"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { usePostAnimalMatching } from "@/hooks/mutation/usePostAnimalMatching";
import { useAuth } from "@/components/providers/AuthProvider";

import { SelectButton } from "@/components/ui/SelectButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step10({ onNext }: StepProps) {
  const [selectedGender, setSelectedGender] = React.useState<string | null>(
    null
  );
  const { setStepAnswer, answers, setAIMatchingResult } =
    useMatchingStepStore();
  const { user } = useAuth();
  const router = useRouter();

  const aiMatchingMutation = usePostAnimalMatching({
    onSuccess: (data) => {
      setAIMatchingResult(data);
    },
    onError: (error) => {
      console.error("AI 매칭 요청 실패:", error);
    },
  });

  const handleNext = async () => {
    if (selectedGender !== null) {
      setStepAnswer(10, { type: "gender", value: selectedGender });

      // onNext는 더 이상 사용하지 않지만 시그니처 유지를 위해 참조
      void onNext;

      // 바로 로딩 페이지로 이동
      router.push("/matching/loading");

      // 백그라운드에서 AI 매칭 API 호출 (응답을 기다리지 않음)
      const requestData = {
        user_id: user?.id || "anonymous",
        preferences: {
          activity_level: answers[1]?.value || "",
          living_space: answers[2]?.value || "",
          age_preference: answers[3]?.value || "",
          gender_preference: selectedGender,
          noise_sensitivity: answers[5]?.value || "",
          size_preference: answers[6]?.value || "",
          experience_level: answers[7]?.value || "",
          time_availability: answers[8]?.value || "",
          budget_range: answers[9]?.value || "",
        },
        limit: 5,
      };

      // 백그라운드에서 API 호출 (결과를 기다리지 않음)
      aiMatchingMutation.mutate(requestData);
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
                selected={selectedGender === option.text}
                onClick={() => setSelectedGender(option.text)}
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
            selected={selectedGender === genderOptions[2].text}
            onClick={() => setSelectedGender(genderOptions[2].text)}
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
