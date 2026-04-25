"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/useToast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useWebPushNotification } from "@/hooks/mutation/usePushToken";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/notifications";
import Cookies from "js-cookie";

interface SocketContextValue {
  socket: WebSocket | null;
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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { requestPermissionAndRegisterToken } = useWebPushNotification();
  const pushTokenRegisteredRef = useRef(false);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(
    (n: Notification) => !n.is_read
  ).length;

  // 소켓 연결 설정
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    // 소켓 연결 생성 (환경에 따른 URL 설정)
    const isDevelopment =
      typeof window !== "undefined" && window.location.hostname === "localhost";
    const protocol = isDevelopment ? "ws" : "wss";
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST || (isDevelopment ? "localhost:8000" : "api.mpz.kr");

    // JWT 토큰 가져오기
    const accessToken = Cookies.get("accessToken") || Cookies.get("access");
    const tokenParam = accessToken
      ? `?token=${encodeURIComponent(accessToken)}`
      : "";
    const socketUrl = `${protocol}://${wsHost}/ws/notifications/${user.id}/${tokenParam}`;

    const connectWebSocket = () => {
      try {
        const newSocket = new WebSocket(socketUrl);

        // 연결 성공
        newSocket.onopen = () => {
          setIsConnected(true);
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        // 메시지 수신
        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "new_notification") {
              // metadata의 sub_type을 우선 사용해 세부 알림 타입을 복원
              const rawMetadata = data.metadata || null;
              let parsedMetadata: Notification["metadata"] = rawMetadata;

              if (typeof rawMetadata === "string") {
                try {
                  parsedMetadata = JSON.parse(rawMetadata);
                } catch (error) {
                  console.warn("메타데이터 파싱 실패:", error);
                  parsedMetadata = rawMetadata;
                }
              }

              const subType =
                parsedMetadata &&
                typeof parsedMetadata === "object" &&
                "sub_type" in parsedMetadata
                  ? String((parsedMetadata as Record<string, unknown>).sub_type)
                  : undefined;
              const notificationType =
                subType || data.notification_type || "other";

              const notification: Notification = {
                id: data.id || "",
                user_id: user.id,
                title: data.title || data.message || "",
                message: data.message || "",
                notification_type: notificationType,
                priority: data.priority || "normal",
                is_read: data.is_read || false,
                read_at: data.read_at || null,
                action_url: data.action_url || null,
                metadata: parsedMetadata,
                created_at: data.created_at || new Date().toISOString(),
                updated_at: data.created_at || new Date().toISOString(),
              };

              setNotifications((prev: Notification[]) => [
                notification,
                ...prev,
              ]);

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
            } else if (data.type === "notification_read") {
              setNotifications((prev: Notification[]) =>
                prev.map((n: Notification) =>
                  n.id === data.notificationId
                    ? { ...n, is_read: true, read_at: new Date().toISOString() }
                    : n
                )
              );
            }
          } catch {
            // ignore malformed messages
          }
        };

        // 연결 해제
        newSocket.onclose = () => {
          setIsConnected(false);
          socketRef.current = null;
          setSocket(null);

          // 재연결 시도 (5초 후)
          if (isAuthenticated && user) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 5000);
          }
        };

        // 연결 오류 처리
        newSocket.onerror = () => {
          setIsConnected(false);
        };

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch {
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // 정리 함수
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, showToast]);

  // 브라우저 알림 권한 요청 및 푸시 토큰 등록 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && user && !pushTokenRegisteredRef.current) {
      pushTokenRegisteredRef.current = true;
      // 웹 푸시 알림 권한 요청 및 토큰 등록
      requestPermissionAndRegisterToken()
        .catch(() => {
          pushTokenRegisteredRef.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // requestPermissionAndRegisterToken은 안정적인 함수이므로 의존성에서 제외

  // Firebase 포그라운드 메시지 수신
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      try {
        const { getFirebaseMessaging } = await import("@/lib/firebase");
        const { onMessage } = await import("firebase/messaging");

        const messaging = await getFirebaseMessaging();
        if (!messaging) {
          console.log("[FCM] 이 브라우저는 Firebase Messaging을 지원하지 않습니다.");
          return;
        }

        console.log("[FCM] 포그라운드 메시지 리스너 등록 완료");

        unsubscribe = onMessage(messaging, (payload) => {
          console.log("[FCM] 포그라운드 메시지 수신:", payload.notification?.title, payload.notification?.body);

          const body = payload.notification?.body || "";
          if (body) showToast(body, "success");

          // 알림 쿼리 갱신 → 뱃지 카운트 실시간 업데이트
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        });
      } catch (error) {
        console.error("[FCM] 포그라운드 메시지 설정 실패:", error);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user, showToast, queryClient]);

  // 알림 추가 함수
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev: Notification[]) => [notification, ...prev]);
  }, []);

  // 알림 읽음 처리 함수
  const markAsRead = useCallback(
    (notificationId: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "mark_read",
            notification_id: notificationId,
          })
        );
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
