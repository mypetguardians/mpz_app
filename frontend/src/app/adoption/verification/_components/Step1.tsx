"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAdoptionVerificationStore } from "@/lib/stores";
import {
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/hooks/mutation/usePhoneVerification";

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
  const [stage, setStage] = React.useState<"phone" | "otp">("phone");

  const [raw, setRaw] = React.useState("");
  const phone = formatPhone(raw);
  const phoneDigits = raw.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 11;

  const [otp, setOtp] = React.useState("");
  const [expireAt, setExpireAt] = React.useState<number | null>(null);
  const [nowTs, setNowTs] = React.useState<number>(Date.now());

  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error">("error");

  const { user, setUserFromToken } = useAuth();
  const {
    data: storeData,
    updateField,
    setStepData,
  } = useAdoptionVerificationStore(user?.id);

  const sendVerification = useSendPhoneVerification();
  const verifyCode = useVerifyPhoneCode();

  React.useEffect(() => {
    if (storeData?.phone) {
      setRaw(storeData.phone);
    }
  }, [storeData?.phone]);

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

  const requestOtp = async () => {
    if (!isPhoneValid) {
      showErrorToast("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    try {
      await sendVerification.mutateAsync({ phone_number: phoneDigits });
      setExpireAt(Date.now() + 5 * 60 * 1000);
      setOtp("");
      setStage("otp");
      setStepData({ phone: phone });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호 발송에 실패했습니다. 다시 시도해주세요.";
      showErrorToast(message);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) {
      showErrorToast("인증번호를 입력해주세요.");
      return;
    }
    if (remainMs <= 0) {
      showErrorToast("인증번호가 만료되었습니다. 재전송해주세요.");
      return;
    }
    try {
      await verifyCode.mutateAsync({
        phone_number: phoneDigits,
        verification_code: otp.trim(),
      });

      updateField("phone", phone);
      updateField("isPhoneVerified", true);

      // 서버에서 최신 사용자 정보 갱신
      try {
        await setUserFromToken();
      } catch {
        // 갱신 실패해도 인증은 완료
      }

      onNext();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호가 올바르지 않습니다. 다시 확인해주세요.";
      showErrorToast(message);
    }
  };

  const resendOtp = async () => {
    if (!isPhoneValid) {
      showErrorToast("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    try {
      await sendVerification.mutateAsync({ phone_number: phoneDigits });
      setExpireAt(Date.now() + 5 * 60 * 1000);
      setOtp("");
      setToastMessage("인증번호를 재전송했습니다.");
      setToastType("success");
      setShowToast(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호 재전송에 실패했습니다. 다시 시도해주세요.";
      showErrorToast(message);
    }
  };

  return (
    <>
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
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
                <button
                  type="button"
                  className="text-gr"
                  onClick={resendOtp}
                  disabled={sendVerification.isPending}
                >
                  재전송
                </button>
              }
            />
          )}
        </div>
      </div>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
        onPrimaryButtonClick={stage === "phone" ? requestOtp : handleVerifyOtp}
        primaryButtonDisabled={
          stage === "phone"
            ? !isPhoneValid || sendVerification.isPending
            : otp.trim().length < 4 || verifyCode.isPending
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
