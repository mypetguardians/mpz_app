"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Camera } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUpdateProfile } from "@/hooks/mutation/useUpdateProfile";
import { NotificationToast } from "@/components/ui/NotificationToast";

export default function ProfileEditPage() {
  const router = useRouter();
  const {
    user: authUser,
    isAuthenticated,
    isLoading: authLoading,
    updateUser,
  } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // AuthProvider의 사용자 정보로 상태 초기화
  useEffect(() => {
    if (authUser) {
      setNickname(authUser.nickname || "");
      setName(authUser.name || "");
      setPhoneNumber(authUser.phoneNumber || "");
      setProfileImage(authUser.image || null);
    }
  }, [authUser]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        nickname: nickname.trim() || "",
        phoneNumber: phoneNumber.trim() || "",
        image: profileImage || "",
      });

      // AuthProvider의 사용자 정보도 업데이트
      updateUser({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        image: profileImage || undefined,
      });

      setToastMessage("프로필이 성공적으로 수정되었습니다");
      setToastType("success");
      setShowToast(true);

      // 2초 후 이전 페이지로 이동
      setTimeout(() => {
        router.push("/my");
      }, 2000);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다"
      );
      setToastType("error");
      setShowToast(true);
    }
  };

  const isFormValid = name.trim().length > 0;
  const hasChanges =
    name !== (authUser?.name || "") ||
    nickname !== (authUser?.nickname || "") ||
    phoneNumber !== (authUser?.phoneNumber || "") ||
    profileImage !== (authUser?.image || "");

  if (authLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={() => router.back()}
              />
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
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={() => router.back()}
              />
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
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={() => router.back()}
              />
              <h4>프로필 수정</h4>
            </div>
          }
        />

        <div className="mx-4 pb-32">
          <div className="space-y-6">
            {/* 이미지 섹션 */}
            <div className="space-y-3">
              <h5 className="text-black font-medium">이미지</h5>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 border">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="프로필 이미지"
                        className="w-full h-full object-cover"
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Camera size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-brand text-white rounded-full p-1 cursor-pointer">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 닉네임 섹션 */}
            <div className="space-y-3">
              <CustomInput
                label="닉네임"
                placeholder="닉네임을 설정해보세요."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* 이름 섹션 */}
            <div className="space-y-3">
              <CustomInput
                label="이름"
                placeholder="이름을 입력해주세요."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* 휴대폰 번호 섹션 */}
            <div className="space-y-3">
              <CustomInput
                label="휴대폰 번호"
                placeholder="휴대폰 번호를 입력해주세요 (예: 01012345678)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* 저장 버튼 */}
      <div className="fixed bottom-10 left-0 right-0 z-50 px-4">
        <div className="max-w-[380px] mx-auto">
          <BigButton
            className="w-full"
            onClick={handleSave}
            disabled={
              !isFormValid || !hasChanges || updateProfileMutation.isPending
            }
          >
            {updateProfileMutation.isPending ? "저장 중..." : "저장하기"}
          </BigButton>
        </div>
      </div>

      {/* 토스트 메시지 */}
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
