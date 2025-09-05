"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCard } from "./_components/NotificationCard";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/mutation";

export default function Notification() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useGetNotifications();

  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();

  const notifications = notificationsData?.data || [];

  // 30초마다 알림 데이터 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refetch();
      }
    }, 30000); // 30초 = 30000ms

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, [refetch, isAuthenticated]);

  const handleBack = () => {
    router.back();
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (isRead) return;

    markNotificationRead.mutate(notificationId, {
      onSuccess: () => {
        console.log("알림이 읽음 처리되었습니다.");
      },
      onError: (error) => {
        console.error("알림 읽음 처리 실패:", error);
      },
    });
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => {
        console.log("모든 알림이 읽음 처리되었습니다.");
      },
      onError: (error) => {
        console.error("전체 알림 읽음 처리 실패:", error);
      },
    });
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
          right={
            <h6
              className="text-gr cursor-pointer hover:text-dg transition-colors"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </h6>
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
          right={
            <h6
              className="text-gr cursor-pointer hover:text-dg transition-colors"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </h6>
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
          right={
            <h6
              className="text-gr cursor-pointer hover:text-dg transition-colors"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </h6>
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
        right={
          <h6
            className="text-gr cursor-pointer hover:text-dg transition-colors"
            onClick={handleMarkAllAsRead}
          >
            전체읽음
          </h6>
        }
      />
      <div className="flex flex-col">
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
              message={item.message}
              date={item.created_at}
              type={item.notification_type}
              isRead={item.is_read}
              onClick={() =>
                handleNotificationClick(item.id.toString(), item.is_read)
              }
            />
          ))
        )}
      </div>
    </Container>
  );
}
