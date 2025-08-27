"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { MiniButton } from "@/components/ui/MiniButton";
import { KakaoButton } from "@/components/ui/KakaoButton";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LogIn() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  return (
    <Container className="min-h-screen flex flex-col justify-between px-4">
      <div className="flex flex-col gap-1 items-center mt-[90px]">
        <Link href="/">
          <Image
            src="/illust/logo.svg"
            alt="로고 일러스트"
            width={250}
            height={216}
            className="w-full h-full"
            priority
          />
        </Link>
        <h4 className="text-dg">마펫쯔 한 줄 라이팅</h4>
      </div>

      <div className="flex justify-center">
        <div className="w-[420px] h-[216px] flex items-center justify-center">
          <Image
            src="/illust/login.svg"
            alt="로그인 일러스트"
            width={250}
            height={216}
            className="w-full h-full"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-6">
        <KakaoButton className="mx-auto" />
        <Link
          href="/login/center"
          className="cursor-pointer items-center justify-center"
        >
          <MiniButton
            text="센터 계정으로 시작하기"
            variant="filterOff"
            className="w-full border-none"
            leftIcon={<ArrowUpRight size={12} />}
          />
        </Link>
      </div>
    </Container>
  );
}
