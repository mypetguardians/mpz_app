"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useDeleteKakaoAccount } from "@/hooks/mutation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MyAccountPage() {
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const deleteKakaoAccount = useDeleteKakaoAccount();

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleWithdrawal = () => {
    deleteKakaoAccount.mutate();
    router.push("/");
  };

  if (isLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={() => window.history.back()}
              />
              <h4 className="font-semibold text-black">계정 설정</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={() => window.history.back()}
              />
              <h4 className="font-semibold text-black">계정 설정</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={ArrowLeft}
              size="iconM"
              onClick={() => window.history.back()}
            />
            <h4 className="font-semibold text-black">계정 설정</h4>
          </div>
        }
      />

      <div className="px-4 pt-2.5">
        <div className="flex flex-col gap-6">
          {/* 계정 정보 섹션 */}
          <div className="flex flex-col gap-2">
            <h5 className="text-gr">계정 정보</h5>
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                계정 유형: {user.accounts?.providerId || user.userType}
              </p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* 계정 탈퇴 섹션 */}
          <button
            onClick={() => setIsWithdrawalOpen(true)}
            className="text-left"
          >
            <h5 className="text-gr hover:text-red cursor-pointer">계정 탈퇴</h5>
          </button>
        </div>
      </div>

      {/* 계정 탈퇴 확인 BottomSheet */}
      <BottomSheet
        open={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        variant="primary"
        title="정말 탈퇴하시겠습니까?"
        description="계정 탈퇴시 그동안의 데이터는 복구되지 않아요."
        leftButtonText="아니요"
        rightButtonText="네, 할래요"
        onLeftClick={() => setIsWithdrawalOpen(false)}
        onRightClick={handleWithdrawal}
      />
    </Container>
  );
}
