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

function LogInContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams?.get("next");
    if (next) {
      document.cookie = `redirect_after_login=${encodeURIComponent(next)}; path=/; max-age=600`;
    }
    if (isAuthenticated) {
      router.replace(next || "/");
    }
  }, [isAuthenticated, router, searchParams]);

  return (
    <Container className="min-h-screen flex flex-col justify-between px-4">
      <div className="flex flex-col gap-1 items-center mt-[90px]">
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

      <div className="flex justify-center">
        <div className="w-[198px] h-[162px] flex items-center justify-center">
          <Image
            src="/illust/login.svg"
            alt="로그인 일러스트"
            width={198}
            height={162}
            className="w-full h-full"
            priority
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-[100px]">
        <KakaoButton />
        <Link href="/login/center" className="flex justify-center">
          <MiniButton
            variant="outline"
            text="센터 계정으로 로그인"
            rightIcon={<ArrowUpRight size={18} />}
          />
        </Link>
      </div>
    </Container>
  );
}

export default function LogIn() {
  return (
    <Suspense fallback={<div />}> 
      <LogInContent />
    </Suspense>
  );
}
