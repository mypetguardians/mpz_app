"use client";

import { Loading } from "@/components/common/Loading";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useDeleteKakaoAccount } from "@/hooks/mutation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function MyAccountPage() {
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const deleteKakaoAccount = useDeleteKakaoAccount();

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleWithdrawal = async () => {
    setIsWithdrawalOpen(false);
    try {
      await deleteKakaoAccount.mutateAsync();
      // 성공 시 hook의 onSuccess가 logout 호출 → AuthProvider가 redirect 처리. 안전망으로 명시 push.
      router.push("/");
    } catch (error) {
      // BE 강화(2026-05-04): 진행 중 입양/주문 시 400, 그 외 500
      let message = "탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      if (axios.isAxiosError(error)) {
        const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
        if (error.response?.status === 400 && detail) {
          message = detail;
        } else if (detail) {
          message = detail;
        }
      }
      setToastMessage(message);
    }
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
        <Loading fullScreen />
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
              <p className="text-sm text-gray-600">가입 계정 : {user.email}</p>
            </div>
          </div>

          {/* 계정 탈퇴 섹션 */}
          <button
            onClick={() => setIsWithdrawalOpen(true)}
            className="text-left"
          >
            <h5 className="text-red/60 hover:text-red cursor-pointer">
              계정 탈퇴
            </h5>
          </button>
        </div>
      </div>

      {/* 계정 탈퇴 확인 BottomSheet */}
      <BottomSheet
        open={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
        variant="primary"
        title="정말 탈퇴하시겠습니까?"
        description="계정 탈퇴시 개인정보는 즉시 비식별화됩니다. 다만 주문/거래 기록은 전자상거래법에 따라 5년간 보관 후 완전 삭제됩니다."
        leftButtonText="아니요"
        rightButtonText="네, 할래요"
        onLeftClick={() => setIsWithdrawalOpen(false)}
        onRightClick={handleWithdrawal}
      />

      {/* 진행 중 입양/주문 시 안내 토스트 */}
      {toastMessage && (
        <NotificationToast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </Container>
  );
}
