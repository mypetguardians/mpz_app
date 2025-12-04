"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { MiniButton } from "@/components/ui/MiniButton";
import { KakaoButton } from "@/components/auth/KakaoButton";
import { useAuth } from "@/components/providers/AuthProvider";

function LogInInner() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect");
      if (redirect && typeof redirect === "string") {
        router.replace(redirect);
        return;
      }
      if (typeof window !== "undefined") {
        const sameHost =
          document.referrer &&
          new URL(document.referrer).host === window.location.host;
        if (sameHost) {
          router.back();
          return;
        }
      }
      router.replace("/");
    }
  }, [isAuthenticated, router, searchParams]);

  return (
    <Container className="h-screen flex flex-col justify-between px-4 overflow-hidden py-12">
      <div className="flex flex-col gap-1 items-center mt-8">
        <div className="w-[167px] h-[89px] flex items-center justify-center">
          <Link href="/">
            <Image
              src="/illust/logo.svg"
              alt="로고 일러스트"
              width={167}
              height={89}
              className="w-full h-full"
              priority
            />
          </Link>
        </div>
        <h4 className="text-dg">컴팩트한 유기동물 입양</h4>
      </div>

      <div className="flex justify-center flex-shrink-0">
        <div className="w-[198px] h-[162px] flex items-center justify-center">
          <Image
            src="/illust/login.png"
            alt="로그인 일러스트"
            width={198}
            height={162}
            className="w-full h-full"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-0">
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

export default function LogIn() {
  return (
    <Suspense fallback={null}>
      <LogInInner />
    </Suspense>
  );
}
