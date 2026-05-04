import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, CaretRight } from "@phosphor-icons/react/dist/ssr";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";

export const metadata: Metadata = {
  title: "약관 및 정책 | 마펫쯔",
  description: "마펫쯔 이용약관과 개인정보처리방침을 안내합니다.",
  alternates: { canonical: "https://mpz.kr/terms" },
};

/**
 * 약관 인덱스 페이지 — /terms/service, /terms/privacy로 분기
 */
export default function TermsIndexPage() {
  const items = [
    {
      href: "/terms/service",
      Icon: FileText,
      title: "이용약관",
      desc: "회원의 권리·의무, 서비스 이용 조건, 운영 정책",
    },
    {
      href: "/terms/privacy",
      Icon: ShieldCheck,
      title: "개인정보처리방침",
      desc: "수집·이용·보관·제3자 제공·국외 이전 안내",
    },
  ];

  return (
    <Container className="min-h-screen bg-gray-50">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="홈으로">
              <IconButton icon={ArrowLeft} size="iconM" />
            </Link>
            <h4 className="font-semibold text-black">약관 및 정책</h4>
          </div>
        }
      />

      <div className="px-4 py-5 space-y-3">
        {items.map(({ href, Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-gray-100 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center">
              <span className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-light/15 text-brand">
                <Icon size={20} weight="duotone" />
              </span>
              <div>
                <p className="text-sm font-semibold text-black">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-gray-400" />
          </Link>
        ))}
      </div>
    </Container>
  );
}
