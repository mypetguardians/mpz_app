"use client";

import React from "react";

import { Input } from "@/components/ui/CustomInput";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { usePhoneVerificationFlow } from "@/hooks/usePhoneVerificationFlow";

export interface StepProps {
  onNext: () => void;
}

export function Step1({ onNext }: StepProps) {
  const { user, setUserFromToken } = useAuth();
  const {
    data: storeData,
    updateField,
    setStepData,
  } = useAdoptionVerificationStore(user?.id);

  const sms = usePhoneVerificationFlow({
    onVerified: async () => {
      updateField("phone", sms.phoneFormatted);
      updateField("isPhoneVerified", true);
      try { await setUserFromToken(); } catch { /* ignore */ }
      onNext();
    },
  });

  React.useEffect(() => {
    if (storeData?.phone) {
      sms.setRaw(storeData.phone);
    }
  }, [storeData?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    const ok = await sms.sendOtp();
    if (ok) setStepData({ phone: sms.phoneFormatted });
  };

  // 토스트 메시지 (에러 또는 성공)
  const toastMessage = sms.error || sms.successMessage;
  const toastType = sms.error ? "error" : "success";

  return (
    <>
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <h2 className="mb-6 text-bk">휴대폰 번호를 인증해주세요.</h2>

        <div className="flex flex-col gap-3">
          <Input
            variant="primary"
            label="휴대폰 번호"
            placeholder="000-0000-0000"
            value={sms.phoneFormatted}
            onChange={(e) => sms.setRaw(e.target.value)}
            inputMode="numeric"
            maxLength={13}
            error={sms.raw.length > 0 && !sms.isPhoneValid}
            readOnly={sms.stage === "otp"}
          />
          {sms.raw.length > 0 && sms.stage !== "otp" && !sms.isPhoneValid && (
            <p className="text-sm text-error">올바른 형식으로 입력해주세요.</p>
          )}

          {sms.stage === "otp" && (
            <Input
              variant="primary"
              label="인증 번호"
              placeholder={sms.isExpired ? "인증번호가 만료되었습니다" : "인증 번호를 입력해주세요."}
              value={sms.isExpired ? "" : sms.otp}
              onChange={(e) => sms.setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              readOnly={sms.isExpired}
              time={sms.isExpired ? "만료됨" : sms.countdown}
              action={
                <button
                  type="button"
                  className={sms.isExpired ? "text-brand font-medium" : "text-gr"}
                  onClick={sms.resendOtp}
                  disabled={sms.isSending}
                >
                  {sms.isSending ? "발송 중..." : "재전송"}
                </button>
              }
            />
          )}
        </div>
      </div>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText="확인"
        onPrimaryButtonClick={sms.stage !== "otp" ? handleSend : sms.verifyOtp}
        primaryButtonDisabled={
          sms.stage !== "otp"
            ? !sms.isPhoneValid || sms.isSending
            : sms.otp.trim().length < 4 || sms.isVerifying || sms.isExpired
        }
      />

      {toastMessage && (
        <NotificationToast
          message={toastMessage}
          type={toastType as "success" | "error"}
          onClose={sms.clearMessages}
        />
      )}
    </>
  );
}

export default Step1;
