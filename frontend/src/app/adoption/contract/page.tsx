"use client";

import React, { useState } from "react";
import { X } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function ContractPage() {
  const [openSignSheet, setOpenSignSheet] = useState(false);

  const handleNext = () => {
    // 다음 단계로 이동하는 로직
    console.log("다음 단계로 이동");
  };

  return (
    <>
      <Container className="min-h-screen">
        <TopBar
          variant="variant6"
          right={
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconM"
            />
          }
        />
        <div className="px-4">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-bk">계약서와 관련한 동의사항이에요.</h2>
            <p className="body2 text-gr">꼼꼼히 확인 후 서명해주세요.</p>
          </div>
          <p className="body text-dg">
            센터제공 동의서 센터제공 동의서 센터제공 동의서 센터제공 동의서
            센터제공 동의서 센터제공 동의서 센터제공 동의서...
          </p>
        </div>
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="서명하기"
        onPrimaryButtonClick={() => setOpenSignSheet(true)}
      />

      <BottomSheet
        open={openSignSheet}
        onClose={() => setOpenSignSheet(false)}
        variant="variant5"
        title="타이틀"
        description="서브"
        confirmButtonText="확인"
        onConfirm={() => {
          setOpenSignSheet(false);
          handleNext();
        }}
      >
        <div className="text-[64px] font-extrabold text-gr opacity-30 select-none">
          홍길동
        </div>
      </BottomSheet>
    </>
  );
}
