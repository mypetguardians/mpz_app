"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { BigButton } from "@/components/ui/BigButton";

export default function AdoptionRefusePage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="primary"
        left={
          <Link href="/">
            <Image src="/illust/logo.svg" alt="logo" width={71} height={38} />
          </Link>
        }
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] px-4">
        <div className="max-w-md w-full">
          <div className="flex flex-col gap-6 items-center justify-center">
            <div className="flex flex-col gap-1 items-center justify-center">
              <h4 className="text-bk">[센터 이름]</h4>
              <h4 className="text-bk text-base">입양 신청이 거절되었습니다</h4>
            </div>

            {/* Dog Image */}
            <div className="flex items-center justify-center">
              <div className="w-36 h-36 overflow-hidden">
                <Image
                  src="/img/dummyImg.png"
                  alt="강아지 이미지"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Supportive Message */}
            <div className="text-center">
              <p className="text-bk text-sm leading-relaxed">
                신중한 논의를 통해 이루어진 결정으로,
                <br />
                향후에 더 좋은 아이를 만나 뵐 수 있길 바라요.
              </p>
            </div>
          </div>

          {/* Go Home Button */}
          <div className="mt-12 mx-5">
            <BigButton onClick={handleGoHome} className="w-full">
              홈으로 돌아가기
            </BigButton>
          </div>
        </div>
      </div>
    </Container>
  );
}
