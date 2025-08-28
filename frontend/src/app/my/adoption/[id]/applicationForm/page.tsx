"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";

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
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (error || !adoptionDetail) {
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
              <h3 className="text-bk mb-3 font-medium">질문 응답</h3>
              <div className="space-y-4">
                {adoptionDetail.question_responses &&
                adoptionDetail.question_responses.length > 0 ? (
                  adoptionDetail.question_responses.map((response, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <h5 className="text-gr">{response.question_content}</h5>
                        <p className="text-bk body">{response.answer}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gr py-8">
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
