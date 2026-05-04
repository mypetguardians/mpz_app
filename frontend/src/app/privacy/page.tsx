import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마펫쯔",
  description:
    "마펫쯔(마이펫가디언즈)가 수집·이용·보관하는 개인정보 항목, 처리 목적, 보유 기간, 제3자 제공 여부를 안내합니다.",
  alternates: { canonical: "https://mpz.kr/privacy" },
};

/**
 * 개인정보처리방침 페이지 (placeholder)
 *
 * ⚠️ 변호사 검토 전 초안. 정식 운영 시작 전 검토 필수.
 * 마펫쯔 단일 법인 운영(마펫쯔 + 강아지학교) 전제 — 두 서비스 간 별도 제3자 제공 동의 불필요.
 * 단 Anthropic API(미국, AI 리포트), Vercel(미국, 호스팅), Supabase(싱가포르, DB/Storage)는
 * 국외 이전 항목으로 별도 고지.
 */
export default function PrivacyPage() {
  return (
    <Container className="min-h-screen bg-white">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <a href="/" aria-label="홈으로">
              <IconButton icon={ArrowLeft} size="iconM" />
            </a>
            <h4 className="font-semibold text-black">개인정보처리방침</h4>
          </div>
        }
      />

      <article className="prose prose-sm max-w-none px-4 py-6 text-gray-800">
        <p className="text-xs text-gray-500">
          최종 개정일: 2026-05-04 · 시행일: (정식 시행 시 갱신)
        </p>

        <h2>1. 수집하는 개인정보 항목</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">구분</th>
              <th className="text-left">필수/선택</th>
              <th className="text-left">항목</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>회원가입 (카카오)</td>
              <td>필수</td>
              <td>카카오 ID, 이메일, 닉네임</td>
            </tr>
            <tr>
              <td>회원가입 (카카오)</td>
              <td>선택</td>
              <td>프로필 사진</td>
            </tr>
            <tr>
              <td>입양/주문</td>
              <td>필수</td>
              <td>이름, 전화번호, 배송지 주소</td>
            </tr>
            <tr>
              <td>SMS 인증</td>
              <td>필수</td>
              <td>전화번호, 인증번호 발송 기록</td>
            </tr>
            <tr>
              <td>자동 수집</td>
              <td>—</td>
              <td>접속 IP, 브라우저 정보, 쿠키, FCM 푸시 토큰(알림 동의 시)</td>
            </tr>
          </tbody>
        </table>

        <h2>2. 개인정보 처리 목적</h2>
        <ul>
          <li>회원 식별 및 인증</li>
          <li>입양/주문/결제 처리 및 배송</li>
          <li>강아지학교 강의 구독 관리, AI 케어 리포트 생성</li>
          <li>고객 지원 및 분쟁 처리</li>
          <li>서비스 개선을 위한 익명 통계 분석</li>
        </ul>

        <h2>3. 개인정보 보유 및 이용 기간</h2>
        <ul>
          <li>
            <strong>회원 탈퇴 시 즉시 비식별화</strong> (이름/이메일/전화번호/사진/주소/생년월일/카카오ID)
          </li>
          <li>
            <strong>거래 기록 5년 보관</strong> (전자상거래법 제6조): 주문, 결제, 입양 신청. 보관 기간
            만료 후 자동 삭제
          </li>
          <li>
            <strong>소비자 불만/분쟁 처리 기록 3년 보관</strong> (전자상거래법)
          </li>
          <li>법령에 의한 보관 의무가 없는 정보는 즉시 파기</li>
        </ul>

        <h2>4. 개인정보 제3자 제공</h2>
        <p>
          회사는 회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음 경우는 예외입니다:
        </p>
        <ul>
          <li>법령에 따른 수사기관 요청</li>
          <li>본인의 명시적 동의가 있는 경우</li>
          <li>
            보호센터에 입양 신청 정보 전달(이름, 전화번호, 주소, 가족 구성, 양육 환경): 입양 절차
            진행에 필수적이며 회원 신청 시 동의로 간주
          </li>
        </ul>

        <h2>5. 개인정보 처리 위탁 (국외 이전 포함)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">수탁자</th>
              <th className="text-left">위탁 업무</th>
              <th className="text-left">이전 국가</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase Inc.</td>
              <td>DB · Storage 호스팅</td>
              <td>싱가포르</td>
            </tr>
            <tr>
              <td>Vercel Inc.</td>
              <td>강아지학교 프론트엔드 호스팅</td>
              <td>미국</td>
            </tr>
            <tr>
              <td>Anthropic, PBC.</td>
              <td>AI 케어 리포트 생성 (Claude API)</td>
              <td>미국</td>
            </tr>
            <tr>
              <td>Amazon Web Services</td>
              <td>마펫쯔 서버(EC2) 호스팅</td>
              <td>대한민국 (서울 리전)</td>
            </tr>
            <tr>
              <td>알리고</td>
              <td>SMS 인증번호 발송</td>
              <td>대한민국</td>
            </tr>
            <tr>
              <td>(주)카카오</td>
              <td>소셜 로그인</td>
              <td>대한민국</td>
            </tr>
            <tr>
              <td>PayApp</td>
              <td>결제 처리 (강아지학교 스타터팩, AI 풀 리포트)</td>
              <td>대한민국</td>
            </tr>
          </tbody>
        </table>

        <h2>6. 회원의 권리</h2>
        <ul>
          <li>개인정보 열람·정정·삭제·처리 정지 요구권</li>
          <li>회원 탈퇴(즉시 비식별화) 요청 가능 — 마이페이지 → 계정 설정 → 계정 탈퇴</li>
          <li>고객 지원: <a href="mailto:mypetguardians@naver.com">mypetguardians@naver.com</a></li>
        </ul>

        <h2>7. 쿠키 및 추적 기술</h2>
        <p>
          서비스는 인증 유지(access/refresh 토큰), 사용자 환경 설정 보존을 위해 쿠키를 사용합니다.
          쿠키는 브라우저 설정에서 거부할 수 있으나, 거부 시 일부 기능 사용에 제한이 있을 수 있습니다.
        </p>

        <h2>8. 개인정보 보호 책임자</h2>
        <ul>
          <li>이름: 유가희 (대표)</li>
          <li>이메일: <a href="mailto:mypetguardians@naver.com">mypetguardians@naver.com</a></li>
        </ul>

        <h2>9. 변경 사항 고지</h2>
        <p>
          본 처리방침의 내용 추가, 삭제 및 수정이 있을 경우 적용일 7일 전부터 공지합니다.
          중요한 변경의 경우 30일 전 공지 및 회원의 명시적 동의를 받습니다.
        </p>

        <hr className="my-6" />
        <p className="text-xs text-gray-500">
          ㈜마이펫가디언즈 · 사업자 등록번호 246-81-03596
        </p>
      </article>
    </Container>
  );
}
