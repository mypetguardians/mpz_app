"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/hooks/mutation/usePhoneVerification";

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 7);
  const c = digits.slice(7, 11);
  if (digits.length <= 3) return a;
  if (digits.length <= 7) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

interface UsePhoneVerificationFlowOptions {
  onVerified?: () => void;
  verifiedPhone?: string;
}

export function usePhoneVerificationFlow(options?: UsePhoneVerificationFlowOptions) {
  const [stage, setStage] = useState<"idle" | "input" | "otp">("idle");
  const [raw, setRaw] = useState("");
  const [otp, setOtp] = useState("");
  const [expireAt, setExpireAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sendVerification = useSendPhoneVerification();
  const verifyCode = useVerifyPhoneCode();

  const phoneFormatted = formatPhone(raw);
  const phoneDigits = raw.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 11;

  // 타이머
  useEffect(() => {
    if (!expireAt) return;
    const id = setInterval(() => setNowTs(Date.now()), 300);
    return () => clearInterval(id);
  }, [expireAt]);

  const remainMs = expireAt ? Math.max(0, expireAt - nowTs) : 0;
  const remainMin = Math.floor(remainMs / 60000);
  const remainSec = Math.floor((remainMs % 60000) / 1000).toString().padStart(2, "0");
  const countdown = expireAt ? `${remainMin}:${remainSec}` : undefined;
  const isExpired = !!expireAt && remainMs <= 0;

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const startInput = useCallback(() => {
    setRaw("");
    setOtp("");
    setExpireAt(null);
    clearMessages();
    setStage("input");
  }, [clearMessages]);

  const cancel = useCallback((restorePhone?: string) => {
    setRaw(restorePhone?.replace(/-/g, "") || "");
    setOtp("");
    setExpireAt(null);
    clearMessages();
    setStage("idle");
  }, [clearMessages]);

  const sendOtp = useCallback(async () => {
    clearMessages();
    if (!isPhoneValid) {
      setError("올바른 휴대폰 번호를 입력해주세요.");
      return false;
    }
    if (options?.verifiedPhone && phoneDigits === options.verifiedPhone.replace(/-/g, "")) {
      setError("현재 인증된 번호와 동일합니다.");
      return false;
    }
    try {
      await sendVerification.mutateAsync({ phone_number: phoneDigits });
      setExpireAt(Date.now() + 5 * 60 * 1000);
      setOtp("");
      setStage("otp");
      setSuccessMessage("인증번호가 발송되었습니다.");
      return true;
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호 발송에 실패했습니다.";
      setError(message);
      return false;
    }
  }, [isPhoneValid, phoneDigits, sendVerification, clearMessages]);

  const resendOtp = useCallback(async () => {
    clearMessages();
    if (!isPhoneValid) {
      setError("올바른 휴대폰 번호를 입력해주세요.");
      return false;
    }
    try {
      await sendVerification.mutateAsync({ phone_number: phoneDigits });
      setExpireAt(Date.now() + 5 * 60 * 1000);
      setOtp("");
      setSuccessMessage("인증번호를 재전송했습니다.");
      return true;
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호 재전송에 실패했습니다.";
      setError(message);
      return false;
    }
  }, [isPhoneValid, phoneDigits, sendVerification, clearMessages]);

  const verifyOtp = useCallback(async () => {
    clearMessages();
    if (otp.trim().length < 4) {
      setError("인증번호를 입력해주세요.");
      return false;
    }
    if (isExpired) {
      setError("인증번호가 만료되었습니다. 재전송해주세요.");
      return false;
    }
    try {
      await verifyCode.mutateAsync({
        phone_number: phoneDigits,
        verification_code: otp.trim(),
      });
      setExpireAt(null);
      setStage("idle");
      setSuccessMessage("전화번호 인증이 완료되었습니다.");
      options?.onVerified?.();
      return true;
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호가 올바르지 않습니다.";
      setError(message);
      return false;
    }
  }, [otp, isExpired, phoneDigits, verifyCode, clearMessages, options]);

  return {
    // 상태
    stage,
    raw,
    setRaw,
    otp,
    setOtp,
    phoneFormatted,
    phoneDigits,
    isPhoneValid,
    countdown,
    isExpired,
    error,
    successMessage,
    clearMessages,

    // 로딩
    isSending: sendVerification.isPending,
    isVerifying: verifyCode.isPending,

    // 액션
    startInput,
    cancel,
    sendOtp,
    resendOtp,
    verifyOtp,
  };
}
