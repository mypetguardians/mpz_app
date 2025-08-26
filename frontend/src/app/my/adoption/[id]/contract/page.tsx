"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";

interface ContractData {
  adoptionId: string;
  animalName: string;
  centerName: string;
  contractContent: string;
  guidelinesContent: string;
}

export default function ContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contractData, setContractData] = useState<ContractData | null>(null);

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

  if (!contractData) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => router.back()}
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
                onClick={() => router.back()}
              />
              <h4>계약서</h4>
            </div>
          }
        />
        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-bk">계약서와 관련한 동의사항이에요</h2>
              <p className="body2 text-gr">
                입양 동물과 센터 정보가 포함된 계약서입니다.
              </p>
            </div>
            {/*  TODO 멘트 수정 */}

            {/* Contract Content */}
            <div className="mb-6">
              <div className="text-sm text-dg leading-relaxed whitespace-pre-wrap">
                {contractData.contractContent}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
