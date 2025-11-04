"use client";

import React from "react";
import axios from "axios";

import { Input } from "@/components/ui/CustomInput";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";

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
  const [generatedOtp, setGeneratedOtp] = React.useState<string>("");

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "error"
  );

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

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType("error");
    setShowToast(true);
  };

  const generateOtp = (): string => {
    // 6자리 랜덤 인증번호 생성
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendSmsOtp = async (phoneNumber: string, otpCode: string) => {
    const response = await axios.post(
      "https://blink-production-37f6.up.railway.app/v1/sms/eddb3903-746e-4833-ba19-e8f3aede8680/send",
      {
        recipient_phone: phoneNumber,
        message: `인증번호는 [${otpCode}] 입니다.`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "S1jNIx7UUWKasmzpFGE7F6dET9syiR3R_BLqsyHjMiA",
        },
      }
    );
    return response.data;
  };

  const requestOtp = async () => {
    if (!isPhoneValid) {
      showErrorToast("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    try {
      const otpCode = generateOtp();
      sessionStorage.setItem("verification.phone", phoneDigits);
      sessionStorage.setItem("verification.otp", otpCode);
      setGeneratedOtp(otpCode);
      await sendSmsOtp(phoneDigits, otpCode);
      setExpireAt(Date.now() + 3 * 60 * 1000);
      setOtp("");
      setStage("otp");
    } catch (error: any) {
      console.error("OTP 발급 실패:", error);
      const errorMessage = error.response?.data?.message || "인증번호 발송에 실패했습니다. 다시 시도해주세요.";
      showErrorToast(errorMessage);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 4) {
      showErrorToast("인증번호를 입력해주세요.");
      return;
    }
    if (remainMs <= 0) {
      showErrorToast("인증번호가 만료되었습니다. 재전송해주세요.");
      return;
    }
    try {
      // 프론트엔드에서 생성한 인증번호와 비교
      const storedOtp = sessionStorage.getItem("verification.otp");

      if (otp.trim() === storedOtp) {
        // 인증 성공
        sessionStorage.removeItem("verification.otp"); // 사용한 인증번호 제거
        sessionStorage.removeItem("verification.phone"); // 전화번호도 제거
        onNext();
      } else {
        showErrorToast("인증번호가 올바르지 않습니다. 다시 확인해주세요.");
      }
    } catch (error: any) {
      console.error("OTP 검증 실패:", error);
      showErrorToast("인증번호 검증에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const resendOtp = async () => {
    if (!isPhoneValid) {
      showErrorToast("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    try {
      const otpCode = generateOtp();
      sessionStorage.setItem("verification.otp", otpCode);
      setGeneratedOtp(otpCode);
      await sendSmsOtp(phoneDigits, otpCode);
      setExpireAt(Date.now() + 3 * 60 * 1000);
      setOtp("");
      setToastMessage("인증번호를 재전송했습니다.");
      setToastType("success");
      setShowToast(true);
    } catch (error: any) {
      console.error("OTP 재전송 실패:", error);
      const errorMessage = error.response?.data?.message || "인증번호 재전송에 실패했습니다. 다시 시도해주세요.";
      showErrorToast(errorMessage);
    }
  };

  return (
    <>
      <Container className="min-h-screen pb-28">
        <h2 className="mb-6 text-bk">휴대폰 번호를 인증해주세요.</h2>

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
            <p className="text-sm text-error">올바른 형식으로 입력해주세요.</p>
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

      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default Step1;
