"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowLeft } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SignaturePad, SignaturePadHandle } from "@/components/ui/SignaturePad";
import { BigButton } from "@/components/ui/BigButton";

export default function ConsentFormPage() {
  const router = useRouter();
  const signaturePadRef = useRef<SignaturePadHandle | null>(null);
  const [openSignatureSheet, setOpenSignatureSheet] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleConfirmSignature = () => {
    if (!signatureData) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setOpenSignatureSheet(false);
    }, 200);
  };

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
              <h4>동의서 보기</h4>
            </div>
          }
        />
        <div className="mx-4 flex flex-col gap-7 mt-4.5">
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">서명</h2>
            <button
              type="button"
              onClick={() => setOpenSignatureSheet(true)}
              className="h-[200px] bg-lg rounded-2xl border border-gray-200 flex items-center justify-center text-gr hover:border-gray-300 transition-colors"
            >
              {signatureData ? (
                <img
                  src={signatureData}
                  alt="서명 미리보기"
                  className="max-h-[160px] object-contain"
                />
              ) : (
                <span className="text-sm">서명을 입력하려면 눌러주세요</span>
              )}
            </button>
            {signatureData && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    signaturePadRef.current?.clear();
                    setSignatureData("");
                  }}
                  className="text-sm text-gr underline underline-offset-4"
                >
                  서명 초기화
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">유의사항 동의서</h2>
            <p className="body2 text-gr">
              모니터링 전송 요구 및 개인정보 수집/이용
            </p>
            <p className="body text-dg">
              보다 건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인
              모니터링 요청이 있을 수 있습니다. 보다 건강한 입양절차를 돕기 위해
              마이펫가디언즈에서 주기적인 모니터링 요청이 있을 수 있습니다. 보다
              건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인 모니터링
              요청이 있을 수 있습니다. 보다 건강한 입양절차를 돕기 위해
              마이펫가디언즈에서 주기적인 모니터링 요청이 있을 수 있습니다.
            </p>
          </div>
        </div>
      </Container>

      <BottomSheet
        open={openSignatureSheet}
        onClose={() => !isSaving && setOpenSignatureSheet(false)}
        title="서명 입력"
        description="아래 서명 패드에 직접 서명해주세요."
        confirmButtonText={isSaving ? "저장 중..." : "확인"}
        confirmButtonDisabled={isSaving || !signatureData}
        onConfirm={handleConfirmSignature}
        variant="variant5"
      >
        <div className="p-4 space-y-4">
          <SignaturePad
            ref={signaturePadRef}
            onEnd={(dataUrl) => setSignatureData(dataUrl ?? "")}
            disabled={isSaving}
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
              disabled={isSaving}
            >
              초기화
            </button>
          </div>
          <div className="flex justify-center">
            {signatureData ? (
              <img
                src={signatureData}
                alt="서명 미리보기"
                className="max-h-36 object-contain"
              />
            ) : (
              <div className="h-24 w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gr">
                서명을 그리면 여기에 미리 보입니다.
              </div>
            )}
          </div>
          <BigButton
            variant="variant5"
            onClick={() => {
              signaturePadRef.current?.clear();
              setSignatureData("");
            }}
            className="w-full"
            disabled={isSaving}
          >
            서명 지우기
          </BigButton>
        </div>
      </BottomSheet>
    </>
  );
}
