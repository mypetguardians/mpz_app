"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface ContractData {
  adoptionId: string;
  animalName: string;
  centerName: string;
  contractContent: string;
  guidelinesContent: string;
}

function ContractContent() {
  const [openSignSheet, setOpenSignSheet] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [userSignature, setUserSignature] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setContractData(decodedData);
      } catch (error) {
        console.error("계약서 데이터 파싱 오류:", error);
      }
    }
  }, [searchParams]);

  const handleNext = () => {
    if (isSigned) {
      // 서명 완료 후 다음 단계로 이동
      console.log("서명 완료, 다음 단계로 이동");
      // 여기에 서명 완료 후 처리 로직 추가
    }
  };

  const handleSignatureConfirm = () => {
    if (userSignature.trim()) {
      setIsSigned(true);
      setOpenSignSheet(false);
    }
  };

  if (!contractData) {
    return (
      <Container className="min-h-screen">
        <TopBar variant="variant6" />
        <div className="px-4 py-8">
          <p className="text-center text-gr">계약서 데이터를 불러오는 중...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="min-h-screen">
        <TopBar
          variant="variant6"
          right={
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconM"
            />
          }
        />
        <div className="px-4">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-bk">계약서와 관련한 동의사항이에요.</h2>
            <p className="body2 text-gr">꼼꼼히 확인 후 서명해주세요.</p>
          </div>
          {/* 계약서 내용 */}
          <div className="mb-6">
            <h3 className="text-bk mb-3">계약서 내용</h3>
            <div>
              <p className="body text-dg whitespace-pre-wrap">
                {contractData.contractContent}
              </p>
            </div>
          </div>
        </div>
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText={isSigned ? "완료" : "서명하기"}
        onPrimaryButtonClick={() => {
          if (isSigned) {
            handleNext();
          } else {
            setOpenSignSheet(true);
          }
        }}
        primaryButtonDisabled={false}
      />

      <BottomSheet
        open={openSignSheet}
        onClose={() => setOpenSignSheet(false)}
        variant="variant5"
        title="서명하기"
        description="아래에 서명해주세요"
        confirmButtonText="확인"
        onConfirm={handleSignatureConfirm}
      >
        <div className="p-4">
          <input
            type="text"
            placeholder="서명을 입력하세요"
            value={userSignature}
            onChange={(e) => setUserSignature(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          />
          <div className="text-center">
            <p className="text-sm text-gr mb-2">서명 미리보기:</p>
            <div className="text-[32px] font-extrabold text-gr opacity-60 select-none">
              {userSignature || "서명"}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

export default function ContractPage() {
  return (
    <Suspense
      fallback={
        <Container className="min-h-screen">
          <TopBar variant="variant6" />
          <div className="px-4 py-8">
            <p className="text-center text-gr">로딩 중...</p>
          </div>
        </Container>
      }
    >
      <ContractContent />
    </Suspense>
  );
}
