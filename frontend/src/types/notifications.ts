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
  metadata: string | null;
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
