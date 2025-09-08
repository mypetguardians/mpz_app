"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCard } from "./_components/NotificationCard";
import { useGetNotificationsInfinite } from "@/hooks/query/useGetNotifications";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetNotificationsInfinite(20);

  // 소켓 알림 시스템 사용
  const {
    isConnected: socketConnected,
    notifications: socketNotifications,
    markAsRead: socketMarkAsRead,
  } = useNotificationSocket();

  const [useSocketData, setUseSocketData] = useState(false);

  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();

  // 소켓이 연결되어 있고 실시간 알림이 있으면 소켓 데이터 사용
  // 무한스크롤 데이터를 평면화하여 사용
  const allNotifications =
    notificationsData?.pages?.flatMap((page) => page.data || []) || [];
  const notifications =
    socketConnected && socketNotifications.length > 0
      ? socketNotifications
      : allNotifications;

  // 소켓 연결 상태에 따른 데이터 소스 결정
  useEffect(() => {
    setUseSocketData(socketConnected && socketNotifications.length > 0);
  }, [socketConnected, socketNotifications.length]);

  // 무한스크롤 함수
  const loadMoreNotifications = useCallback(() => {
    if (
      isFetchingNextPage ||
      !hasNextPage ||
      (socketConnected && useSocketData)
    )
      return;
    fetchNextPage();
  }, [
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    socketConnected,
    useSocketData,
  ]);

  // 스크롤 이벤트 처리
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 기존 타이머 클리어
      clearTimeout(timeoutId);

      // 100ms 후에 스크롤 처리 실행 (디바운싱)
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // 페이지 하단에서 800px 이내에 도달하면 다음 페이지 로드
        if (scrollTop + windowHeight >= documentHeight - 800) {
          loadMoreNotifications();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadMoreNotifications]);

  // 소켓이 연결되지 않은 경우에만 폴링으로 데이터 새로고침
  useEffect(() => {
    if (!socketConnected && isAuthenticated) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 30초 = 30000ms

      return () => clearInterval(interval);
    }
  }, [refetch, isAuthenticated, socketConnected]);

  const handleBack = () => {
    router.back();
  };

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (isRead) return;

    // 소켓 연결 시 소켓으로 읽음 처리, 아니면 기존 API 사용
    if (socketConnected && useSocketData) {
      socketMarkAsRead(notificationId);
    } else {
      markNotificationRead.mutate(notificationId, {
        onSuccess: () => {
          console.log("알림이 읽음 처리되었습니다.");
        },
        onError: (error) => {
          console.error("알림 읽음 처리 실패:", error);
        },
      });
    }
  };

  const handleMarkAllAsRead = () => {
    // 소켓 연결 시 소켓으로 전체 읽음 처리, 아니면 기존 API 사용
    if (socketConnected && useSocketData) {
      notifications.forEach((notification) => {
        if (!notification.is_read) {
          socketMarkAsRead(notification.id);
        }
      });
    } else {
      markAllNotificationsRead.mutate(undefined, {
        onSuccess: () => {
          console.log("모든 알림이 읽음 처리되었습니다.");
        },
        onError: (error) => {
          console.error("전체 알림 읽음 처리 실패:", error);
        },
      });
    }
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
          <>
            {notifications.map((item) => (
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
            ))}

            {/* 로딩 상태 표시 */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {/* 모든 알림을 불러온 경우 */}
            {!useSocketData && !hasNextPage && notifications.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">모든 알림을 불러왔습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
