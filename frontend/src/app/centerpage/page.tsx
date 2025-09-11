"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SealCheck, User } from "@phosphor-icons/react";
import Image from "next/image";

import { useAuth } from "@/components/providers/AuthProvider";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";

import { Container } from "@/components/common/Container";
import { MiniButton } from "@/components/ui/MiniButton";
import { TopBar } from "@/components/common/TopBar";
import { NavBar } from "@/components/common/NavBar";
import { TextMenu } from "@/components/ui/TextMenu";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";

// 메뉴 아이템 타입
interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  href?: string;
  disabled?: boolean;
}

export default function MyPage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { data: myCenter } = useGetMyCenter();

  const isSubscriber = myCenter?.isSubscriber === true;

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      setShowLogoutToast(true);

      // 로그아웃 실행
      await logout();

      // 3초 후 토스트 숨기기
      setTimeout(() => {
        setShowLogoutToast(false);
      }, 3000);
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
      // 에러가 발생해도 토스트는 표시 (로그아웃은 실행됨)
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
      label: "센터 정보 수정",
      onClick: () => {
        console.log("센터 정보 수정");
      },
      href: isAuthenticated ? "/centerpage/setting-name" : undefined,
    },
    {
      id: "2",
      label: "입양자 관리",
      onClick: () => {
        console.log("입양자 관리");
      },
      href: isAuthenticated ? "/centerpage/adoptorlist/application" : undefined,
    },
    {
      id: "3",
      label: "동물 관리",
      onClick: () => console.log("동물 관리"),
      href: "/centerpage/animal",
    },
    {
      id: "4",
      label: "입양 절차 관리",
      onClick: () => {
        console.log("입양 절차 관리");
      },
      href: isAuthenticated ? "/centerpage/process" : undefined,
    },
    {
      id: "5",
      label: "관리자 초대 및 관리",
      onClick: () => {
        console.log("관리자 초대 및 관리");
      },
      href: isAuthenticated ? "/centerpage/admin" : undefined,
      disabled: user?.userType !== "센터최고관리자",
    },
    {
      id: "6",
      label: "공지사항",
      onClick: () => {
        console.log("공지사항");
      },
      href: isAuthenticated ? "/centerpage/notice" : undefined,
    },
    {
      id: "7",
      label: "로그아웃",
      onClick: () => {
        if (isAuthenticated) {
          setShowLogoutModal(true);
        } else {
          console.log("로그아웃");
        }
      },
    },
  ];

  return (
    <Container className="min-h-screen">
      {/* TopBar */}
      <TopBar left={<h2 className="text-bk">센터 관리자</h2>} />
      <div className="w-full flex flex-col gap-2 pb-[72px] min-h-[100px]">
        <div className="w-full px-4">
          <div className="w-full flex py-3 items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-[20px] overflow-hidden">
                {myCenter?.imageUrl ? (
                  <Image
                    src={myCenter.imageUrl}
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
              <div className="flex items-center gap-1">
                {isAuthenticated && myCenter ? (
                  <div>
                    <span className="font-medium text-black">
                      {myCenter.name || "보호센터 이름"}
                    </span>
                  </div>
                ) : (
                  <span className="font-medium text-black">
                    센터 정보를 불러오는 중입니다...
                  </span>
                )}
                {isSubscriber && (
                  <SealCheck
                    size={14}
                    className="text-brand-light"
                    weight="fill"
                  />
                )}
              </div>
            </div>
            <Link href="/centerpage/setting-name">
              <MiniButton text="수정" variant="outline" />
            </Link>
          </div>
        </div>
        <div className="w-full flex flex-col px-4 gap-1">
          {menuItems
            .filter((item) => !item.disabled)
            .map((item) => (
              <TextMenu
                key={item.id}
                title={item.label}
                onClick={item.onClick}
                href={item.href}
              />
            ))}
        </div>
      </div>

      {/* NavBar */}
      <NavBar />

      {/* <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} /> */}
      <BottomSheet
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        variant="primary"
        title="정말 로그아웃하시겠습니까?"
        leftButtonText="아니요"
        rightButtonText="네, 할래요"
        onLeftClick={() => setShowLogoutModal(false)}
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
