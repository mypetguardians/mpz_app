"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/useToast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useWebPushNotification } from "@/hooks/mutation/usePushToken";
import type { Notification } from "@/types/notifications";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { requestPermissionAndRegisterToken } = useWebPushNotification();

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(
    (n: Notification) => !n.is_read
  ).length;

  // 소켓 연결 설정
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 소켓 연결 생성 (환경에 따른 URL 설정)
    const isDevelopment =
      typeof window !== "undefined" && window.location.hostname === "localhost";
    const socketUrl = isDevelopment
      ? "ws://localhost:8000"
      : "wss://your-backend-domain.com"; // Django 실제 백엔드 서버주소필요해요

    const newSocket = io(socketUrl, {
      auth: {
        userId: user.id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // 연결 이벤트 핸들러
    newSocket.on("connect", () => {
      console.log("소켓 연결됨:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("소켓 연결 해제됨");
      setIsConnected(false);
    });

    // 새로운 알림 수신
    newSocket.on("new_notification", (notification: Notification) => {
      console.log("새 알림 수신:", notification);
      setNotifications((prev: Notification[]) => [notification, ...prev]);

      // 토스트 알림 표시
      showToast(notification.message, "success");

      // 브라우저 알림 표시 (권한이 있는 경우)
      if (
        "Notification" in window &&
        window.Notification.permission === "granted"
      ) {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      }
    });

    // 알림 읽음 상태 업데이트
    newSocket.on("notification_read", (data: { notificationId: string }) => {
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) =>
          n.id === data.notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    });

    // 연결 오류 처리
    newSocket.on("connect_error", (error: Error) => {
      console.error("소켓 연결 오류:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // 정리 함수
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, showToast, socket]);

  // 브라우저 알림 권한 요청 및 푸시 토큰 등록
  useEffect(() => {
    if (isAuthenticated && user) {
      // 웹 푸시 알림 권한 요청 및 토큰 등록
      requestPermissionAndRegisterToken();
    }
  }, [isAuthenticated, user, requestPermissionAndRegisterToken]);

  // 알림 추가 함수
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev: Notification[]) => [notification, ...prev]);
  }, []);

  // 알림 읽음 처리 함수
  const markAsRead = useCallback(
    (notificationId: string) => {
      if (socket) {
        socket.emit("mark_notification_read", { notificationId });
      }

      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    },
    [socket]
  );

  // 알림 목록 초기화 함수
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket은 SocketProvider 내부에서만 사용할 수 있습니다");
  }
  return context;
}
