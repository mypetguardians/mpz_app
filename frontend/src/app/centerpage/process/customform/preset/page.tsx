"use client";

import { useState, useMemo } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { ListBtn } from "./_components/ListBtn";
import { useSelectedQuestionsStore } from "@/lib/stores/selectedQuestionsStore";
import { useCreateQuestionForm, useGetPresetQuestions } from "@/hooks";
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

  // API hooks
  const createQuestionForm = useCreateQuestionForm();
  const {
    data: presetQuestionsData,
    isLoading: presetQuestionsLoading,
    error: presetQuestionsError,
  } = useGetPresetQuestions();

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

  // API 데이터를 카테고리별로 분류
  const { lifeEnvironment, experience, responsibility } = useMemo(() => {
    if (!presetQuestionsData?.questions) {
      return {
        lifeEnvironment: [],
        experience: [],
        responsibility: [],
      };
    }

    return {
      lifeEnvironment: presetQuestionsData.questions
        .filter((q) => q.category === "lifeEnvironment")
        .map((q) => q.question),
      experience: presetQuestionsData.questions
        .filter((q) => q.category === "experience")
        .map((q) => q.question),
      responsibility: presetQuestionsData.questions
        .filter((q) => q.category === "responsibility")
        .map((q) => q.question),
    };
  }, [presetQuestionsData]);

  return (
    <Container className="min-h-screen relative">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.push("/centerpage/process")}
            />
            <h4>입양 신청서 만들기</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-1 pb-[100px]">
        {presetQuestionsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">질문을 불러오는 중...</div>
          </div>
        ) : presetQuestionsError ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-red-500">
              질문을 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton
          className="w-full"
          disabled={
            presetQuestionsLoading ||
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
