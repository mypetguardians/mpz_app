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
        <h2 className="text-bk mb-6">답변을 작성해주세요.</h2>
        <div className="flex flex-col gap-3">
          <Input
            variant="primary"
            label="거주 형태를 알려주세요."
            placeholder="자유롭게 작성해주세요."
            required={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputMode="text"
            maxLength={15}
          />
          <Input
            variant="primary"
            label="현재 반려동물 유무를 알려주세요."
            placeholder="자유롭게 작성해주세요."
            required={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputMode="text"
            maxLength={15}
          />
          <Input
            variant="primary"
            label="입양 동기를 알려주세요."
            placeholder="자유롭게 작성해주세요."
            required={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputMode="text"
            maxLength={15}
          />
          <Input
            variant="primary"
            label="직업과 직장 형태를 알려주세요."
            placeholder="자유롭게 작성해주세요."
            required={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputMode="text"
            maxLength={15}
          />
        </div>
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
