"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useMemo } from "react";

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
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";
import type { Notification as NotificationType } from "@/types/notifications";

export default function Notification() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
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

  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();

  // API 알림 목록 메모이제이션
  const allNotifications = useMemo(
    () => notificationsData?.pages?.flatMap((page) => page.data || []) || [],
    [notificationsData]
  );

  const notifications = useMemo(() => {
    const merged = [...socketNotifications, ...allNotifications];
    const seen = new Set<string>();
    return merged
      .filter((n) => {
        if (!n?.id) return false;
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [socketNotifications, allNotifications]);

  const isCenterUser =
    user?.userType === "센터관리자" || user?.userType === "센터최고관리자";
  const { data: myCenter } = useGetMyCenter({ enabled: isCenterUser });

  const centerIds = useMemo(() => {
    if (!user) return [];

    const ids = new Set<string>();
    const pushId = (value: unknown) => {
      if (value === undefined || value === null) return;
      if (typeof value === "string" || typeof value === "number") {
        ids.add(String(value));
      }
    };

    const collectFromObject = (value: unknown) => {
      if (!value || typeof value !== "object") return;

      if ("id" in (value as Record<string, unknown>)) {
        pushId((value as { id?: unknown }).id);
      }
    };

    const userRecord =
      user && typeof user === "object"
        ? (user as unknown as Record<string, unknown>)
        : null;

    if (userRecord) {
      if ("center" in userRecord) {
        collectFromObject(userRecord.center);
      }
      if ("centerId" in userRecord) {
        pushId(userRecord.centerId);
      }
      if ("center_id" in userRecord) {
        pushId(userRecord.center_id);
      }
      if ("owned_center" in userRecord) {
        collectFromObject(userRecord.owned_center);
      }
      if ("ownedCenter" in userRecord) {
        collectFromObject(userRecord.ownedCenter);
      }
    }

    if (myCenter?.id) {
      pushId(myCenter.id);
    }

    if (Array.isArray(user?.centers)) {
      user.centers.forEach((center) => collectFromObject(center));
    } else if (user?.centers) {
      collectFromObject(user.centers);
    }

    return Array.from(ids);
  }, [user, myCenter]);

  const filteredNotifications = useMemo(() => {
    const parseMetadata = (
      metadata: NotificationType["metadata"]
    ): Record<string, unknown> | null => {
      if (!metadata) return null;
      if (typeof metadata === "string") {
        try {
          const parsed = JSON.parse(metadata);
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
          console.error("메타데이터 파싱 실패:", error);
          return null;
        }
      }
      if (typeof metadata === "object" && !Array.isArray(metadata)) {
        return metadata as Record<string, unknown>;
      }
      return null;
    };

    const collectIds = (value: unknown): string[] => {
      const result: string[] = [];
      if (value === null || value === undefined) return result;

      if (typeof value === "string" || typeof value === "number") {
        result.push(String(value));
        return result;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          result.push(...collectIds(item));
        });
        return result;
      }

      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if ("id" in obj) {
          result.push(...collectIds(obj.id));
        }
      }
      return result;
    };

    const collectByKeys = (
      source: Record<string, unknown>,
      keys: string[]
    ): string[] => {
      return keys.flatMap((key) => collectIds(source[key]));
    };

    return notifications.filter((notification) => {
      if (user && notification.user_id && notification.user_id !== user.id) {
        return false;
      }

      const metadata = parseMetadata(notification.metadata);
      if (!metadata) {
        return true;
      }

      if (isCenterUser && centerIds.length > 0) {
        const centerRelatedIds = [
          ...collectByKeys(metadata, [
            "center_id",
            "centerId",
            "centerID",
            "animal_center_id",
            "adoption_center_id",
            "owner_center_id",
          ]),
        ];

        const nestedCenterSources = ["center", "animal", "adoption"];
        nestedCenterSources.forEach((key) => {
          const value = metadata[key];
          if (value && typeof value === "object" && !Array.isArray(value)) {
            centerRelatedIds.push(
              ...collectByKeys(value as Record<string, unknown>, [
                "center_id",
                "centerId",
              ])
            );
          }
        });

        if ("related_center_ids" in metadata) {
          centerRelatedIds.push(
            ...collectIds(metadata.related_center_ids as unknown)
          );
        }

        if (centerRelatedIds.length === 0) {
          return true;
        }

        return centerRelatedIds.some((id) => centerIds.includes(id));
      }

      if (user && !isCenterUser) {
        const userRelatedIds = [
          ...collectByKeys(metadata, [
            "user_id",
            "userId",
            "applicant_id",
            "applicantId",
            "adoption_user_id",
            "owner_id",
            "ownerId",
            "writer_id",
            "writerId",
          ]),
        ];

        if ("user" in metadata && metadata.user) {
          userRelatedIds.push(
            ...collectIds((metadata.user as Record<string, unknown>).id)
          );
        }

        if (userRelatedIds.length === 0) {
          return true;
        }

        return userRelatedIds.includes(user.id);
      }

      return true;
    });
  }, [notifications, user, isCenterUser, centerIds]);

  // 무한스크롤 함수
  const loadMoreNotifications = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

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

  const resolveActionUrl = useCallback(
    (notification: NotificationType): string | null => {
      const original = notification.action_url;
      if (!original) return null;

      if (isCenterUser && original.startsWith("/adoptions/")) {
        return "/centerpage/adoptorlist/application?status=신청";
      }

      return original;
    },
    [isCenterUser]
  );

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.is_read) {
      if (socketConnected) {
        socketMarkAsRead(notification.id);
      } else {
        markNotificationRead.mutate(notification.id, {
          onSuccess: () => {
            console.log("알림이 읽음 처리되었습니다.");
          },
          onError: (error) => {
            console.error("알림 읽음 처리 실패:", error);
          },
        });
      }
    }

    const actionUrl = resolveActionUrl(notification);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    // 소켓 연결 시 소켓으로 전체 읽음 처리, 아니면 기존 API 사용
    if (socketConnected && socketNotifications.length > 0) {
      filteredNotifications.forEach((notification) => {
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
            <button
              type="button"
              className="text-gr cursor-pointer hover:text-dg transition-colors text-[12px] bg-transparent border-none"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </button>
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
            <button
              type="button"
              className="text-gr cursor-pointer hover:text-dg transition-colors text-[12px] bg-transparent border-none"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </button>
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
            <button
              type="button"
              className="text-gr cursor-pointer hover:text-dg transition-colors text-[12px] bg-transparent border-none"
              onClick={handleMarkAllAsRead}
            >
              전체읽음
            </button>
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
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">아직 받은 알림이 없어요.</p>
            </div>
          </div>
        ) : (
          <>
            {filteredNotifications.map((item) => (
              <NotificationCard
                key={item.id}
                variant="primary"
                message={item.message}
                date={item.created_at}
                type={item.notification_type}
                isRead={item.is_read}
                onClick={() => handleNotificationClick(item)}
              />
            ))}

            {/* 로딩 상태 표시 */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {/* 모든 알림을 불러온 경우 */}
            {!hasNextPage && filteredNotifications.length > 0 && (
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
