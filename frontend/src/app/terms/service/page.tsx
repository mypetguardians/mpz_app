import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";

export const metadata: Metadata = {
  title: "이용약관 | 마펫쯔",
  description:
    "마펫쯔(마이펫가디언즈) 이용약관. 회원의 권리와 의무, 서비스 이용 조건, 운영 정책을 안내합니다.",
  alternates: { canonical: "https://mpz.kr/terms/service" },
};

/**
 * 이용약관 페이지 (placeholder)
 *
 * ⚠️ 변호사 검토 전 초안. 정식 운영 시작 전 검토 + 약관 동의 UI 연결 필수.
 * ㈜마이펫가디언즈가 마펫쯔(mpz.kr) + 강아지학교(school.mpz.kr) 단일 법인 운영이라 약관 통합.
 */

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="mb-3 flex items-baseline text-base font-semibold text-black">
        <span className="mr-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-light/15 px-1.5 text-[11px] font-bold text-brand">
          {num}
        </span>
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-gray-700 space-y-2">{children}</div>
    </section>
  );
}

export default function TermsServicePage() {
  return (
    <Container className="min-h-screen bg-gray-50">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="홈으로">
              <IconButton icon={ArrowLeft} size="iconM" />
            </Link>
            <h4 className="font-semibold text-black">이용약관</h4>
          </div>
        }
      />

      <article className="px-4 py-5">
        <div className="mb-4 rounded-xl bg-brand-light/10 p-4 text-xs text-gray-600">
          <p className="font-medium text-brand">최종 개정일 2026-05-04</p>
          <p>시행일은 정식 시행 시 갱신됩니다.</p>
        </div>

        <Section num="1" title="제1조 (목적)">
          <p>
            이 약관은 ㈜마이펫가디언즈(이하 &ldquo;회사&rdquo;)가 제공하는 마펫쯔(mpz.kr) 및 마펫쯔
            강아지학교(school.mpz.kr) 서비스(이하 통칭 &ldquo;서비스&rdquo;)의 이용 조건 및 절차,
            회원과 회사의 권리·의무·책임 사항을 규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section num="2" title="제2조 (정의)">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-black">&ldquo;회원&rdquo;</span>: 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자
            </li>
            <li>
              <span className="font-medium text-black">&ldquo;보호센터&rdquo;</span>: 유기동물을 보호·관리하는 시설로 회사 플랫폼에 등록된 자
            </li>
            <li>
              <span className="font-medium text-black">&ldquo;입양&rdquo;</span>: 회원이 보호센터를 통해 동물을 분양받는 절차
            </li>
          </ul>
        </Section>

        <Section num="3" title="제3조 (약관의 게시 및 개정)">
          <p>
            회사는 본 약관을 서비스 초기 화면 또는 별도 연결 화면에 게시합니다. 약관 개정 시 적용일 7일
            이전부터 공지하며, 회원에게 불리한 변경의 경우 30일 이전부터 공지합니다.
          </p>
        </Section>

        <Section num="4" title="제4조 (서비스 제공)">
          <p>회사는 다음 서비스를 제공합니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>유기동물 입양 정보 검색</li>
            <li>보호센터 관리 시스템</li>
            <li>강아지학교 영상 강의 및 콘텐츠</li>
            <li>반려동물 포트폴리오 및 커뮤니티</li>
            <li>AI 케어 리포트</li>
            <li>스타터팩 커머스</li>
          </ul>
        </Section>

        <Section num="5" title="제5조 (회원가입 및 계정)">
          <p>
            회원가입은 카카오 계정 연동을 통해 진행되며, 본 약관 및 개인정보처리방침에 동의해야 합니다.
            하나의 카카오 계정으로 마펫쯔와 강아지학교 모두에 가입됩니다.
          </p>
        </Section>

        <Section num="6" title="제6조 (탈퇴 및 자격 상실)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              회원은 언제든지 마이페이지를 통해 탈퇴를 신청할 수 있으며, 회사는 즉시 개인정보를
              비식별화 처리합니다.
            </li>
            <li>
              진행 중인 입양 신청 또는 주문이 있는 경우 탈퇴가 제한됩니다. 해당 절차 완료 또는 취소
              후 다시 신청해주세요.
            </li>
            <li>
              거래 기록(주문, 결제, 입양 신청)은{" "}
              <span className="font-semibold text-amber-700">전자상거래법 제6조에 따라 5년간 보관</span>
              된 후 자동 삭제됩니다. 소비자 불만 / 분쟁 처리 기록은 3년간 보관됩니다.
            </li>
          </ol>
        </Section>

        <Section num="7" title="제7조 (회원의 의무)">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>회원은 입양 시 동물 복지를 우선시하고, 책임감 있는 반려 생활을 약속해야 합니다.</li>
            <li>회사 또는 제3자의 권리를 침해하거나 미풍양속에 반하는 행위를 해서는 안 됩니다.</li>
          </ul>
        </Section>

        <Section num="8" title="제8조 (책임의 제한)">
          <p>
            회사는 천재지변, 정전, 통신장애 등 회사가 통제할 수 없는 사유로 인한 서비스 중단에 대해
            책임을 지지 않습니다. 회원 간 또는 회원과 보호센터 간의 분쟁에 대해서도 회사는 직접 개입하지
            않습니다.
          </p>
        </Section>

        <Section num="9" title="제9조 (관할 법원 및 준거법)">
          <p>
            본 약관과 관련된 분쟁은 대한민국 법령에 따르며, 회사 본사 소재지 관할 법원을 전속관할로
            합니다.
          </p>
        </Section>

        <p className="mt-6 px-1 text-center text-xs text-gray-400">
          ㈜마이펫가디언즈 · 사업자 등록번호 246-81-03596 · 경기도 안산시 상록구 중보로 27, 401-1449호 · 통신판매업 신고: (정식 신고 후 갱신)
        </p>
      </article>
    </Container>
  );
}
