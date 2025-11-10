export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: Record<string, unknown> | string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: Notification[];
}

export interface CenterNotice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export interface CenterNoticesResponse {
  notices: CenterNotice[];
  total: number;
}

// 알림 생성 요청 타입
export interface CreateNotificationRequest {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority?: "normal" | "high" | "low";
  action_url?: string;
  send_push?: boolean;
}

// 푸시 토큰 관련 타입
export type Platform = "android" | "ios" | "web";

export interface PushTokenRequest {
  token: string;
  platform: Platform;
}

export interface DeletePushTokenRequest {
  platform: Platform;
}

export interface PushTokenResponse {
  message: string;
}
