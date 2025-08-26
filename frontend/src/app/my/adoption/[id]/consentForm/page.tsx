"use client";

import React from "react";

import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";

export interface StepProps {
  onNext: () => void;
}

export function ConsentFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { user } = useAuth();

  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({ adoptionId: id, userId: user?.id || "" });

  if (isLoading) {
    return (
      <Container className="min-h-screen pb-28">
        <div className="py-10 text-center">로딩 중...</div>
      </Container>
    );
  }

  if (error || !adoptionDetail) {
    return (
      <Container className="min-h-screen pb-28">
        <div className="py-10 text-center text-red-500">
          오류가 발생했습니다.
        </div>
      </Container>
    );
  }

  const guidelinesContent =
    adoptionDetail.guidelines_content || "동의서 내용이 준비되지 않았습니다.";

  return (
    <>
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">원활한 서비스 사용을 위한 동의문이에요.</h2>
          <p className="text-body2 text-gr">
            모니터링 전송 요구 및 개인정보 수집/이용
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-body text-dg whitespace-pre-wrap">
              {guidelinesContent}
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}

export default ConsentFormPage;
