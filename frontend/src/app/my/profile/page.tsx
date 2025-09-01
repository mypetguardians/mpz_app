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
import { useUploadProfileImage } from "@/hooks/mutation/useUploadProfileImage";
import { ImageCard } from "@/components/ui/ImageCard";
import { Toast } from "@/components/ui/Toast";

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
  const uploadProfileImageMutation = useUploadProfileImage();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const handleImageUpload = async (files: File[]) => {
    const file = files[0];
    if (file) {
      const localPreview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProfileImage(localPreview);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 서버에 이미지 업로드
        const result = await uploadProfileImageMutation.mutateAsync({
          file: base64,
          filename: `profile_${Date.now()}.jpg`,
          content_type: file.type,
          folder: "profiles",
        });

        // 업로드 성공 시 서버 URL로 교체
        setProfileImage(result.file_url);
        setToastMessage("이미지가 성공적으로 업로드되었습니다");
        setShowToast(true);
      } catch (error) {
        // 업로드 실패 시 미리보기 제거
        setProfileImage(authUser?.image || null);
        setToastMessage(
          error instanceof Error
            ? error.message
            : "이미지 업로드에 실패했습니다"
        );
        setShowToast(true);
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        nickname: nickname.trim() || "",
        phone_number: phoneNumber.trim() || "",
        image: profileImage || "",
      });

      // AuthProvider의 사용자 정보도 업데이트
      updateUser({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        image: profileImage || undefined,
      });

      // 서버에서 최신 사용자 정보를 다시 가져오기
      try {
        await setUserFromToken();
      } catch (error) {
        console.error("사용자 정보 새로고침 실패:", error);
      }

      setToastMessage("프로필이 성공적으로 수정되었습니다");
      setShowToast(true);

      // 2초 후 이전 페이지로 이동
      setTimeout(() => {
        router.push("/my");
      }, 2000);
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다"
      );
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
                  <label>
                    <ImageCard
                      src={profileImage || undefined}
                      alt="프로필 이미지"
                      variant={profileImage ? "primary" : "add"}
                      onClick={() => {}}
                      className="w-20 h-20"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          handleImageUpload(Array.from(files));
                        }
                      }}
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
