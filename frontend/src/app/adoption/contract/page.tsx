"use client";

import React, { useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignaturePad, SignaturePadHandle } from "@/components/ui/SignaturePad";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import { useSignContract } from "@/hooks/mutation/useSignContract";

interface ContractData {
  adoptionId: string;
  contractId: string;
  animalName: string;
  centerName: string;
  contractContent: string;
  guidelinesContent: string;
}

function ContractContent() {
  const router = useRouter();
  const [openSignSheet, setOpenSignSheet] = useState(false);
  const signaturePadRef = useRef<SignaturePadHandle | null>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSigned, setIsSigned] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const searchParams = useSearchParams();

  // URL에서 adoptionId 가져오기
  const adoptionId = searchParams.get("adoptionId");

  // API에서 입양 신청 상세 정보 가져오기
  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({
    adoptionId: adoptionId || "",
  });

  // 계약서 서명 API 훅
  const signContractMutation = useSignContract();

  // 계약서 데이터 구성
  const contractData: ContractData | null = adoptionDetail
    ? {
        adoptionId: adoptionDetail.adoption.id,
        contractId: adoptionDetail.contract?.id || "",
        animalName: adoptionDetail.adoption.animal_name,
        centerName: adoptionDetail.adoption.center_name,
        contractContent:
          adoptionDetail.contract?.contract_content ||
          "계약서 내용이 준비되지 않았습니다.",
        guidelinesContent:
          adoptionDetail.contract?.guidelines_content ||
          "동의서 내용이 준비되지 않았습니다.",
      }
    : null;

  const handleNext = () => {
    if (isSigned || isAlreadySigned) {
      // 서명 완료 후 입양 상세 페이지로 이동
      if (adoptionId) {
        router.push(`/my/adoption/${adoptionId}/writing`);
      } else {
        router.push(`/my/adoption`);
      }
    }
  };

  const handleSignatureConfirm = async () => {
    if (!signatureData || !contractData?.contractId) {
      return;
    }

    try {
      setIsSigning(true);

      // 서명 API 호출
      await signContractMutation.mutateAsync({
        contractId: contractData.contractId,
        signatureData: signatureData,
      });

      // 서명 완료 상태 업데이트
      setIsSigned(true);
      setOpenSignSheet(false);
    } catch (error) {
      console.error("서명 처리 중 오류 발생:", error);
      // 에러 처리는 mutation의 onError에서 처리됨
    } finally {
      setIsSigning(false);
    }
  };

  // 로딩 상태
  if (isLoading || !adoptionId) {
    return (
      <Container className="min-h-screen">
        <TopBar variant="variant6" />
        <div className="px-4 py-8">
          <p className="text-center text-gr">계약서 데이터를 불러오는 중...</p>
        </div>
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container className="min-h-screen">
        <TopBar variant="variant6" />
        <div className="px-4 py-8">
          <p className="text-center text-red-500">
            계약서 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-center text-gr text-sm mt-2">{error.message}</p>
        </div>
      </Container>
    );
  }

  // 계약서 데이터가 없는 경우
  if (!contractData || !adoptionDetail?.contract) {
    return (
      <Container className="min-h-screen">
        <TopBar variant="variant6" />
        <div className="px-4 py-8">
          <p className="text-center text-gr">
            계약서가 아직 준비되지 않았습니다.
          </p>
        </div>
      </Container>
    );
  }

  // 이미 서명된 경우 확인
  const isAlreadySigned = adoptionDetail.contract.user_signed_at !== null;

  return (
    <>
      <Container className="min-h-screen pb-20">
        <TopBar
          variant="variant6"
          right={
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.back()}
            />
          }
        />
        <div className="px-4">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-bk">계약서와 관련한 동의사항이에요.</h2>
            <p className="body2 text-gr">
              {isAlreadySigned || isSigned
                ? "서명이 완료되었습니다."
                : "꼼꼼히 확인 후 서명해주세요."}
            </p>
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
        primaryButtonText={
          isAlreadySigned || isSigned
            ? "완료"
            : isSigning
            ? "서명 중..."
            : "서명하기"
        }
        onPrimaryButtonClick={() => {
          if (isAlreadySigned || isSigned) {
            handleNext();
          } else {
            setOpenSignSheet(true);
          }
        }}
        primaryButtonDisabled={
          isAlreadySigned || isSigned
            ? false
            : isSigning || signContractMutation.isPending
        }
      />

      <BottomSheet
        open={openSignSheet}
        onClose={() => !isSigning && setOpenSignSheet(false)}
        variant="variant5"
        title="서명하기"
        description="아래 서명 패드에 직접 서명해주세요."
        confirmButtonText={isSigning ? "서명 중..." : "확인"}
        onConfirm={handleSignatureConfirm}
        confirmButtonDisabled={isSigning || !signatureData}
      >
        <div className="p-4 space-y-4">
          <SignaturePad
            ref={signaturePadRef}
            onEnd={(dataUrl) => setSignatureData(dataUrl ?? "")}
            disabled={isSigning}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-gr">서명 미리보기</p>
            <button
              type="button"
              onClick={() => {
                signaturePadRef.current?.clear();
                setSignatureData("");
              }}
              className="text-sm text-gr underline underline-offset-4 disabled:opacity-50"
              disabled={isSigning}
            >
              초기화
            </button>
          </div>
          <div className="flex justify-center">
            {signatureData ? (
              <img
                src={signatureData}
                alt="서명 미리보기"
                className="max-h-36 max-w-full h-auto object-contain"
              />
            ) : (
              <div className="h-24 w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gr">
                서명을 그리면 여기에 미리 보입니다.
              </div>
            )}
          </div>
          {signContractMutation.isError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                서명 처리 중 오류가 발생했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}
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
