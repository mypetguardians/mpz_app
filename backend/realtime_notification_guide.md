# 실시간 알림 사용 가이드

## 개요

이 시스템은 Django Channels를 사용하여 실시간 WebSocket 알림과 FCM 푸시 알림을 동시에 제공합니다:

- **앱이 열려있을 때**: WebSocket을 통한 실시간 알림
- **앱이 닫혀있을 때**: FCM 푸시 알림

## WebSocket 연결

### 연결 URL

```
ws://localhost:8000/ws/notifications/{user_id}/
```

### 인증

- JWT 토큰을 쿼리 파라미터로 전달
- 또는 Django 세션 인증 사용

## 클라이언트 구현 예시

### JavaScript/React

```javascript
class NotificationService {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const wsUrl = `ws://localhost:8000/ws/notifications/${this.userId}/?token=${this.token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("실시간 알림 연결 성공");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log("실시간 알림 연결 해제");
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket 오류:", error);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case "connection_established":
        console.log("연결 확인됨:", data.message);
        break;

      case "notification":
        // 새로운 알림 처리
        this.showNotification(data.data);
        this.updateNotificationList(data.data);
        break;

      case "recent_notifications":
        // 최근 알림 목록 처리
        this.updateNotificationList(data.data);
        break;

      case "mark_read_result":
        // 읽음 처리 결과
        console.log("읽음 처리:", data.success);
        break;

      case "pong":
        // 핑 응답
        console.log("서버 응답:", data.timestamp);
        break;

      default:
        console.log("알 수 없는 메시지 타입:", data.type);
    }
  }

  showNotification(notification) {
    // 브라우저 알림 표시
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icon.png",
      });
    }

    // 앱 내 토스트 알림 표시
    this.showToast(notification);
  }

  updateNotificationList(notifications) {
    // 알림함 목록 업데이트
    // React state 업데이트 또는 이벤트 발생
    this.emit("notificationUpdate", notifications);
  }

  showToast(notification) {
    // 앱 내 토스트 알림 표시
    const toast = document.createElement("div");
    toast.className = "notification-toast";
    toast.innerHTML = `
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
        `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  sendMessage(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  // 최근 알림 요청
  getRecentNotifications() {
    this.sendMessage("get_notifications");
  }

  // 알림 읽음 처리
  markAsRead(notificationId) {
    this.sendMessage("mark_read", { notification_id: notificationId });
  }

  // 핑 메시지 전송 (연결 상태 확인)
  ping() {
    this.sendMessage("ping", { timestamp: Date.now() });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts)); // 지수 백오프
    } else {
      console.error("최대 재연결 시도 횟수 초과");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 사용 예시
const notificationService = new NotificationService("user-123", "jwt-token");
notificationService.connect();

// 주기적 핑 (연결 상태 확인)
setInterval(() => {
  notificationService.ping();
}, 30000); // 30초마다

// 컴포넌트 언마운트 시 연결 해제
// useEffect(() => {
//     return () => notificationService.disconnect();
// }, []);
```

### React Hook 예시

```javascript
import { useEffect, useState, useCallback } from "react";

export const useNotifications = (userId, token) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  const connect = useCallback(() => {
    const wsUrl = `ws://localhost:8000/ws/notifications/${userId}/?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      console.log("실시간 알림 연결 성공");
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    websocket.onclose = () => {
      setIsConnected(false);
      console.log("실시간 알림 연결 해제");
    };

    setWs(websocket);
  }, [userId, token]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "notification":
        setNotifications((prev) => [data.data, ...prev]);
        break;
      case "recent_notifications":
        setNotifications(data.data);
        break;
    }
  }, []);

  const sendMessage = useCallback(
    (type, data = {}) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
      }
    },
    [ws]
  );

  const markAsRead = useCallback(
    (notificationId) => {
      sendMessage("mark_read", { notification_id: notificationId });
    },
    [sendMessage]
  );

  const getRecentNotifications = useCallback(() => {
    sendMessage("get_notifications");
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  useEffect(() => {
    if (isConnected) {
      getRecentNotifications();
    }
  }, [isConnected, getRecentNotifications]);

  return {
    notifications,
    isConnected,
    markAsRead,
    getRecentNotifications,
  };
};
```

## 메시지 타입

### 클라이언트 → 서버

- `ping`: 연결 상태 확인
- `get_notifications`: 최근 알림 요청
- `mark_read`: 알림 읽음 처리

### 서버 → 클라이언트

- `connection_established`: 연결 성공
- `notification`: 새로운 알림
- `recent_notifications`: 최근 알림 목록
- `mark_read_result`: 읽음 처리 결과
- `pong`: 핑 응답
- `error`: 오류 메시지

## 오류 처리

### 연결 실패

- 자동 재연결 시도 (지수 백오프)
- 최대 재시도 횟수 제한
- 사용자에게 연결 상태 표시

### 메시지 처리 실패

- JSON 파싱 오류 처리
- 알 수 없는 메시지 타입 처리
- 서버 오류 응답 처리

## 성능 최적화

### 연결 관리

- 페이지 전환 시 연결 유지
- 백그라운드에서 연결 상태 모니터링
- 주기적 핑으로 연결 상태 확인

### 메시지 처리

- 메시지 큐링 (연결이 끊어진 경우)
- 알림 중복 방지
- 메모리 누수 방지

## 보안 고려사항

### 인증

- JWT 토큰 기반 인증
- 사용자별 WebSocket 그룹 분리
- 권한 없는 사용자 접근 차단

### 데이터 검증

- 서버에서 모든 메시지 검증
- 클라이언트 입력 데이터 검증
- XSS 및 CSRF 방지
