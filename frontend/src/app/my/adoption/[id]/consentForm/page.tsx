"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";

interface ConsentFormPageProps {
  params: Promise<{ id: string }>;
}

export default function ConsentFormPage({ params }: ConsentFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = React.use(params);

  const [guidelinesContent, setGuidelinesContent] = useState<string>("");

  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({
    adoptionId: id,
  });

  useEffect(() => {
    // URL 쿼리 파라미터에서 guidelines 내용 가져오기
    const guidelines = searchParams.get("guidelines");
    if (guidelines) {
      setGuidelinesContent(decodeURIComponent(guidelines));
    } else if (adoptionDetail?.contract?.guidelines_content) {
      // API에서 가져온 guidelines 내용 사용
      setGuidelinesContent(adoptionDetail.contract.guidelines_content);
    }
  }, [searchParams, adoptionDetail]);

  const handleBack = () => {
    router.push(`/my/adoption/${id}/request`);
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
              <h4>동의서</h4>
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
              <h4>동의서</h4>
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
              <h4>동의서</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-bk">
                원활한 서비스 사용을 위한 동의문이에요.
              </h2>
              <p className="body2 text-gr">
                모니터링 전송 요구 및 개인정보 수집/이용
              </p>
            </div>

            {/* Guidelines Content */}
            <div className="mb-6">
              <h3 className="text-bk mb-3">동의서 내용</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-dg leading-relaxed whitespace-pre-wrap">
                  {guidelinesContent || "동의서 내용이 준비되지 않았습니다."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
