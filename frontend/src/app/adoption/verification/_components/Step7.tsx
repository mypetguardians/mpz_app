"use client";

import React from "react";

import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";

export interface StepProps {
  onNext: () => void;
}

export function Step7({ onNext }: StepProps) {
  const [agree, setAgree] = React.useState(false);
  const isValid = agree;

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
        primaryButtonText="확인"
        onPrimaryButtonClick={onNext}
        primaryButtonDisabled={!isValid}
      />
    </>
  );
}

export default Step7;
