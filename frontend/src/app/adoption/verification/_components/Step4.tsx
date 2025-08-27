"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { InfoCard } from "@/components/ui/InfoCard";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

export function Step4({ onNext }: StepProps) {
  const [address, setAddress] = React.useState("");
  const [visibility, setVisibility] = React.useState("");

  const isAddressValid = address.trim().length > 0;
  const isVisibilityValid =
    visibility === "공개함" || visibility === "공개안함";
  const isValid = isAddressValid && isVisibilityValid;

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
        onPrimaryButtonClick={onNext}
        primaryButtonDisabled={!isValid}
      />
    </>
  );
}

export default Step4;
