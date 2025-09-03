"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";
import { Toast } from "@/components/ui/Toast";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubmitAdoptionApplication } from "@/hooks/mutation/useSubmitAdoptionApplication";
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

  const isValid = agree;

  // 스토어에서 동물 ID 가져오기
  const animalId = adoptionStore.data.animalId;
  const centerId = adoptionStore.data.centerId;

  // 입양신청 제출 핸들러
  const handleSubmit = async () => {
    if (!agree || !animalId) {
      return;
    }

    try {
      // 스토어 데이터를 AdoptionFormData 형태로 변환
      const formData: AdoptionFormData = {
        // 기본 사용자 정보
        phone: adoptionStore.data.phone || "",
        phoneVerification: adoptionStore.data.phoneVerification || false,
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
      setToastMessage("입양 신청이 성공적으로 제출되었습니다!");
      setShowToast(true);

      // 스토어 초기화
      adoptionStore.resetStore();

      // 2초 후 홈으로 이동
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("입양 신청 제출 실패:", error);
      setToastMessage(
        "입양 신청 제출 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setShowToast(true);
    }
  };

  // 토스트 자동 숨김
  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

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

  return (
    <>
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">
            건강한 입양을 위한
            <br />
            유의사항 동의문이에요.
          </h2>
          <p className="body2 text-gr">꼼꼼히 확인 후 서명해주세요.</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="body text-dg">
            센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서
            센터제공 동의서 센터제공 동의서 센터제공 동의서...
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

      {showToast && <Toast>{toastMessage}</Toast>}
    </>
  );
}

export default Step7;
