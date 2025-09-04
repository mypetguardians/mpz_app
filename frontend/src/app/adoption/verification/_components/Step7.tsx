"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";
import { Toast } from "@/components/ui/Toast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubmitAdoptionApplication } from "@/hooks/mutation/useSubmitAdoptionApplication";
import { useGetCenterConsents } from "@/hooks/query";
import type { AdoptionFormData } from "@/types/adoption-application";

export interface StepProps {
  onNext?: () => void;
}

export function Step7({}: StepProps) {
  const router = useRouter();
  const { user } = useAuth();
  const adoptionStore = useAdoptionVerificationStore(user?.id);
  const submitMutation = useSubmitAdoptionApplication();

  const [agree, setAgree] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "success"
  );
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const hasAutoSubmittedRef = React.useRef(false);

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType("error");
    setShowToast(true);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType("success");
    setShowToast(true);
  };

  const isValid = agree;

  // 스토어에서 동물 ID 가져오기
  const animalId = adoptionStore.data.animalId;
  const centerId = adoptionStore.data.centerId;

  // 센터 동의서 데이터 가져오기
  const {
    data: consentsData,
    isLoading: consentsLoading,
    error: consentsError,
  } = useGetCenterConsents(centerId || "");

  // 활성화된 동의서들 필터링 후 두 번째 동의서 선택
  const activeConsents =
    consentsData?.filter((consent) => consent.is_active) || [];
  const secondConsent = activeConsents[1]; // 두 번째 동의서

  // 입양신청 제출 핸들러
  const handleSubmit = React.useCallback(async () => {
    // 이미 제출된 경우 중복 제출 방지
    if (isSubmitted) {
      return;
    }

    // 동의서가 1개 이하인 경우 동의 체크 무시, 그 외에는 동의 필요
    const needsAgreement = activeConsents.length > 1;
    if (needsAgreement && !agree) {
      showErrorToast("동의서에 동의해주세요.");
      setIsSubmitted(false);
      return;
    }
    if (!animalId) {
      showErrorToast("동물 정보를 찾을 수 없습니다.");
      setIsSubmitted(false);
      return;
    }

    setIsSubmitted(true);

    try {
      // 스토어 데이터를 AdoptionFormData 형태로 변환
      const formData: AdoptionFormData = {
        // 기본 사용자 정보
        phone: /* adoptionStore.data.phone || "", */ "010-1234-5678",
        phoneVerification:
          /* adoptionStore.data.phoneVerification || false */ true,
        name: adoptionStore.data.name || "",
        birth: adoptionStore.data.birth || "",
        address: adoptionStore.data.address || "",

        // 추가 질문 응답
        occupation: adoptionStore.data.occupation,
        income: adoptionStore.data.income,
        familyMembers: adoptionStore.data.familyMembers,
        housingType: adoptionStore.data.housingType,
        hasYard: adoptionStore.data.hasYard,
        petExperience: adoptionStore.data.petExperience,
        adoptionReason: adoptionStore.data.adoptionReason,
        preparedness: adoptionStore.data.preparedness,
        emergencyContact: adoptionStore.data.emergencyContact,

        // 동의 사항
        monitoringAgreement: true, // Step7에서 동의했으므로 true
        guidelinesAgreement: agree, // 현재 단계의 동의 상태
        isTemporaryProtection: false, // 기본값 (필요시 수정)

        // 메타 정보
        animalId: animalId,
      };

      await submitMutation.mutateAsync(formData);

      // 성공 시 처리
      showSuccessToast("입양 신청이 성공적으로 제출되었습니다!");

      // 스토어 초기화
      adoptionStore.resetStore();

      // 2초 후 홈으로 이동
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("입양 신청 제출 실패:", error);
      showErrorToast(
        "입양 신청 제출 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setIsSubmitted(false); // 실패 시 다시 제출 가능하도록
    }
  }, [
    agree,
    animalId,
    submitMutation,
    router,
    activeConsents.length,
    isSubmitted,
    adoptionStore,
  ]);

  // 토스트 자동 숨김
  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 자동 제출 처리를 위한 useEffect (동의서가 1개 이하인 경우)
  React.useEffect(() => {
    if (
      !consentsLoading &&
      !consentsError &&
      activeConsents.length <= 1 &&
      !isSubmitted &&
      animalId &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      handleSubmit();
    }
  }, [
    consentsLoading,
    consentsError,
    activeConsents.length,
    isSubmitted,
    animalId,
    handleSubmit,
  ]);

  // 로딩 상태 처리
  if (consentsLoading) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="mb-6 text-bk">동의서를 불러오는 중...</h2>
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (consentsError) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="mb-6 text-bk">오류가 발생했습니다</h2>
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

  // 동물 ID가 없는 경우 에러 처리
  if (!animalId || !centerId) {
    return (
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">오류가 발생했습니다.</h2>
          <p className="body2 text-gr">
            동물 정보를 찾을 수 없습니다. 다시 시도해주세요.
          </p>
        </div>
      </Container>
    );
  }

  // API 호출 중이거나 두 번째 동의서가 없는 경우 (동의서가 1개 이하인 경우)
  if (submitMutation.isPending || activeConsents.length <= 1) {
    return (
      <Container className="min-h-screen pb-28">
        <h2 className="mb-6 text-bk">입양 신청을 제출하는 중...</h2>
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">
            {secondConsent?.title ||
              "건강한 입양을 위한 유의사항 동의문이에요."}
          </h2>
          <p className="body2 text-gr">
            {secondConsent?.description || "꼼꼼히 확인 후 서명해주세요."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="body text-dg">
            {secondConsent?.content ||
              "센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서..."}
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
        primaryButtonText="제출하기"
        onPrimaryButtonClick={handleSubmit}
        primaryButtonDisabled={!isValid || submitMutation.isPending}
      />

      {showToast && toastType === "success" && <Toast>{toastMessage}</Toast>}
      {showToast && toastType === "error" && (
        <NotificationToast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default Step7;
