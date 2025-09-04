"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";

export interface StepProps {
  onNext: () => void;
}

export function Step2({ onNext }: StepProps) {
  const [name, setName] = React.useState("");
  const isNameValid = name.trim().length >= 2;

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleNext = () => {
    if (!isNameValid) {
      showErrorToast("이름은 2글자 이상 입력해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.name", name.trim());
      onNext();
    } catch (error) {
      console.error("이름 저장 실패:", error);
      showErrorToast("정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">이름을 입력해주세요.</h2>
        <Input
          variant="primary"
          label="이름"
          placeholder="이름을 입력해주세요."
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputMode="text"
          maxLength={15}
        />
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
        onPrimaryButtonClick={handleNext}
        primaryButtonDisabled={!isNameValid}
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

export default Step2;
