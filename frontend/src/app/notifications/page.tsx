"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCard } from "./_components/NotificationCard";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Notification() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: notificationsData, isLoading, error } = useGetNotifications();

  const handleBack = () => {
    router.back();
  };

  // 로그인되지 않은 경우
  if (!isAuthenticated) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>알림함</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">로그인이 필요한 서비스입니다.</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              로그인하기
            </button>
          </div>
        </div>
      </Container>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>알림함</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>알림함</h4>
            </div>
          }
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">알림을 불러오는데 실패했습니다.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      </Container>
    );
  }

  const notifications = notificationsData?.notifications || [];

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>알림함</h4>
          </div>
        }
      />
      <div className="flex flex-col gap-2 p-4">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">아직 받은 알림이 없어요.</p>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              variant="primary"
              title={item.title}
              message={item.content}
              date={item.createdAt}
              type={item.type}
            />
          ))
        )}
      </div>
    </Container>
  );
}
