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
import {
  useSendPhoneVerification,
  useVerifyPhoneCode,
} from "@/hooks/mutation/usePhoneVerification";
import { ImageCard } from "@/components/ui/ImageCard";
import { Toast } from "@/components/ui/Toast";
import { pickImages } from "@/lib/image-picker";

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 7);
  const c = digits.slice(7, 11);
  if (digits.length <= 3) return a;
  if (digits.length <= 7) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

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
  const sendVerification = useSendPhoneVerification();
  const verifyCode = useVerifyPhoneCode();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");

  // 전화번호 인증 상태
  const [phoneRaw, setPhoneRaw] = useState("");
  const phoneFormatted = formatPhone(phoneRaw);
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length === 11;
  const [phoneStage, setPhoneStage] = useState<"view" | "input" | "otp">("view");
  const [otp, setOtp] = useState("");
  const [expireAt, setExpireAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (authUser) {
      setNickname(authUser.nickname || "");
      setName(authUser.name || "");
      setPhoneRaw(authUser.phoneNumber?.replace(/-/g, "") || "");
      setProfileImage(authUser.image || null);
      setIsPhoneVerified(!!authUser.phoneNumber);
    }
  }, [authUser]);

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

  // 인증번호 발송
  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    try {
      await sendVerification.mutateAsync({ phone_number: phoneDigits });
      setExpireAt(Date.now() + 5 * 60 * 1000);
      setOtp("");
      setPhoneStage("otp");
      setToastMessage("인증번호가 발송되었습니다.");
      setShowToast(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호 발송에 실패했습니다.";
      setToastMessage(message);
      setShowToast(true);
    }
  };

  // 인증번호 확인
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) return;
    if (remainMs <= 0) {
      setToastMessage("인증번호가 만료되었습니다. 재전송해주세요.");
      setShowToast(true);
      return;
    }
    try {
      await verifyCode.mutateAsync({
        phone_number: phoneDigits,
        verification_code: otp.trim(),
      });
      setIsPhoneVerified(true);
      setPhoneStage("view");
      setExpireAt(null);
      try { await setUserFromToken(); } catch { /* ignore */ }
      setToastMessage("전화번호 인증이 완료되었습니다.");
      setShowToast(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "인증번호가 올바르지 않습니다.";
      setToastMessage(message);
      setShowToast(true);
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
              {phoneStage === "view" && (
                <div>
                  <CustomInput
                    label="휴대폰 번호"
                    value={isPhoneVerified ? phoneFormatted : ""}
                    placeholder="인증된 번호가 없습니다"
                    readOnly
                    disabled
                  />
                  <button
                    type="button"
                    className="mt-2 text-sm text-brand font-medium"
                    onClick={() => {
                      setPhoneRaw("");
                      setPhoneStage("input");
                    }}
                  >
                    {isPhoneVerified ? "번호 변경하기" : "휴대폰 인증하기"}
                  </button>
                </div>
              )}

              {phoneStage === "input" && (
                <div>
                  <CustomInput
                    label="휴대폰 번호"
                    placeholder="000-0000-0000"
                    value={phoneFormatted}
                    onChange={(e) => setPhoneRaw(e.target.value)}
                    inputMode="numeric"
                    maxLength={13}
                  />
                  <div className="flex mt-2 space-x-2">
                    <button
                      type="button"
                      className="text-sm text-gr"
                      onClick={() => {
                        setPhoneRaw(authUser?.phoneNumber?.replace(/-/g, "") || "");
                        setPhoneStage("view");
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="text-sm text-brand font-medium"
                      onClick={handleSendOtp}
                      disabled={!isPhoneValid || sendVerification.isPending}
                    >
                      {sendVerification.isPending ? "발송 중..." : "인증번호 발송"}
                    </button>
                  </div>
                </div>
              )}

              {phoneStage === "otp" && (
                <div>
                  <CustomInput
                    label="휴대폰 번호"
                    value={phoneFormatted}
                    readOnly
                    disabled
                  />
                  <div className="mt-3">
                    <CustomInput
                      label="인증번호"
                      placeholder="인증번호 6자리를 입력해주세요"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>
                  {countdown && (
                    <p className="mt-1 text-sm text-brand">{countdown}</p>
                  )}
                  <div className="flex mt-2 space-x-2">
                    <button
                      type="button"
                      className="text-sm text-gr"
                      onClick={() => {
                        setPhoneRaw(authUser?.phoneNumber?.replace(/-/g, "") || "");
                        setPhoneStage("view");
                        setExpireAt(null);
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="text-sm text-gr"
                      onClick={handleSendOtp}
                      disabled={sendVerification.isPending}
                    >
                      재전송
                    </button>
                    <button
                      type="button"
                      className="text-sm text-brand font-medium"
                      onClick={handleVerifyOtp}
                      disabled={otp.trim().length < 4 || verifyCode.isPending}
                    >
                      {verifyCode.isPending ? "확인 중..." : "인증 확인"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* 저장 버튼 — 전화번호는 인증으로만 변경, 여기선 닉네임/이미지만 저장 */}
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
