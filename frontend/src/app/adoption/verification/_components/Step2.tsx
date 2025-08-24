"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step2({ onNext }: StepProps) {
  const [name, setName] = React.useState("");
  const isNameValid = name.trim().length >= 2;

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
        onPrimaryButtonClick={onNext}
        primaryButtonDisabled={!isNameValid}
      />
    </>
  );
}

export default Step2;
