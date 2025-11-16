"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import { useGetCenterContractTemplates } from "@/hooks/query/useGetCenterContractTemplates";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";

interface ContractPageProps {
  params: Promise<{ id: string }>;
}

interface ContractData {
  adoptionId: string;
  animalName: string;
  centerName: string;
  contractContent: string;
  guidelinesContent: string;
}

export default function ContractPage({ params }: ContractPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = React.use(params);

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // 입양 상세 정보 조회
  const {
    data: adoptionDetail,
    isLoading: isAdoptionLoading,
    error: adoptionError,
  } = useGetUserAdoptionDetail({
    adoptionId: id,
  });

  // 센터의 계약서 템플릿 목록 조회
  const {
    data: contractTemplates,
    isLoading: isTemplatesLoading,
    error: templatesError,
  } = useGetCenterContractTemplates(adoptionDetail?.adoption?.center_id || "");

  useEffect(() => {
    // URL 쿼리 파라미터에서 계약서 데이터 가져오기
    const data = searchParams.get("data");
    if (data) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(data));
        setContractData(decodedData);
      } catch (error) {
        console.error("계약서 데이터 파싱 오류:", error);
      }
    }
  }, [searchParams]);

  // 계약서 템플릿이 로드되면 첫 번째 활성 템플릿 선택
  useEffect(() => {
    if (
      contractTemplates &&
      contractTemplates.length > 0 &&
      !selectedTemplateId
    ) {
      const activeTemplate = contractTemplates.find(
        (template) => template.is_active
      );
      if (activeTemplate) {
        setSelectedTemplateId(activeTemplate.id);
      } else {
        setSelectedTemplateId(contractTemplates[0].id);
      }
    }
  }, [contractTemplates, selectedTemplateId]);

  const selectedTemplate = contractTemplates?.find(
    (template) => template.id === selectedTemplateId
  );

  const handleBack = () => {
    router.push(`/my/adoption/${id}/consentForm`);
  };

  if (isAdoptionLoading || isTemplatesLoading) {
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
              <h4>계약서</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (adoptionError || templatesError || !adoptionDetail) {
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
              <h4>계약서</h4>
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
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>계약서</h4>
            </div>
          }
        />
        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-bk">계약서와 관련한 동의사항이에요</h2>
              <p className="body2 text-gr">
                입양 동물과 센터 정보가 포함된 계약서입니다.
              </p>
            </div>

            {/* Contract Templates Selection */}
            {contractTemplates && contractTemplates.length > 0 && (
              <div className="mb-6">
                <h3 className="text-bk mb-3">계약서 템플릿 선택</h3>
                <div className="space-y-2">
                  {contractTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        selectedTemplateId === template.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-bk">
                            {template.title}
                          </h4>
                          {template.description && (
                            <p className="text-sm text-gr mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                        {template.is_active && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            활성
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Content */}
            <div className="mb-6">
              <h3 className="text-bk mb-3">계약서 내용</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-dg leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate?.content ||
                    contractData?.contractContent ||
                    "계약서 내용이 준비되지 않았습니다."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
