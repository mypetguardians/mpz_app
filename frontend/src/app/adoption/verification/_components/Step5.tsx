"use client";

import React from "react";

import { CustomInput } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useGetCenterProcedureQuestions } from "@/hooks/query/useGetCenterProcedureQuestions";
import { CenterProcedureQuestion } from "@/types/center";

import { useAdoptionVerificationStore } from "@/lib/stores/adoptionVerificationStore";
import { useAuth } from "@/components/providers/AuthProvider";

export interface StepProps {
  onNext: () => void;
}

export function Step5({ onNext }: StepProps) {
  const { user } = useAuth();
  const { data: userStoreData } = useAdoptionVerificationStore(user?.id);
  const { data: anonymousStoreData } =
    useAdoptionVerificationStore("anonymous");
  const centerId = userStoreData?.centerId || anonymousStoreData?.centerId;

  const {
    data: questionsData,
    isLoading,
    error,
  } = useGetCenterProcedureQuestions(
    { centerId: centerId || "" },
    { enabled: !!centerId }
  );

  // 각 질문에 대한 답변을 저장할 상태
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // 답변 변경 핸들러
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // 모든 질문이 답변되었는지 확인 (질문이 없으면 통과)
  const isAllQuestionsAnswered = React.useMemo(() => {
    const questions = questionsData?.questions;
    if (!questions) return false; // 아직 로딩되지 않음
    if (questions.length === 0) return true; // 질문이 없으면 바로 진행 가능

    // 모든 질문에 답변이 입력되었는지 확인
    return questions.every(
      (q: CenterProcedureQuestion) => (answers[q.id] || "").trim().length > 0
    );
  }, [questionsData, answers]);

  const handleNext = () => {
    if (!isAllQuestionsAnswered) {
      showErrorToast("모든 질문에 답변해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.answers", JSON.stringify(answers));
      onNext();
    } catch (error) {
      console.error("답변 저장 실패:", error);
      showErrorToast("답변 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">질문을 불러오는 중...</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">오류가 발생했습니다</h2>
        <p className="text-gray-600">
          질문을 불러올 수 없습니다. 다시 시도해주세요.
        </p>
        <NotificationToast
          message="질문을 불러오는 중 오류가 발생했습니다."
          type="error"
          onClose={() => {}}
        />
      </Container>
    );
  }

  // centerId가 없는 경우
  if (!centerId) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">센터 정보가 필요합니다</h2>
        <p className="text-gray-600">
          입양 신청을 진행하려면 센터 정보가 필요합니다.
        </p>
      </Container>
    );
  }

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">답변을 작성해주세요.</h2>
        {questionsData?.questions && questionsData.questions.length === 0 ? (
          <div className="text-center text-gray-600 py-10">
            현재 이 센터에서 수집하는 추가 질문이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {questionsData?.questions
              ?.sort(
                (a: CenterProcedureQuestion, b: CenterProcedureQuestion) =>
                  a.sequence - b.sequence
              )
              .map((question: CenterProcedureQuestion) => (
                <CustomInput
                  key={question.id}
                  variant="primary"
                  label={question.question}
                  placeholder="자유롭게 작성해주세요."
                  required={question.is_required}
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  inputMode="text"
                  maxLength={500}
                  multiline={true}
                  rows={4}
                />
              ))}
          </div>
        )}
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
        onPrimaryButtonClick={handleNext}
        primaryButtonDisabled={!isAllQuestionsAnswered}
      />

      {showToast && (
        <NotificationToast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default Step5;
