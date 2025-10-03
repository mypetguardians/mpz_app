"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetCenterAdoption } from "@/hooks";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { SectionLine } from "../../_components/SectionLine";

// API 응답 타입 정의
interface QuestionResponse {
  question_id?: string;
  question_content?: string;
  question?: string;
  answer: string;
}

export default function ApplicationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const { id } = React.use(params);

  // 개별 입양 신청 조회
  const {
    data: currentAdoption,
    isLoading,
    error,
  } = useGetCenterAdoption(id);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
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
          <div className="py-8 text-center">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (error || !currentAdoption) {
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
          <div className="py-8 text-center text-red-500">
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
        <div className="relative z-10 flex-1 -mt-4 bg-white rounded-t-3xl">
          <div className="p-4">
            <SectionLine>
              <h3 className="mb-3 font-medium text-bk">질문 응답</h3>
              <div className="space-y-4">
                {currentAdoption.question_responses &&
                currentAdoption.question_responses.length > 0 ? (
                  currentAdoption.question_responses.map((response, index) => {
                    const typedResponse = response as QuestionResponse;
                    return (
                      <div key={typedResponse.question_id || index} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <h5 className="text-gr">{typedResponse.question_content || typedResponse.question}</h5>
                          <p className="text-bk body">{typedResponse.answer}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-gr">
                    질문 응답이 없습니다.
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
