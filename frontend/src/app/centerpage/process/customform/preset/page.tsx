"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { ListBtn } from "./_components/ListBtn";
import { useSelectedQuestionsStore } from "@/lib/stores/selectedQuestionsStore";
import { useCreateQuestionForm } from "@/hooks";
import { NotificationToast } from "@/components/ui/NotificationToast";

export default function CenterProcessCustomFormPreset() {
  const router = useRouter();
  const [selectedQuestions, setSelectedQuestions] = useState<{
    lifeEnvironment: string[];
    experience: string[];
    responsibility: string[];
  }>({
    lifeEnvironment: [],
    experience: [],
    responsibility: [],
  });

  // 토스트 상태
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // API hook
  const createQuestionForm = useCreateQuestionForm();

  // 토스트 표시 함수
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleLifeEnvironmentSelect = (
    selectedIndexes: number[],
    selectedTexts: string[]
  ) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      lifeEnvironment: selectedTexts,
    }));
  };

  const handleExperienceSelect = (
    selectedIndexes: number[],
    selectedTexts: string[]
  ) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      experience: selectedTexts,
    }));
  };

  const handleResponsibilitySelect = (
    selectedIndexes: number[],
    selectedTexts: string[]
  ) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      responsibility: selectedTexts,
    }));
  };

  const { setQuestions } = useSelectedQuestionsStore();

  const handleCompleteSelection = async () => {
    try {
      // 모든 선택된 질문들을 하나의 배열로 합치기
      const allSelectedQuestions = [
        ...selectedQuestions.lifeEnvironment,
        ...selectedQuestions.experience,
        ...selectedQuestions.responsibility,
      ];

      // 선택된 질문이 없으면 처리하지 않음
      if (allSelectedQuestions.length === 0) {
        showToast("선택된 질문이 없습니다.", "error");
        return;
      }

      // 선택된 질문들을 API에 저장
      for (let i = 0; i < allSelectedQuestions.length; i++) {
        const question = allSelectedQuestions[i];
        await createQuestionForm.mutateAsync({
          question: question,
          type: "text",
          isRequired: false,
          sequence: i + 1,
        });
      }

      // Zustand store에 선택된 질문들 저장
      setQuestions(allSelectedQuestions);

      // 성공 토스트 표시
      showToast("질문이 성공적으로 저장되었습니다.", "success");

      // 잠시 후 다음 페이지로 이동
      setTimeout(() => {
        router.push("/centerpage/process/customform");
      }, 1500);
    } catch (error) {
      console.error("질문 저장 실패:", error);
      showToast("질문 저장에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const lifeEnvironment = [
    "거주 형태를 알려주세요.",
    "거주 공간 소유 여부를 알려주세요.",
    "거주 공간의 계약상 반려동물 허용 여부를 알려주세요.",
    "함께 사는 가족 구성원 수와 나이대를 알려주세요.",
    "동거인의 반려동물 동의 여부를 알려주세요.",
  ];

  const experience = [
    "현재 반려동물 유무를 알려주세요.",
    "과거 반려동물 경험이 있다면, 어떤 종류, 몇 년간 함께했는지 알려주세요.",
    "입양 동기를 알려주세요.",
    "입양/임보 희망 동물의 성향을 알려주세요.",
  ];

  const responsibility = [
    "하루 평균 외출 시간을 알려주세요.",
    "산책 횟수 및 시간 계획이 있다면 알려주세요.",
    "여행 등으로 인해 돌봄 불가능 시 대처 계획이 있다면 알려주세요.",
    "입양/임보 가능 시점을 알려주세요.",
    "직업과 직장 형태를 알려주세요.",
    "SNS 계정 주소가 있다면 입력해주세요.",
    "예방접종 및 중성화 계획이 있다면 알려주세요.",
  ];

  return (
    <Container className="min-h-screen relative">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>입양 신청서 만들기</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-1 pb-[100px]">
        <ListBtn
          title="생활 환경"
          questionItems={lifeEnvironment}
          onItemSelect={handleLifeEnvironmentSelect}
        />
        <ListBtn
          title="반려 경험"
          questionItems={experience}
          onItemSelect={handleExperienceSelect}
        />
        <ListBtn
          title="책임과 계획"
          questionItems={responsibility}
          onItemSelect={handleResponsibilitySelect}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton
          className="w-full"
          disabled={
            (selectedQuestions.lifeEnvironment.length === 0 &&
              selectedQuestions.experience.length === 0 &&
              selectedQuestions.responsibility.length === 0) ||
            createQuestionForm.isPending
          }
          onClick={handleCompleteSelection}
        >
          {createQuestionForm.isPending ? "저장 중..." : "선택 완료"}
        </BigButton>
      </div>

      {/* 토스트 메시지 */}
      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={3000}
        />
      )}
    </Container>
  );
}
