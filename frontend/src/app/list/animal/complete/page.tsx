"use client";

import Link from "next/link";
import Image from "next/image";
import { X, ArrowUpRight } from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { MiniButton } from "@/components/ui/MiniButton";
import { BigButton } from "@/components/ui/BigButton";

export default function MatchingResultPage() {
  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar
        variant="variant6"
        right={
          <IconButton
            icon={({ size }) => <X size={size} weight="bold" />}
            size="iconM"
          />
        }
      />
      <div className="flex flex-col px-4 py-20 items-center gap-9">
        <div className="flex flex-col gap-1 items-center">
          <h4 className="text-brand">입양 완료 !</h4>
          <h2 className="text-bk">가족이 된 걸 축하드려요!</h2>
          <h6 className="text-dg">
            이제 서로에게 가장 소중한 존재가 되었네요.
            <br />
            지금 바로 입양 첫 날 후기 써보는 거 어때요?
          </h6>
        </div>

        <div className="flex justify-center">
          <Image
            src="/illust/complet.svg"
            alt="입양 완료 일러스트"
            width={330}
            height={240}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col gap-3 w-full px-5">
          <Link
            href="/community"
            className="flex cursor-pointer items-center justify-center"
          >
            <BigButton className="w-full border-none">글쓰러 가기</BigButton>
          </Link>
          <Link
            href="/login/center"
            className="flex cursor-pointer items-center justify-center"
          >
            <MiniButton
              text="다음에 할게요"
              variant="filterOff"
              className="w-full border-none"
              leftIcon={<ArrowUpRight size={12} />}
            />
          </Link>
        </div>
      </div>
    </Container>
  );
}
