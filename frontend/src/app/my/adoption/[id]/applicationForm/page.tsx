"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import { useGetCenterProcedureQuestions } from "@/hooks/query/useGetCenterProcedureQuestions";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { SectionLine } from "../../_components/SectionLine";

export default function ApplicationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const { id } = React.use(params);

  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({
    adoptionId: id,
  });

  // 센터의 질문 목록 조회
  const {
    data: centerQuestions,
    isLoading: isQuestionsLoading,
    error: questionsError,
  } = useGetCenterProcedureQuestions({
    centerId: adoptionDetail?.adoption?.center_id || "",
  });

  const handleBack = () => {
    router.back();
  };

  if (isLoading || isQuestionsLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>입양 신청서</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (error || questionsError || !adoptionDetail) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>입양 신청서</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8 text-red-500">
            오류가 발생했습니다.
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Container className="min-h-screen">
        {/* TopBar */}
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>입양 신청서</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            <SectionLine>
              <h3 className="text-bk mb-6">입양 신청서</h3>
              <div className="flex flex-col gap-3">
                {centerQuestions?.questions &&
                centerQuestions.questions.length > 0 ? (
                  centerQuestions.questions
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((question) => {
                      // 해당 질문에 대한 답변 찾기
                      const response = adoptionDetail.question_responses?.find(
                        (resp) => resp.question_id === question.id
                      );

                      return (
                        <div key={question.id} className="flex flex-col gap-1">
                          <h5 className="text-gr">{question.question}</h5>
                          <p className="text-bk body">
                            {response?.answer || "답변 없음"}
                          </p>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center text-gr py-8">
                    질문이 없습니다.
                  </div>
                )}
              </div>
            </SectionLine>
          </div>
        </div>
      </Container>
    </div>
  );
}
