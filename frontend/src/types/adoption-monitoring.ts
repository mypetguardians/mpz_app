export interface AdoptionMonitoringPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  animal_id: string;
  adoption_id: string;
  content_tags: Record<string, unknown>;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_image: string;
  tags: Array<{
    id: string;
    postId: string;
    tagName: string;
    createdAt: string;
  }>;
  images: Array<{
    id: string;
    postId: string;
    imageUrl: string;
    orderIndex: number;
    createdAt: string;
  }>;
}

export interface AdoptionMonitoringPostsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number | null;
  data: AdoptionMonitoringPost[];
}

// 모니터링 상태 관련 타입들

// 모니터링 상태 enum
export type MonitoringStatusEnum = "진행중" | "완료" | "지연" | "중단";

// 입양 상태 enum (adoption.ts에서 import)
import type { AdoptionStatus } from "./adoption";
export type AdoptionStatusEnum = AdoptionStatus;

// 체크 상태 enum
export type CheckStatusEnum = "정상" | "지연" | "미제출";

// 모니터링 진행률 타입
export interface MonitoringProgress {
  percentage: number;
  description: string;
}

// 센터 설정 타입
export interface CenterConfig {
  monitoringPeriodMonths: number;
  monitoringIntervalDays: number;
}

// 기간 타입
export interface Period {
  start: string;
  end: string;
}

// 최근 체크 정보 타입
export interface RecentCheck {
  checkSequence: number;
  checkDate: string;
  expectedCheckDate: string;
  period: Period;
  postsFound: number;
  status: CheckStatusEnum;
  delayDays: number;
  daysUntilDeadline: number | null;
  notes?: string;
}

// 모니터링 상태 응답 타입
export interface MonitoringStatusResponse {
  adoptionId: string;
  status: AdoptionStatusEnum;
  monitoringStatus?: MonitoringStatusEnum;
  monitoringStartedAt?: string;
  monitoringEndDate?: string;
  nextCheckDate?: string;
  daysUntilNextDeadline: number | null;
  daysUntilMonitoringEnd: number | null;
  completedChecks: number;
  totalChecks: number;
  totalMonitoringPosts: number;
  monitoringProgress: MonitoringProgress;
  centerConfig: CenterConfig;
  recentChecks: RecentCheck[];
}
