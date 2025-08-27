"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowLeft } from "@phosphor-icons/react";

export default function ConsentFormPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2 ">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>동의서 보기</h4>
            </div>
          }
        />
        <div className="mx-4 flex flex-col gap-7 mt-4.5">
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">서명</h2>
            <div className="h-[200px] bg-lg rounded-md" />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-bk">유의사항 동의서</h2>
            <p className="body2 text-gr">
              모니터링 전송 요구 및 개인정보 수집/이용
            </p>
            <p className="body text-dg">
              보다 건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인
              모니터링 요청이 있을 수 있습니다. 보다 건강한 입양절차를 돕기 위해
              마이펫가디언즈에서 주기적인 모니터링 요청이 있을 수 있습니다. 보다
              건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인 모니터링
              요청이 있을 수 있습니다. 보다 건강한 입양절차를 돕기 위해
              마이펫가디언즈에서 주기적인 모니터링 요청이 있을 수 있습니다.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
