"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { InfoCard } from "@/components/ui/InfoCard";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { openKakaoAddress } from "@/lib/openKakaoAddress";

export interface StepProps {
  onNext: () => void;
}

export function Step4({ onNext }: StepProps) {
  const [address, setAddress] = React.useState("");
  const [visibility, setVisibility] = React.useState("");

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
        setAddress(selectedAddress);
      });
    } catch (error) {
      console.error("주소 검색 실패:", error);
      showErrorToast("주소 검색에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const isAddressValid = address.trim().length > 0;
  const isVisibilityValid =
    visibility === "공개함" || visibility === "공개안함";
  const isValid = isAddressValid && isVisibilityValid;

  const handleNext = () => {
    if (!isAddressValid) {
      showErrorToast("주소를 입력해주세요.");
      return;
    }
    if (!isVisibilityValid) {
      showErrorToast("공개여부를 선택해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.address", address);
      sessionStorage.setItem("verification.addressVisibility", visibility);
      onNext();
    } catch (error) {
      console.error("주소 정보 저장 실패:", error);
      showErrorToast("정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">주소를 입력해주세요.</h2>
        <div className="flex flex-col w-full">
          <h5 className="text-dg">주소</h5>
          <div className="flex flex-col gap-3">
            <SearchInput
              variant="variant2"
              placeholder="도로명 주소로 검색해주세요."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onSearch={handleAddressSearch}
            />
            <Input
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
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
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

export default Step4;
