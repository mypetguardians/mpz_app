"use client";

import React from "react";

import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useGetCenterConsents } from "@/hooks/query";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useAuth } from "@/components/providers/AuthProvider";

export interface StepProps {
  onNext: () => void;
}

export function Step6({ onNext }: StepProps) {
  const { user } = useAuth();
  const { data: storeData } = useAdoptionVerificationStore(user?.id);
  const centerId = storeData.centerId;

  const {
    data: consentsData,
    isLoading,
    error,
  } = useGetCenterConsents(centerId || "");

  const [agree, setAgree] = React.useState(false);

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // 활성화된 동의서들 필터링
  const activeConsents =
    consentsData?.filter((consent) => consent.is_active) || [];

  // 첫 번째 동의서 선택
  const firstConsent = activeConsents[0];

  const isValid = agree;

  // 다음 단계 처리 (동의서가 2개 이상이면 Step7로, 1개 이하면 Step7 건너뛰기)
  const handleNext = () => {
    if (!agree) {
      showErrorToast("동의서에 동의해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.firstConsentAgreed", "true");
      if (activeConsents.length <= 1) {
        // 동의서가 1개 이하면 Step7을 건너뛰고 바로 제출 처리
        onNext();
      } else {
        // 동의서가 2개 이상이면 Step7로 이동
        onNext();
      }
    } catch (error) {
      console.error("동의 정보 저장 실패:", error);
      showErrorToast("동의 정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">동의서를 불러오는 중...</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">오류가 발생했습니다 !</h2>
        <p className="text-gray-600">
          동의서를 불러올 수 없습니다. 다시 시도해주세요.
        </p>
        <NotificationToast
          message="동의서를 불러오는 중 오류가 발생했습니다."
          type="error"
          onClose={() => {}}
        />
      </Container>
    );
  }

  // centerId가 없는 경우
  if (!centerId) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">센터 정보가 필요합니다</h2>
        <p className="text-gray-600">
          입양 신청을 진행하려면 센터 정보가 필요합니다.
        </p>
      </Container>
    );
  }

  return (
    <>
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">
            {firstConsent?.title || "원활한 서비스 사용을 위한 동의문이에요."}
          </h2>
          <p className="body2 text-gr">
            {firstConsent?.description ||
              "모니터링 전송 요구 및 개인정보 수집/이용"}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="body text-dg">
            {firstConsent?.content ||
              "보다 건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인 모니터링 요청이 ..."}
          </p>
          <FormListItem
            className="w-full"
            selected={agree}
            onClick={() => setAgree((v) => !v)}
          >
            네, 동의해요.
          </FormListItem>
        </div>
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText={activeConsents.length <= 1 ? "제출하기" : "확인"}
        onPrimaryButtonClick={handleNext}
        primaryButtonDisabled={!isValid}
      />

      {showToast && (
        <NotificationToast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default Step6;
