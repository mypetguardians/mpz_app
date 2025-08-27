"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";

export interface StepProps {
  onNext: () => void;
}

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 7);
  const c = digits.slice(7, 11);
  if (digits.length <= 3) return a;
  if (digits.length <= 7) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

export function Step1({ onNext }: StepProps) {
  // stage: 휴대폰 입력 → OTP 입력
  const [stage, setStage] = React.useState<"phone" | "otp">("phone");

  // phone input
  const [raw, setRaw] = React.useState("");
  const phone = formatPhone(raw);
  const phoneDigits = raw.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 11;

  // otp input
  const [otp, setOtp] = React.useState("");
  const [expireAt, setExpireAt] = React.useState<number | null>(null);
  const [nowTs, setNowTs] = React.useState<number>(Date.now());

  React.useEffect(() => {
    if (!expireAt) return;
    const id = setInterval(() => setNowTs(Date.now()), 300);
    return () => clearInterval(id);
  }, [expireAt]);

  const remainMs = expireAt ? Math.max(0, expireAt - nowTs) : 0;
  const remainMin = Math.floor(remainMs / 60000);
  const remainSec = Math.floor((remainMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const countdown = expireAt ? `${remainMin}:${remainSec}` : undefined;

  const requestOtp = async () => {
    if (!isPhoneValid) return;
    try {
      sessionStorage.setItem("verification.phone", phoneDigits);
    } catch {}
    // TODO: 실제 OTP 발급 API 연동
    setExpireAt(Date.now() + 3 * 60 * 1000); // 임시 3분 유효
    setOtp("");
    setStage("otp");
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 4) return;
    // TODO: 실제 검증 API 연동
    onNext();
  };

  const resendOtp = async () => {
    if (!isPhoneValid) return;
    // TODO: 재전송 API 연동
    setExpireAt(Date.now() + 3 * 60 * 1000);
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="text-bk mb-6">휴대폰 번호를 인증해주세요.</h2>

        <div className="flex flex-col gap-3">
          <Input
            variant="primary"
            label="휴대폰 번호"
            placeholder="000-0000-0000"
            value={phone}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="numeric"
            maxLength={13}
            error={raw.length > 0 && !isPhoneValid}
            readOnly={stage === "otp"}
          />
          {raw.length > 0 && stage === "phone" && !isPhoneValid && (
            <p className="text-error text-sm">올바른 형식으로 입력해주세요.</p>
          )}

          {stage === "otp" && (
            <Input
              variant="primary"
              label="인증 번호"
              placeholder="인증 번호를 입력해주세요."
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              time={countdown}
              action={
                <button type="button" className="text-gr" onClick={resendOtp}>
                  재전송
                </button>
              }
            />
          )}
        </div>
      </Container>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
        onPrimaryButtonClick={stage === "phone" ? requestOtp : verifyOtp}
        primaryButtonDisabled={
          stage === "phone" ? !isPhoneValid : otp.trim().length < 4
        }
      />
    </>
  );
}

export default Step1;
