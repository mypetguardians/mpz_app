import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "@/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 이미지 URL을 완전한 URL로 변환합니다
 * @param imageUrl 이미지 URL (상대 경로 또는 절대 경로)
 * @returns 완전한 이미지 URL
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === "") {
    return "/img/dummyImg.png"; // 기본 이미지
  }

  // 이미 완전한 URL인 경우 (http:// 또는 https://)
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // 로컬 이미지인 경우 (/ 로 시작)
  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  // 상대 경로인 경우 베이스 URL 추가
  return `${config.images.baseUrl}${imageUrl}`;
}

/**
 * 날짜를 "N일전", "N시간전" 등의 상대적 시간으로 변환
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "방금 전";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}주 전`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years}년 전`;
  }
}

/**
 * 모니터링 남은 기간을 계산합니다
 * @param endDate 모니터링 종료 날짜 (ISO 문자열)
 * @returns 남은 기간을 나타내는 문자열 (예: "3개월 1주")
 */
export function calculateRemainingMonitoringPeriod(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);

  if (end <= now) {
    return "모니터링 완료";
  }

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const weeks = Math.floor((diffDays % 30) / 7);
  const days = diffDays % 7;

  let result = "";

  if (months > 0) {
    result += `${months}개월`;
  }

  if (weeks > 0) {
    if (result) result += " ";
    result += `${weeks}주`;
  }

  if (days > 0 && months === 0 && weeks === 0) {
    if (result) result += " ";
    result += `${days}일`;
  }

  return result;
}

/**
 * 모니터링 남은 횟수를 계산합니다
 * @param totalChecks 전체 모니터링 횟수
 * @param completedChecks 완료된 모니터링 횟수
 * @returns 남은 모니터링 횟수
 */
export function calculateRemainingMonitoringChecks(
  totalChecks: number,
  completedChecks: number
): number {
  return Math.max(0, totalChecks - completedChecks);
}

/**
 * 모니터링 총 기간을 계산합니다
 * @param startDate 모니터링 시작 날짜 (ISO 문자열)
 * @param endDate 모니터링 종료 날짜 (ISO 문자열)
 * @returns 총 모니터링 기간을 나타내는 문자열 (예: "3개월")
 */
export function calculateTotalMonitoringPeriod(
  startDate: string,
  endDate: string
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return "기간 정보 없음";
  }

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const weeks = Math.floor((diffDays % 30) / 7);

  let result = "";

  if (months > 0) {
    result += `${months}개월`;
  }

  if (weeks > 0) {
    if (result) result += " ";
    result += `${weeks}주`;
  }

  if (months === 0 && weeks === 0) {
    result = `${diffDays}일`;
  }

  return result;
}

/**
 * 다음 모니터링까지 남은 일수를 계산합니다
 * @param nextCheckDate 다음 모니터링 날짜 (ISO 문자열)
 * @returns 남은 일수 (음수인 경우 0 반환)
 */
export function calculateDaysUntilNextMonitoring(
  nextCheckDate: string
): number {
  const now = new Date();
  const nextCheck = new Date(nextCheckDate);

  const diffTime = nextCheck.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
