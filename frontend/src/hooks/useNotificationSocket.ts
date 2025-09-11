"use client";

import { useCallback, useEffect } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Notification } from "@/types/notifications";

// 소켓 이벤트 데이터 타입 정의
export interface SocketEventData {
  new_notification: Notification;
  notification_read: { notificationId: string };
  mark_notification_read: { notificationId: string };
  [key: string]: unknown;
}

export interface NotificationSocketHook {
  /** 소켓 연결 상태 */
  isConnected: boolean;
  /** 실시간 알림 목록 */
  notifications: Notification[];
  /** 읽지 않은 알림 개수 */
  unreadCount: number;
  /** 특정 알림을 읽음 처리 */
  markAsRead: (notificationId: string) => void;
  /** 모든 알림 삭제 */
  clearNotifications: () => void;
  /** 특정 이벤트 리스너 등록 */
  addEventListener: <K extends keyof SocketEventData>(
    event: K,
    callback: (data: SocketEventData[K]) => void
  ) => void;
  /** 특정 이벤트 리스너 제거 */
  removeEventListener: <K extends keyof SocketEventData>(
    event: K,
    callback: (data: SocketEventData[K]) => void
  ) => void;
  /** 서버로 이벤트 전송 */
  emit: <K extends keyof SocketEventData>(
    event: K,
    data?: SocketEventData[K]
  ) => void;
}

export function useNotificationSocket(): NotificationSocketHook {
  const {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  } = useSocket();

  // 이벤트 리스너 등록
  const addEventListener = useCallback(
    <K extends keyof SocketEventData>(
      event: K,
      callback: (data: SocketEventData[K]) => void
    ) => {
      if (socket) {
        socket.on(event as string, callback);
      }
    },
    [socket]
  );

  // 이벤트 리스너 제거
  const removeEventListener = useCallback(
    <K extends keyof SocketEventData>(
      event: K,
      callback: (data: SocketEventData[K]) => void
    ) => {
      if (socket) {
        socket.off(event as string, callback);
      }
    },
    [socket]
  );

  // 서버로 이벤트 전송
  const emit = useCallback(
    <K extends keyof SocketEventData>(event: K, data?: SocketEventData[K]) => {
      if (socket && isConnected) {
        socket.emit(event as string, data);
      } else {
        console.warn(
          "소켓이 연결되지 않았습니다. 이벤트를 전송할 수 없습니다:",
          event
        );
      }
    },
    [socket, isConnected]
  );

  // 연결 상태 로깅 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("소켓 연결 상태:", isConnected);
    }
  }, [isConnected]);

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    addEventListener,
    removeEventListener,
    emit,
  };
}

// 특정 알림 타입별 훅들
export function useAdoptionNotifications() {
  const { notifications, addEventListener, removeEventListener } =
    useNotificationSocket();

  const adoptionNotifications = notifications.filter(
    (n) =>
      n.notification_type === "adoption" ||
      n.notification_type === "adoption_approved" ||
      n.notification_type === "adoption_rejected"
  );

  const onAdoptionUpdate = useCallback(
    (callback: (notification: Notification) => void) => {
      const handler = (notification: Notification) => {
        if (notification.notification_type.includes("adoption")) {
          callback(notification);
        }
      };

      addEventListener("new_notification", handler);

      return () => removeEventListener("new_notification", handler);
    },
    [addEventListener, removeEventListener]
  );

  return {
    adoptionNotifications,
    onAdoptionUpdate,
  };
}

export function useMatchingNotifications() {
  const { notifications, addEventListener, removeEventListener } =
    useNotificationSocket();

  const matchingNotifications = notifications.filter(
    (n) =>
      n.notification_type === "matching" ||
      n.notification_type === "matching_result"
  );

  const onMatchingUpdate = useCallback(
    (callback: (notification: Notification) => void) => {
      const handler = (notification: Notification) => {
        if (notification.notification_type.includes("matching")) {
          callback(notification);
        }
      };

      addEventListener("new_notification", handler);

      return () => removeEventListener("new_notification", handler);
    },
    [addEventListener, removeEventListener]
  );

  return {
    matchingNotifications,
    onMatchingUpdate,
  };
}

export function useCommunityNotifications() {
  const { notifications, addEventListener, removeEventListener } =
    useNotificationSocket();

  const communityNotifications = notifications.filter(
    (n) =>
      n.notification_type === "comment" ||
      n.notification_type === "reply" ||
      n.notification_type === "like"
  );

  const onCommunityUpdate = useCallback(
    (callback: (notification: Notification) => void) => {
      const handler = (notification: Notification) => {
        if (
          ["comment", "reply", "like"].includes(notification.notification_type)
        ) {
          callback(notification);
        }
      };

      addEventListener("new_notification", handler);

      return () => removeEventListener("new_notification", handler);
    },
    [addEventListener, removeEventListener]
  );

  return {
    communityNotifications,
    onCommunityUpdate,
  };
}
