"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetCenterAdoption, useGetCenterProcedureSettings } from "@/hooks";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import instance from "@/lib/axios-instance";

interface ContractFormPageProps {
  params: Promise<{ id: string }>;
}

export default function ConsentFormPage({ params }: ContractFormPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: adoptionData, isLoading, error } = useGetCenterAdoption(id);
  const { data: procedureSettings } = useGetCenterProcedureSettings();
  // 사용자 계약/서명 상세(센터 권한으로도 조회 가능)
  const { data: userAdoptionDetail, isLoading: isDetailLoading } =
    useGetUserAdoptionDetail({ adoptionId: id });
  const signatureData = userAdoptionDetail?.contract?.user_signature_url ?? "";
  const [contractContent, setContractContent] = useState<string>("");

  const handleBack = () => {
    router.back();
  };

  // 센터 화면에서는 서명 입력을 하지 않음 (표시만)

  // Fallback: 프로시저 설정이 비어 있을 경우 계약서 템플릿 목록에서 활성 템플릿을 직접 조회
  useEffect(() => {
    if (contractContent) return;
    const currentContent =
      procedureSettings?.contract_templates?.find((t) => t.is_active)
        ?.content ??
      procedureSettings?.contract_templates?.[0]?.content ??
      "";
    if (currentContent) {
      setContractContent(currentContent);
      return;
    }
    // 설정에서 못 찾으면 목록 API에서 조회
    (async () => {
      try {
        const res = await instance.get(
          "/centers/procedures/contract-template/"
        );
        const templates: Array<{
          content: string;
          is_active: boolean;
        }> = res.data || [];
        const active =
          templates.find((t) => t.is_active)?.content ??
          templates[0]?.content ??
          "";
        if (active) setContractContent(active);
      } catch {
        // ignore, 화면에 기본 문구 표시
      }
    })();
  }, [procedureSettings, contractContent]);

  if (isLoading || isDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !adoptionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="text-red-500">데이터를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Container className="min-h-screen pb-28">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2 ">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>계약서 작성 · {adoptionData.animal_name}</h4>
            </div>
          }
        />
        <div className="mx-4 flex flex-col gap-7 mt-4.5">
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">입양자 서명</h2>
            <div className="h-[200px] rounded-2xl border border-gray-200 flex items-center justify-center text-gr">
              {signatureData ? (
                <Image
                  src={signatureData}
                  alt="입양자 서명"
                  className="max-h-[160px] object-contain"
                  width={400}
                  height={100}
                />
              ) : (
                <span className="text-sm">서명 데이터가 없습니다.</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">계약서 동의서</h2>
            <p className="body2 text-gr">
              모니터링 전송 요구 및 개인정보 수집/이용
            </p>
            <p className="body text-dg whitespace-pre-line">
              {contractContent ||
                procedureSettings?.contract_templates?.find((t) => t.is_active)
                  ?.content ||
                procedureSettings?.contract_templates?.[0]?.content ||
                "계약서 내용이 등록되지 않았습니다."}
            </p>
          </div>
        </div>
      </Container>

      {/* 센터 화면에서는 서명 입력 바텀시트 제거 */}
    </>
  );
}
