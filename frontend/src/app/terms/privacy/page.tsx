import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마펫쯔",
  description:
    "마펫쯔(마이펫가디언즈)가 수집·이용·보관하는 개인정보 항목, 처리 목적, 보유 기간, 제3자 제공 여부를 안내합니다.",
  alternates: { canonical: "https://mpz.kr/terms/privacy" },
};

/**
 * 개인정보처리방침 페이지 (placeholder)
 *
 * ⚠️ 변호사 검토 전 초안. 정식 운영 시작 전 검토 필수.
 * 마펫쯔 단일 법인 운영(마펫쯔 + 강아지학교) 전제 — 두 서비스 간 별도 제3자 제공 동의 불필요.
 * Anthropic/Vercel/Supabase 국외 이전 항목 별도 고지.
 */

const collectedInfo = [
  { category: "회원가입 (카카오)", required: "필수", items: "카카오 ID, 이메일, 닉네임" },
  { category: "회원가입 (카카오)", required: "선택", items: "프로필 사진" },
  { category: "입양 / 주문", required: "필수", items: "이름, 전화번호, 배송지 주소" },
  { category: "SMS 인증", required: "필수", items: "전화번호, 인증번호 발송 기록" },
  { category: "자동 수집", required: "—", items: "접속 IP, 브라우저 정보, 쿠키, FCM 푸시 토큰(알림 동의 시)" },
];

const consignedParties = [
  { party: "Supabase Inc.", task: "DB · Storage 호스팅", country: "싱가포르" },
  { party: "Vercel Inc.", task: "강아지학교 프론트엔드 호스팅", country: "미국" },
  { party: "Anthropic, PBC.", task: "AI 케어 리포트 생성 (Claude API)", country: "미국" },
  { party: "Amazon Web Services", task: "마펫쯔 서버(EC2) 호스팅", country: "대한민국 (서울)" },
  { party: "알리고", task: "SMS 인증번호 발송", country: "대한민국" },
  { party: "(주)카카오", task: "소셜 로그인", country: "대한민국" },
  { party: "PayApp", task: "결제 처리 (강아지학교 스타터팩, AI 리포트)", country: "대한민국" },
];

function Section({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="mb-3 flex items-center text-base font-semibold text-black">
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-light/15 text-xs font-bold text-brand">
          {num}
        </span>
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-gray-700 space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <Container className="min-h-screen bg-gray-50">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="홈으로">
              <IconButton icon={ArrowLeft} size="iconM" />
            </Link>
            <h4 className="font-semibold text-black">개인정보처리방침</h4>
          </div>
        }
      />

      <article className="px-4 py-5">
        <div className="mb-4 rounded-xl bg-brand-light/10 p-4 text-xs text-gray-600">
          <p className="font-medium text-brand">최종 개정일 2026-05-04</p>
          <p>시행일은 정식 시행 시 갱신됩니다.</p>
        </div>

        <Section num={1} title="수집하는 개인정보 항목">
          <div className="space-y-2">
            {collectedInfo.map((row, idx) => {
              const tagClass =
                row.required === "필수"
                  ? "bg-red-50 text-red-600 ring-red-100"
                  : row.required === "선택"
                    ? "bg-blue-50 text-blue-600 ring-blue-100"
                    : "bg-gray-50 text-gray-500 ring-gray-200";
              return (
                <div key={idx} className="rounded-lg bg-gray-50 p-3 text-xs">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-semibold text-black">{row.category}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ring-1 ${tagClass}`}
                    >
                      {row.required}
                    </span>
                  </div>
                  <p className="text-gray-600">{row.items}</p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section num={2} title="개인정보 처리 목적">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>회원 식별 및 인증</li>
            <li>입양 / 주문 / 결제 처리 및 배송</li>
            <li>강아지학교 강의 구독 관리, AI 케어 리포트 생성</li>
            <li>고객 지원 및 분쟁 처리</li>
            <li>서비스 개선을 위한 익명 통계 분석</li>
          </ul>
        </Section>

        <Section num={3} title="개인정보 보유 및 이용 기간">
          <div className="space-y-2">
            {[
              {
                tag: "즉시 비식별화",
                tagClass: "bg-brand-light/15 text-brand ring-brand-light/30",
                desc: "회원 탈퇴 시 — 이름, 이메일, 전화번호, 사진, 주소, 카카오ID",
              },
              {
                tag: "5년 보관",
                tagClass: "bg-amber-50 text-amber-700 ring-amber-100",
                desc: "거래 기록 (전자상거래법 제6조) — 주문, 결제, 입양 신청. 보관 기간 만료 후 자동 삭제",
              },
              {
                tag: "3년 보관",
                tagClass: "bg-amber-50 text-amber-700 ring-amber-100",
                desc: "소비자 불만 / 분쟁 처리 기록 (전자상거래법)",
              },
            ].map((row, idx) => (
              <div key={idx} className="rounded-lg bg-gray-50 p-3 text-xs">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${row.tagClass}`}
                >
                  {row.tag}
                </span>
                <p className="mt-1.5 text-gray-700">{row.desc}</p>
              </div>
            ))}
            <p className="px-1 text-xs text-gray-500">
              법령에 의한 보관 의무가 없는 정보는 즉시 파기됩니다.
            </p>
          </div>
        </Section>

        <Section num={4} title="개인정보 제3자 제공">
          <p>회사는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음 경우는 예외입니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>법령에 따른 수사기관 요청</li>
            <li>본인의 명시적 동의가 있는 경우</li>
            <li>
              보호센터에 입양 신청 정보 전달(이름, 전화번호, 주소, 가족 구성, 양육 환경) — 입양 절차
              진행에 필수, 회원 신청 시 동의로 간주
            </li>
          </ul>
        </Section>

        <Section num={5} title="개인정보 처리 위탁 (국외 이전 포함)">
          <div className="space-y-2">
            {consignedParties.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-lg bg-gray-50 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-black">{p.party}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-gray-600 ring-1 ring-gray-200">
                    {p.country}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">{p.task}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section num={6} title="회원의 권리">
          <ul className="list-disc space-y-1 pl-5">
            <li>개인정보 열람 · 정정 · 삭제 · 처리 정지 요구권</li>
            <li>회원 탈퇴(즉시 비식별화) — 마이페이지 → 계정 설정 → 계정 탈퇴</li>
            <li>
              고객 지원:{" "}
              <a
                className="text-brand underline"
                href="mailto:mypetguardians@naver.com"
              >
                mypetguardians@naver.com
              </a>
            </li>
          </ul>
        </Section>

        <Section num={7} title="쿠키 및 추적 기술">
          <p>
            서비스는 인증 유지(access / refresh 토큰)와 사용자 환경 설정 보존을 위해 쿠키를 사용합니다.
            쿠키는 브라우저 설정에서 거부할 수 있으나, 거부 시 일부 기능에 제한이 있을 수 있습니다.
          </p>
        </Section>

        <Section num={8} title="개인정보 보호 책임자">
          <ul className="space-y-1">
            <li>
              <span className="text-gray-500">이름</span>{" "}
              <span className="font-medium text-black">유가희 (대표)</span>
            </li>
            <li>
              <span className="text-gray-500">이메일</span>{" "}
              <a
                className="text-brand underline"
                href="mailto:mypetguardians@naver.com"
              >
                mypetguardians@naver.com
              </a>
            </li>
          </ul>
        </Section>

        <Section num={9} title="변경 사항 고지">
          <p>
            본 처리방침의 내용 추가 · 삭제 · 수정 시 적용일 7일 전부터 공지합니다. 중요한 변경의
            경우 30일 전 공지 및 회원의 명시적 동의를 받습니다.
          </p>
        </Section>

        <p className="mt-6 px-1 text-center text-xs text-gray-400">
          ㈜마이펫가디언즈 · 사업자 등록번호 246-81-03596
        </p>
      </article>
    </Container>
  );
}
