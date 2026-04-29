"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUpdateProfile } from "@/hooks/mutation/useUpdateProfile";
import { useUploadSingleImage } from "@/hooks/mutation/useUploadSingleImage";
import { usePhoneVerificationFlow } from "@/hooks/usePhoneVerificationFlow";
import { ImageCard } from "@/components/ui/ImageCard";
import { Toast } from "@/components/ui/Toast";
import { pickImages } from "@/lib/image-picker";

export default function ProfileEditPage() {
  const router = useRouter();
  const {
    user: authUser,
    isAuthenticated,
    isLoading: authLoading,
    updateUser,
    setUserFromToken,
  } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const uploadProfileImageMutation = useUploadSingleImage();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const sms = usePhoneVerificationFlow({
    onVerified: async () => {
      setIsPhoneVerified(true);
      try { await setUserFromToken(); } catch { /* ignore */ }
    },
  });

  // 토스트 자동 dismiss (3초)
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // SMS 훅의 메시지를 토스트로 전달
  useEffect(() => {
    if (sms.error) {
      setToastMessage(sms.error);
      setShowToast(true);
      sms.clearMessages();
    } else if (sms.successMessage) {
      setToastMessage(sms.successMessage);
      setShowToast(true);
      sms.clearMessages();
    }
  }, [sms.error, sms.successMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (authUser) {
      setNickname(authUser.nickname || "");
      setName(authUser.name || "");
      setProfileImage(authUser.image || null);
      setIsPhoneVerified(!!authUser.phoneNumber);
      if (authUser.phoneNumber) {
        sms.setRaw(authUser.phoneNumber.replace(/-/g, ""));
      }
    }
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = async (files: File[]) => {
    const file = files[0];
    if (file) {
      const localPreview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProfileImage(localPreview);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadProfileImageMutation.mutateAsync({
          file: base64,
          filename: `profile_${Date.now()}.jpg`,
          content_type: file.type,
          folder: "profiles",
        });

        setProfileImage(result.file_url);
        setToastMessage("이미지가 성공적으로 업로드되었습니다");
        setShowToast(true);
      } catch {
        setProfileImage(authUser?.image || null);
        setToastMessage("사진 업로드에 실패했어요. 다시 시도해주세요.");
        setShowToast(true);
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        nickname: nickname.trim() || "",
        image: profileImage || "",
      });

      updateUser({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        image: profileImage || undefined,
      });

      try { await setUserFromToken(); } catch { /* ignore */ }

      setToastMessage("프로필이 성공적으로 수정되었습니다");
      setShowToast(true);
      setTimeout(() => router.push("/my"), 2000);
    } catch {
      setToastMessage("프로필 수정에 실패했어요. 다시 시도해주세요.");
      setShowToast(true);
    }
  };

  const isFormValid = name.trim().length > 0;
  const hasChanges =
    nickname !== (authUser?.nickname || "") ||
    profileImage !== (authUser?.image || "");

  if (authLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center space-x-2">
              <IconButton icon={ArrowLeft} size="iconM" onClick={() => router.back()} />
              <h4>프로필 수정</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">프로필 정보를 불러오는 중...</div>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center space-x-2">
              <IconButton icon={ArrowLeft} size="iconM" onClick={() => router.back()} />
              <h4>프로필 수정</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">로그인이 필요합니다</div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center space-x-2">
              <IconButton icon={ArrowLeft} size="iconM" onClick={() => router.back()} />
              <h4>프로필 수정</h4>
            </div>
          }
        />

        <div className="pb-32 mx-4">
          <div className="space-y-6">
            {/* 이미지 섹션 */}
            <div className="space-y-3">
              <h5 className="font-medium text-black">이미지</h5>
              <p className="text-gr text-xs">
                *PNG, JPG, JPEG 형식의 파일만 업로드 가능합니다.
              </p>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ImageCard
                    src={profileImage || undefined}
                    alt="프로필 이미지"
                    variant={profileImage ? "primary" : "add"}
                    onClick={async () => {
                      try {
                        const files = await pickImages({ multiple: false, maxCount: 1 });
                        if (files.length > 0) handleImageUpload(files);
                      } catch { /* ignore */ }
                    }}
                    className="w-20 h-20"
                  />
                </div>
              </div>
            </div>

            {/* 닉네임 섹션 */}
            <div className="space-y-3">
              <CustomInput
                label="닉네임"
                placeholder="닉네임을 설정해보세요."
                value={nickname}
                maxLength={100}
                onChange={(e) => setNickname(e.target.value.slice(0, 100))}
              />
            </div>

            {/* 이름 섹션 */}
            <div className="space-y-3">
              <CustomInput
                label="이름"
                value={name}
                readOnly
                disabled
              />
            </div>

            {/* 휴대폰 번호 섹션 — SMS 인증 필수 */}
            <div className="space-y-3">
              {sms.stage === "idle" && (
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <CustomInput
                      label="휴대폰 번호"
                      value={isPhoneVerified ? sms.phoneFormatted : ""}
                      placeholder="인증된 번호가 없습니다"
                      readOnly
                      disabled
                    />
                  </div>
                  <button
                    type="button"
                    className="ml-3 mb-1 text-sm text-brand font-medium whitespace-nowrap"
                    onClick={sms.startInput}
                  >
                    {isPhoneVerified ? "번호 변경" : "인증하기"}
                  </button>
                </div>
              )}

              {sms.stage === "input" && (
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <CustomInput
                      label="휴대폰 번호"
                      placeholder="000-0000-0000"
                      value={sms.phoneFormatted}
                      onChange={(e) => sms.setRaw(e.target.value)}
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </div>
                  <div className="flex ml-3 mb-1 space-x-2">
                    <button
                      type="button"
                      className="text-sm text-gr whitespace-nowrap"
                      onClick={() => sms.cancel(authUser?.phoneNumber)}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="text-sm text-brand font-medium whitespace-nowrap"
                      onClick={sms.sendOtp}
                      disabled={sms.isSending}
                    >
                      {sms.isSending ? "발송 중..." : "인증번호 발송"}
                    </button>
                  </div>
                </div>
              )}

              {sms.stage === "otp" && (
                <div>
                  <CustomInput
                    label="휴대폰 번호"
                    value={sms.phoneFormatted}
                    readOnly
                    disabled
                  />
                  <div className="mt-3 flex items-end justify-between">
                    <div className="flex-1">
                      <CustomInput
                        label="인증번호"
                        placeholder="인증번호 6자리를 입력해주세요"
                        value={sms.otp}
                        onChange={(e) => sms.setOtp(e.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex ml-3 mb-1 space-x-2">
                      <button
                        type="button"
                        className="text-sm text-gr whitespace-nowrap"
                        onClick={() => sms.cancel(authUser?.phoneNumber)}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="text-sm text-gr whitespace-nowrap"
                        onClick={sms.resendOtp}
                        disabled={sms.isSending}
                      >
                        재전송
                      </button>
                      <button
                        type="button"
                        className="text-sm text-brand font-medium whitespace-nowrap"
                        onClick={sms.verifyOtp}
                        disabled={sms.otp.trim().length < 4 || sms.isVerifying}
                      >
                        {sms.isVerifying ? "확인 중..." : "인증 확인"}
                      </button>
                    </div>
                  </div>
                  {sms.countdown && (
                    <p className="mt-1 text-sm text-brand text-right">{sms.countdown}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* 저장 버튼 */}
      <div className="fixed left-0 right-0 z-50 px-4 bottom-10">
        <div className="max-w-[380px] mx-auto">
          <BigButton
            className="w-full"
            onClick={handleSave}
            disabled={!isFormValid || !hasChanges || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "저장 중..." : "저장하기"}
          </BigButton>
        </div>
      </div>

      {showToast && (
        <Toast
          onClick={() => setShowToast(false)}
          className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-[9999]"
        >
          {toastMessage}
        </Toast>
      )}
    </>
  );
}
