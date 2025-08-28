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
  const { mutate: postAnimalMatching } = usePostAnimalMatching({
    onSuccess: (data) => {
      console.log("AI 매칭 성공:", data);
      // AI 매칭 결과를 스토어에 저장
      setAIMatchingResult(data);
      // 바로 결과 페이지로 이동
      router.push("/matching/result?type=perfect");
    },
    onError: (error) => {
      console.error("AI 매칭 실패:", error);
      // 에러가 있어도 결과 페이지로 이동
      router.push("/matching/result?type=perfect");
    },
  });
  const { user } = useAuth();
  const router = useRouter();

  const handleNext = async () => {
    if (selectedGender !== null) {
      setStepAnswer(10, { type: "gender", value: selectedGender });

      // AI 매칭 요청 전송
      console.log("각 단계별 상세 답변:");
      Object.entries(answers).forEach(([step, answer]) => {
        console.log(`Step ${step}:`, answer);
      });

      if (user?.id) {
        const preferences: Record<string, string | number | boolean> = {};

        // 모든 답변을 preferences 객체로 변환
        Object.entries(answers).forEach(([, answer]) => {
          if (answer) {
            preferences[answer.type] = answer.value;
          }
        });

        // 현재 단계의 답변도 추가
        preferences.gender = selectedGender;

        const requestData = {
          user_id: user.id,
          preferences,
          limit: 5,
        };

        console.log("AI 매칭 요청 데이터:", requestData);

        postAnimalMatching(requestData);
      } else {
        console.log("사용자 정보가 없음");
        onNext();
      }
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
