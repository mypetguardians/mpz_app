"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { AddButton } from "@/components/ui/AddButton";
import { Input } from "@/components/ui/CustomInput";
import { Add } from "@/components/ui/Add";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useSelectedQuestionsStore } from "@/lib/stores/selectedQuestionsStore";
import {
  useGetQuestionForms,
  useCreateQuestionForm,
  useUpdateQuestionForm,
  useUpdateQuestionSequence,
  useDeleteQuestionForm,
} from "@/hooks";

export default function CenterProcessCustomForm() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  interface QuestionInput {
    id?: string; // API에서 생성된 ID
    text: string;
    isCustom: boolean;
    type?: string;
    isRequired?: boolean;
    sequence?: number;
  }

  const {
    selectedQuestions,
    setCustomQuestions,
    clearQuestions,
    clearCustomQuestions,
  } = useSelectedQuestionsStore();

  // API hooks
  const { data: questionFormsData, isLoading } = useGetQuestionForms();
  const createQuestionForm = useCreateQuestionForm();
  const updateQuestionForm = useUpdateQuestionForm();
  const updateQuestionSequence = useUpdateQuestionSequence();
  const deleteQuestionForm = useDeleteQuestionForm();

  // Zustand store에서 질문들 가져오기
  const [questionInputs, setQuestionInputs] = useState<QuestionInput[]>([]);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

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

  // 토스트 표시 함수
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // 초기화 1회만 수행하기 위한 ref 가드
  const initializedRef = useRef(false);

  // 컴포넌트 마운트 시 API에서 기존 질문 폼들을 가져오고, Zustand store에서 데이터 가져오기
  useEffect(() => {
    let initialQuestions: QuestionInput[] = [];

    // API에서 기존 질문 폼들을 가져와서 추가
    if (questionFormsData?.questions) {
      const apiQuestions = questionFormsData.questions.map((question) => ({
        id: question.id,
        text: question.question,
        isCustom: false,
        type: question.type,
        isRequired: question.isRequired,
        sequence: question.sequence,
      }));
      initialQuestions = [...initialQuestions, ...apiQuestions];
    }

    // 커스텀 질문들 추가 (기존에 있던 것들)
    const existingCustomQuestions = questionInputs.filter((q) => q.isCustom);
    initialQuestions = [...initialQuestions, ...existingCustomQuestions];

    // preset에서 선택된 질문들이 있으면 추가(한 번만 반영)
    if (selectedQuestions.length > 0 && !initializedRef.current) {
      const presetQuestions = selectedQuestions.map((question: string) => ({
        text: question,
        isCustom: false,
        type: "text",
        isRequired: false,
      }));

      initialQuestions = [...initialQuestions, ...presetQuestions];

      // preset 질문들은 한 번만 사용하므로 삭제
      clearQuestions();
      initializedRef.current = true;
    }

    // sequence 순서대로 정렬
    initialQuestions.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    setQuestionInputs(initialQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionFormsData]);

  // API 데이터가 변경될 때마다 질문 목록 업데이트 (기존 커스텀 질문은 유지)
  useEffect(() => {
    if (!questionFormsData?.questions) return;

    // 저장 중이거나 이미 저장된 상태라면 업데이트하지 않음
    if (createQuestionForm.isPending || updateQuestionForm.isPending) return;

    setQuestionInputs((prev) => {
      const existingCustomQuestions = prev.filter((q) => q.isCustom);

      const apiQuestions = questionFormsData.questions.map((question) => ({
        id: question.id,
        text: question.question,
        isCustom: false,
        type: question.type,
        isRequired: question.isRequired,
        sequence: question.sequence,
      }));

      const allQuestions = [...apiQuestions, ...existingCustomQuestions];

      // sequence 순서대로 정렬
      allQuestions.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

      return allQuestions;
    });
  }, [
    questionFormsData?.questions,
    createQuestionForm.isPending,
    updateQuestionForm.isPending,
  ]);

  // questionInputs가 변경될 때마다 customQuestions를 store에 저장
  useEffect(() => {
    // 저장 중이거나 저장이 완료된 후에는 store에 저장하지 않음
    if (createQuestionForm.isPending || updateQuestionForm.isPending) {
      return;
    }

    // 저장이 성공적으로 완료된 후에는 더 이상 store에 저장하지 않음
    if (createQuestionForm.isSuccess || updateQuestionForm.isSuccess) {
      return;
    }

    setCustomQuestions(questionInputs);
  }, [
    questionInputs,
    setCustomQuestions,
    createQuestionForm.isPending,
    updateQuestionForm.isPending,
    createQuestionForm.isSuccess,
    updateQuestionForm.isSuccess,
  ]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".relative")) {
        setOpenMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddQuestion = () => {
    // 저장 중이 아닐 때만 새 질문 추가
    if (!createQuestionForm.isPending && !updateQuestionForm.isPending) {
      setQuestionInputs((prev) => [
        ...prev,
        { text: "", isCustom: true, type: "text", isRequired: false },
      ]);
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    // 저장 중이 아닐 때만 질문 내용 변경
    if (!createQuestionForm.isPending && !updateQuestionForm.isPending) {
      setQuestionInputs((prev) => {
        const newQuestions = [...prev];
        newQuestions[index] = { ...newQuestions[index], text: value };
        return newQuestions;
      });
    }
  };

  const handleDelete = async (index: number) => {
    const questionToDelete = questionInputs[index];

    if (questionToDelete.id) {
      // API에 삭제 요청
      try {
        await deleteQuestionForm.mutateAsync(questionToDelete.id);
        // 삭제 성공 시 로컬 상태에서도 제거
        setQuestionInputs((prev) => prev.filter((_, i) => i !== index));
        showToast("질문이 성공적으로 삭제되었습니다.", "success");
      } catch (error) {
        console.error("삭제 실패:", error);
        showToast("질문 삭제에 실패했습니다.", "error");
        return;
      }
    } else {
      // 로컬 상태에서만 제거 (아직 저장되지 않은 커스텀 질문)
      setQuestionInputs((prev) => prev.filter((_, i) => i !== index));
      showToast("질문이 제거되었습니다.", "success");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index > 0) {
      const currentQuestion = questionInputs[index];
      const newSequence = questionInputs[index - 1].sequence || index;

      if (currentQuestion.id) {
        // API에 순서 변경 요청
        try {
          await updateQuestionSequence.mutateAsync({
            questionId: currentQuestion.id,
            data: { sequence: newSequence },
          });

          // 성공 시 로컬 상태 업데이트
          setQuestionInputs((prev) => {
            const newQuestions = [...prev];
            [newQuestions[index], newQuestions[index - 1]] = [
              newQuestions[index - 1],
              newQuestions[index],
            ];
            return newQuestions;
          });
          showToast("질문 순서가 변경되었습니다.", "success");
        } catch (error) {
          console.error("순서 변경 실패:", error);
          showToast("질문 순서 변경에 실패했습니다.", "error");
          return;
        }
      } else {
        // 로컬 상태만 업데이트 (아직 저장되지 않은 커스텀 질문)
        setQuestionInputs((prev) => {
          const newQuestions = [...prev];
          [newQuestions[index], newQuestions[index - 1]] = [
            newQuestions[index - 1],
            newQuestions[index],
          ];
          return newQuestions;
        });
        showToast("질문 순서가 변경되었습니다.", "success");
      }
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index < questionInputs.length - 1) {
      const currentQuestion = questionInputs[index];
      const newSequence = questionInputs[index + 1].sequence || index + 2;

      if (currentQuestion.id) {
        // API에 순서 변경 요청
        try {
          await updateQuestionSequence.mutateAsync({
            questionId: currentQuestion.id,
            data: { sequence: newSequence },
          });

          // 성공 시 로컬 상태 업데이트
          setQuestionInputs((prev) => {
            const newQuestions = [...prev];
            [newQuestions[index], newQuestions[index + 1]] = [
              newQuestions[index + 1],
              newQuestions[index],
            ];
            return newQuestions;
          });
          showToast("질문 순서가 변경되었습니다.", "success");
        } catch (error) {
          console.error("순서 변경 실패:", error);
          showToast("질문 순서 변경에 실패했습니다.", "error");
          return;
        }
      } else {
        // 로컬 상태만 업데이트 (아직 저장되지 않은 커스텀 질문)
        setQuestionInputs((prev) => {
          const newQuestions = [...prev];
          [newQuestions[index], newQuestions[index + 1]] = [
            newQuestions[index + 1],
            newQuestions[index],
          ];
          return newQuestions;
        });
        showToast("질문 순서가 변경되었습니다.", "success");
      }
    }
  };

  const handleSave = async () => {
    try {
      // 새로운 커스텀 질문들을 API에 저장
      const customQuestionsToSave = questionInputs.filter(
        (q) => q.isCustom && !q.id
      );

      for (let i = 0; i < customQuestionsToSave.length; i++) {
        const question = customQuestionsToSave[i];
        await createQuestionForm.mutateAsync({
          question: question.text,
          type: question.type || "text",
          isRequired: question.isRequired || false,
          sequence: question.sequence || questionInputs.length + i + 1,
        });
      }

      // 기존 질문들 중 수정된 것들을 API에 업데이트
      const existingQuestionsToUpdate = questionInputs.filter(
        (q) => q.id && q.isCustom
      );

      for (const question of existingQuestionsToUpdate) {
        if (question.id) {
          await updateQuestionForm.mutateAsync({
            questionId: question.id,
            data: {
              question: question.text,
              type: question.type || "text",
              isRequired: question.isRequired || false,
            },
          });
        }
      }

      // 저장 완료 후 store 초기화
      clearCustomQuestions();

      // 성공 토스트 표시
      showToast("질문 폼이 성공적으로 저장되었습니다.", "success");

      // 저장 완료 후 즉시 페이지 이동 (상태 변경 방지)
      setTimeout(() => {
        // mutation 상태 리셋
        createQuestionForm.reset();
        updateQuestionForm.reset();
        router.push("/centerpage/process");
      }, 100);
    } catch (error) {
      console.error("저장 실패:", error);
      showToast("저장 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    }
  };

  if (isLoading) {
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
        <div className="w-full flex items-center justify-center pt-20">
          <p>질문 폼을 불러오는 중...</p>
        </div>
      </Container>
    );
  }

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
      <div className="w-full flex flex-col pt-4 px-4 gap-6 min-h-[100px]">
        <div className="w-full flex flex-col gap-2">
          <h2 className="text-bk">
            예비 입양자에게 제공받고 싶은
            <br />
            정보를 선택해주세요.
          </h2>
          <p className="body2 text-gr">
            이름, 생년월일, 성별, 거주지 주소, 전화번호 등 총 5개의 정보는 필수
            정보로 제공받아요.
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          {questionInputs.map((question, index) => (
            <div key={question.id || index} className="relative">
              <Input
                variant="primary"
                label={`질문${index + 1}`}
                placeholder="자유롭게 질문을 입력해주세요."
                required={false}
                dotThree={true}
                value={question.text}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                disabled={false} // 모든 질문을 편집 가능하도록 변경
                onDotThreeClick={() =>
                  setOpenMenuIndex(openMenuIndex === index ? null : index)
                }
              />
              {openMenuIndex === index && (
                <div className="absolute top-[30px] right-0 z-50 cursor-pointer">
                  <Add
                    onMoveUp={() => {
                      handleMoveUp(index);
                      setOpenMenuIndex(null);
                    }}
                    onMoveDown={() => {
                      handleMoveDown(index);
                      setOpenMenuIndex(null);
                    }}
                    onDelete={() => {
                      handleDelete(index);
                      setOpenMenuIndex(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="w-full flex flex-col gap-2">
          <Link href="/centerpage/process/customform/preset">
            <AddButton>기존 양식에서 선택하기</AddButton>
          </Link>
          <AddButton onClick={handleAddQuestion}>새로 만들기</AddButton>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton
          className="w-full"
          disabled={
            questionInputs.length === 0 ||
            questionInputs.every((q) => q.text.trim() === "") ||
            createQuestionForm.isPending ||
            updateQuestionForm.isPending ||
            updateQuestionSequence.isPending ||
            deleteQuestionForm.isPending
          }
          onClick={handleSave}
        >
          {createQuestionForm.isPending || updateQuestionForm.isPending
            ? "저장 중..."
            : "저장하기"}
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
