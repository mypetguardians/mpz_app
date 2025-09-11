"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@phosphor-icons/react";

import { CaretRight } from "@phosphor-icons/react";
import { Container } from "@/components/common/Container";
import { MiniButton } from "@/components/ui/MiniButton";
import { TopBar } from "@/components/common/TopBar";
import { NavBar } from "@/components/common/NavBar";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { TextMenu } from "@/components/ui/TextMenu";
import { CustomModal } from "@/components/ui/CustomModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";

import { useAuth } from "@/components/providers/AuthProvider";
import { useGetUserAdoptions } from "@/hooks/query/useGetUserAdoptions";

// 메뉴 아이템 타입
interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  href?: string;
}

export default function MyPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutSheetOpen, setIsLogoutSheetOpen] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  // 실제 사용자의 입양 목록 가져오기
  const {
    data: adoptionsData,
    isLoading: adoptionsLoading,
    error: adoptionsError,
  } = useGetUserAdoptions({
    filters: {
      status: undefined,
    },
  });

  // 입양 상태를 단계별로 변환하는 함수
  const getAdoptionStep = (status: string): number => {
    switch (status) {
      case "신청":
        return 1;
      case "미팅":
        return 2;
      case "계약서작성":
        return 3;
      case "입양완료":
        return 4;
      case "모니터링":
        return 5;
      default:
        return 1;
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      // UI 우선 업데이트
      setIsLogoutSheetOpen(false);
      setShowLogoutToast(true);

      // 서버 로그아웃 실행
      await logout();

      // 3초 후 토스트 숨기기
      setTimeout(() => {
        setShowLogoutToast(false);
      }, 3000);
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
      // 에러가 발생해도 토스트는 표시
      setShowLogoutToast(true);
      setTimeout(() => {
        setShowLogoutToast(false);
      }, 3000);
    }
  };

  // 메뉴 아이템들
  const menuItems: MenuItem[] = [
    {
      id: "1",
      label: "내 입양 현황",
      onClick: () => {
        if (!isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.log("내 입양 현황");
        }
      },
      href: isAuthenticated ? "/my/adoption" : undefined,
    },
    {
      id: "2",
      label: "매칭 결과 다시보기",
      onClick: () => {
        if (!isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.log("매칭 결과 다시보기");
        }
      },
      href: isAuthenticated ? "/my/matchingresult" : undefined,
    },
    {
      id: "3",
      label: "고객센터",
      onClick: () => {
        if (!isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.log("고객센터");
        }
      },
      href: isAuthenticated ? "/my/proposal" : undefined,
    },
    {
      id: "4",
      label: "계정 설정",
      onClick: () => {
        if (!isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.log("계정 설정");
        }
      },
      href: isAuthenticated ? "/my/account" : undefined,
    },
    {
      id: "5",
      label: "로그아웃",
      onClick: () => {
        if (!isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          // 로그아웃 확인 바텀시트 열기
          setIsLogoutSheetOpen(true);
        }
      },
    },
  ];

  return (
    <Container className="min-h-screen">
      {/* TopBar */}
      <TopBar left={<h2 className="text-bk">마이페이지</h2>} />
      <div className="pb-20 mx-4">
        {/* 메인 콘텐츠 */}
        <div className="pb-6 pt-4">
          {/* 프로필 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-[20px] overflow-hidden">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt="프로필 이미지"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-lg flex items-center justify-center p-1">
                    <User size={24} weight="bold" className="text-gr" />
                  </div>
                )}
              </div>
              {isAuthenticated && user ? (
                <div>
                  <span className="font-medium text-black">
                    {user.nickname || "사용자"}
                  </span>
                </div>
              ) : (
                <span className="font-medium text-black">
                  로그인을 해주세요.
                </span>
              )}
            </div>

            {/* 프로필 수정 버튼 */}
            {isAuthenticated ? (
              <Link href="/my/profile">
                <MiniButton text="프로필 수정" variant="outline" />
              </Link>
            ) : (
              <MiniButton
                text="프로필 수정"
                variant="outline"
                onClick={() => setIsLoginModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* 입양 현황 섹션 */}
        {isAuthenticated && (
          <div className="space-y-2">
            {adoptionsLoading ? (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-center text-gray-500">로딩 중...</div>
              </div>
            ) : adoptionsError ? (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-center text-red-500">
                  입양 현황을 불러오는데 실패했습니다.
                </div>
              </div>
            ) : adoptionsData?.data && adoptionsData.data.length > 0 ? (
              adoptionsData.data
                .filter((adoption) => adoption.status !== "취소")
                .map((adoption) => (
                  <div
                    key={adoption.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    onClick={() => {
                      // 입양 상태에 따라 해당 스텝 페이지로 이동
                      const status = adoption.status;
                      if (status === "신청") {
                        router.push(`/my/adoption/${adoption.id}/request`);
                      } else if (status === "미팅") {
                        router.push(`/my/adoption/${adoption.id}/meeting`);
                      } else if (status === "계약서작성") {
                        router.push(`/my/adoption/${adoption.id}/writing`);
                      } else if (status === "입양완료") {
                        router.push(`/my/adoption/${adoption.id}/complete`);
                      } else if (status === "모니터링") {
                        router.push(`/my/adoption/${adoption.id}/monitoring`);
                      } else if (status === "취소") {
                        router.push(`/my/adoption/${adoption.id}/refuse`);
                      } else {
                        router.push(`/my/adoption/${adoption.id}/request`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {/* 동물 이미지 */}
                      <div className="relative overflow-hidden w-16 h-16 rounded-lg bg-gray-100">
                        <Image
                          src={adoption.animal_image || "/img/dummyImg.png"}
                          alt={adoption.animal_name || "동물"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/img/dummyImg.png";
                          }}
                        />
                      </div>
                      {/* 텍스트와 화살표 */}
                      <div className="flex items-center gap-8">
                        <p className="text-sm text-black">
                          {adoption.user_nickname ||
                            adoption.user_name ||
                            "사용자"}
                          님과의 만남을 기다리고 있어요!
                        </p>
                        <CaretRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <DotProgressBar
                      currentStep={getAdoptionStep(adoption.status)}
                    />
                  </div>
                ))
            ) : (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-center text-gray-500">
                  진행 중인 입양이 없습니다.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 메뉴 섹션 */}
        <div className="my-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <TextMenu
                key={item.id}
                title={item.label}
                onClick={item.onClick}
                href={item.href}
              />
            ))}
          </div>
        </div>
      </div>

      <NavBar />

      {/* 로그인 모달 */}
      <CustomModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="로그인 후 이용해주세요"
        variant="variant2"
        ctaText="로그인하기"
        onCtaClick={() => (window.location.href = "/login")}
      />

      {/* 로그아웃 확인 바텀시트 */}
      <BottomSheet
        open={isLogoutSheetOpen}
        onClose={() => setIsLogoutSheetOpen(false)}
        variant="primary"
        title="정말 로그아웃하시겠습니까?"
        leftButtonText="아니요"
        rightButtonText="네, 할래요"
        onLeftClick={() => setIsLogoutSheetOpen(false)}
        onRightClick={handleLogout}
      />

      {/* 로그아웃 완료 토스트 */}
      {showLogoutToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>로그아웃되었습니다.</Toast>
        </div>
      )}
    </Container>
  );
}
