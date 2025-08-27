"use client";

import React from "react";

import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";

export interface StepProps {
  onNext: () => void;
}

export function Step5({ onNext }: StepProps) {
  const [agree, setAgree] = React.useState(false);
  const isValid = agree;

  return (
    <>
      <Container className="min-h-screen pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">원활한 서비스 사용을 위한 동의문이에요.</h2>
          <p className="body2 text-gr">
            모니터링 전송 요구 및 개인정보 수집/이용
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="body text-dg">
            보다 건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인
            모니터링 요청이 ...
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
        primaryButtonText="확인"
        onPrimaryButtonClick={onNext}
        primaryButtonDisabled={!isValid}
      />
    </>
  );
}

export default Step5;
