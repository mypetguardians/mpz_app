export interface AdoptionMonitoringPost {
  images: boolean;
  content: ReactNode;
  title: ReactNode;
  user_nickname: ReactNode;
  created_at: string | number | Date;
  id: string;
  post_id: string;
  post_title: string | null;
  post_content: string | null;
  post_created_at: string;
  monitoring_created_at: string;
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

import { ReactNode } from "react";
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
