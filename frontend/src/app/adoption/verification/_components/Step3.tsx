"use client";

import React from "react";

import { CustomInput } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";

export interface StepProps {
  onNext: () => void;
}

export function Step3({ onNext }: StepProps) {
  const [birthRaw, setBirthRaw] = React.useState("");
  const [gender, setGender] = React.useState("");

  const formatBirth = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    if (digits.length <= 4) return y;
    if (digits.length <= 6) return `${y}${m}`;
    return `${y}${m}${d}`;
  };

  const birth = formatBirth(birthRaw);
  const birthDigits = birthRaw.replace(/\D/g, "");
  const year = Number(birthDigits.slice(0, 4));
  const month = Number(birthDigits.slice(4, 6));
  const day = Number(birthDigits.slice(6, 8));
  const isBirthValid =
    birthDigits.length === 8 &&
    year >= 1900 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31;
  const isGenderValid = gender === "남" || gender === "여";
  const isValid = isBirthValid && isGenderValid;

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleNext = () => {
    if (!isBirthValid) {
      showErrorToast("올바른 생년월일을 입력해주세요 (YYYYMMDD).");
      return;
    }
    if (!isGenderValid) {
      showErrorToast("성별을 선택해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.birth", birth);
      sessionStorage.setItem("verification.gender", gender);
      onNext();
    } catch (error) {
      console.error("생년월일/성별 저장 실패:", error);
      showErrorToast("정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">생년월일과 성별을 알려주세요.</h2>
        <div className="flex flex-col gap-3">
          <CustomInput
            variant="primary"
            label="생년월일"
            placeholder="YYYYMMDD"
            value={birth}
            onChange={(e) => setBirthRaw(e.target.value)}
            inputMode="numeric"
            maxLength={10}
            error={birthRaw.length > 0 && !isBirthValid}
          />
          <CustomInput
            variant="Variant7"
            label="성별"
            placeholder="성별을 선택해주세요."
            value={gender}
            onChangeOption={(v) => setGender(v)}
            twoOptions={["남", "여"]}
          />
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

export default Step3;
