// Service Worker for Web Push Notifications

// Service Worker 설치
self.addEventListener("install", () => {
  console.log("Service Worker 설치됨");
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("Service Worker 활성화됨");
  event.waitUntil(self.clients.claim());
});

// 푸시 메시지 수신
self.addEventListener("push", (event) => {
  console.log("푸시 메시지 수신:", event);

  let notificationData = {
    title: "새 알림",
    body: "새로운 알림이 도착했습니다.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "notification",
    data: {
      url: "/notifications",
    },
  };

  // 푸시 데이터가 있는 경우 파싱
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        tag: data.notification_type || notificationData.tag,
        data: {
          url: data.action_url || "/notifications",
          notificationId: data.id,
        },
      };
    } catch (error) {
      console.error("푸시 데이터 파싱 오류:", error);
    }
  }

  // 알림 표시
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "확인",
          icon: "/favicon.ico",
        },
        {
          action: "close",
          title: "닫기",
        },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("알림 클릭됨:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // 알림 데이터에서 URL 가져오기
  const urlToOpen = event.notification.data?.url || "/notifications";

  // 클라이언트 창 열기 또는 포커스
  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList) => {
      // 이미 열린 탭이 있는지 확인
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (
          client.url.includes(new URL(urlToOpen, self.location.origin).pathname)
        ) {
          return client.focus();
        }
      }

      // 새 탭에서 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// 백그라운드 동기화 (옵션)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("백그라운드 동기화 실행");
    // 백그라운드에서 알림 동기화 로직
  }
});

// 메시지 수신 (클라이언트에서 Service Worker로 메시지)
self.addEventListener("message", (event) => {
  console.log("Service Worker 메시지 수신:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
