"use client";

import React from "react";

import { CustomInput } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { InfoCard } from "@/components/ui/InfoCard";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { openKakaoAddress } from "@/lib/openKakaoAddress";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useUpdateProfile } from "@/hooks/mutation/useUpdateProfile";

export interface StepProps {
  onNext: () => void;
}

export function Step4({ onNext }: StepProps) {
  const { user } = useAuth();
  const { data: storeData, updateField } = useAdoptionVerificationStore(
    user?.id
  );
  const updateProfileMutation = useUpdateProfile();

  const [roadAddress, setRoadAddress] = React.useState("");
  const [detailAddress, setDetailAddress] = React.useState("");
  const [visibility, setVisibility] = React.useState("");

  // 완전한 주소 문자열 생성
  const fullAddress = React.useMemo(() => {
    return [roadAddress, detailAddress].filter(Boolean).join(" ");
  }, [roadAddress, detailAddress]);

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleAddressSearch = () => {
    try {
      openKakaoAddress((selectedAddress) => {
        setRoadAddress(selectedAddress);
      });
    } catch (error) {
      console.error("주소 검색 실패:", error);
      showErrorToast("주소 검색에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const isAddressValid = roadAddress.trim().length > 0 && detailAddress.trim().length > 0;
  const isVisibilityValid =
    visibility === "공개함" || visibility === "공개안함";
  const isValid = isAddressValid && isVisibilityValid;
  const isSaving = updateProfileMutation.isPending;

  const handleNext = async () => {
    if (!roadAddress.trim()) {
      showErrorToast("주소를 검색해주세요.");
      return;
    }
    if (!detailAddress.trim()) {
      showErrorToast("상세주소를 입력해주세요.");
      return;
    }
    if (!isVisibilityValid) {
      showErrorToast("공개여부를 선택해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.address", fullAddress);
      sessionStorage.setItem("verification.addressVisibility", visibility);
      updateField("address", fullAddress);
      updateField("addressIsPublic", visibility === "공개함");

      // Step1~4에서 모은 사용자 정보로 프로필 수정 API 한 번 호출
      if (user) {
        try {
          await updateProfileMutation.mutateAsync({
            name: storeData?.name,
            phone_number: storeData?.phone?.replace(/\D/g, ""),
            is_phone_verified: storeData?.isPhoneVerified ?? undefined,
            birth: storeData?.birth,
            address: fullAddress,
            address_is_public: visibility === "공개함",
          });
        } catch (error) {
          console.error("프로필 수정 API 호출 실패:", error);
        }
      }

      onNext();
    } catch (error) {
      console.error("주소 정보 저장 실패:", error);
      showErrorToast("정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  React.useEffect(() => {
    if (storeData?.address) {
      setRoadAddress(storeData.address);
    } else if (typeof window !== "undefined") {
      const savedAddress = sessionStorage.getItem("verification.address");
      if (savedAddress) {
        setRoadAddress(savedAddress);
      }
    }

    const savedVisibility = storeData?.addressIsPublic;
    if (savedVisibility !== undefined) {
      setVisibility(savedVisibility ? "공개함" : "공개안함");
    } else if (typeof window !== "undefined") {
      const visibilityValue = sessionStorage.getItem(
        "verification.addressVisibility"
      );
      if (visibilityValue) {
        setVisibility(visibilityValue);
      }
    }
  }, [storeData?.address, storeData?.addressIsPublic]);

  return (
    <>
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <h2 className="text-bk mb-6">주소를 입력해주세요.</h2>
        <div className="flex flex-col w-full">
          <h5 className="text-dg">주소 <span className="text-brand ml-1">*</span></h5>
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col space-y-1">
              <SearchInput
                variant="variant2"
                placeholder="도로명 주소로 검색해주세요."
                value={roadAddress}
                onSearch={handleAddressSearch}
                readOnly={true}
              />
              <CustomInput
                variant="primary"
                placeholder="상세주소를 입력해주세요."
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                inputMode="text"
                maxLength={50}
                required
              />
            </div>
            <CustomInput
              variant="Variant7"
              label="공개여부"
              placeholder="공개여부를 선택해주세요."
              value={visibility}
              onChangeOption={(v) => setVisibility(v)}
              twoOptions={["공개함", "공개안함"]}
              required
            />
            {visibility === "공개안함" && (
              <InfoCard>
                주소는 입양 절차 진행 시에만 공개되니 안심하세요.
              </InfoCard>
            )}
          </div>
        </div>
      </div>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText={isSaving ? "정보 저장 중..." : "확인"}
        onPrimaryButtonClick={handleNext}
        primaryButtonDisabled={!isValid || isSaving}
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

export default Step4;
