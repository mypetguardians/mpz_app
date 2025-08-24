"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { InfoCard } from "@/components/ui/InfoCard";

export default function CenterProcessCreateConsent() {
  const router = useRouter();
  const [content, setContent] = useState("");

  const handleBack = () => {
    router.back();
  };

  return (
    <Container className="min-h-screen relative">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>유의사항 동의서 만들기</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-4 min-h-[100px]">
        <InfoCard>
          예비 입양자가 필수로 유의할 사항을 입력하면 돼요. 입양자에겐
          동의/비동의 형태로 보여질 거예요.
        </InfoCard>
        <div className="w-full flex flex-col gap-1">
          <h5 className="text-dg">내용</h5>
          <textarea
            placeholder="예) 입양 후 n개월간 센터의 요청에 응답하지 않을 시, 임의로 입양을 취소할 수 있습니다."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton className="w-full" disabled={content.length === 0}>
          저장하기
        </BigButton>
      </div>
    </Container>
  );
}
