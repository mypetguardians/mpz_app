"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";

export default function MatchingPage() {
  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar
        variant="variant6"
        right={
          <Link href="/">
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
        }
      />
      <div className="flex flex-col px-4 py-20 items-center gap-9">
        <div className="flex flex-col gap-1 items-center">
          <h4 className="text-brand-light">반려동물 성향 테스트</h4>
          <h2 className="text-bk">나한테 찰떡인 강아지는?</h2>
          <h6 className="text-dg">
            어떤 강아지와 맞을지 궁금하다면 바로 시작해보세요!
          </h6>
        </div>

        <div className="flex justify-center">
          <Image
            src="/illust/matching.svg"
            alt="입양 완료 일러스트"
            width={330}
            height={240}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col gap-3 w-full px-5">
          <Link
            href="/matching/question/1"
            className="flex cursor-pointer items-center justify-center"
          >
            <BigButton className="w-full border-none">시작하기</BigButton>
          </Link>
          <Link
            href="/login/center"
            className="flex cursor-pointer items-center justify-center"
          ></Link>
        </div>
      </div>
    </Container>
  );
}
