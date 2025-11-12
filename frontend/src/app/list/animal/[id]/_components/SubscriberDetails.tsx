"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DotsIndicator } from "@/components/ui/DotsIndicator";

interface SubscriberDetailsProps {
  activityLevel?: number;
  sensitivity?: number;
  sociability?: number;
  separationAnxiety?: number;
  basicTraining?: string;
  trainerName?: string;
  trainerComment?: string;
  className?: string;
}

// 이름 마스킹 함수 (앞 두 글자만 보여주고 나머지는 oo로 처리)
const maskName = (name: string | null | undefined): string => {
  if (!name || name.length <= 2) {
    return name || "";
  }
  return name.substring(0, 2) + "oo";
};

export default function SubscriberDetails({
  activityLevel = 0,
  sensitivity = 0,
  sociability = 0,
  separationAnxiety = 0,
  trainerName,
  trainerComment,
  className,
}: SubscriberDetailsProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-4 mx-4 mb-4 border border-lg ",
        className
      )}
    >
      {/* 전문가 의견 */}
      <div className="pb-3 mb-3 border-b border-bg">
        <h4 className="mb-3 text-bk">전문가 의견 보기</h4>
        <div className="grid grid-cols-2 gap-y-2 gap-x-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">활동량</span>
            <DotsIndicator
              count={activityLevel}
              color="bg-brand"
              variant="variant2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">민감도</span>
            <DotsIndicator
              count={sensitivity}
              color="bg-yellow"
              variant="variant2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">사회성</span>
            <DotsIndicator
              count={sociability}
              color="bg-green"
              variant="variant2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">분리불안</span>
            <DotsIndicator
              count={separationAnxiety}
              color="bg-green"
              variant="variant2"
            />
          </div>
        </div>
      </div>

      {/* 훈련사 한 마디 */}
      <div className="mb-3">
        <h5 className="mb-1 text-gr">전문가 한 마디</h5>

        {trainerComment ? (
          <p className="text-sm leading-relaxed text-gray-700">
            {trainerComment}
          </p>
        ) : (
          <p className="text-sm text-gray-700">내용이 없습니다.</p>
        )}
        {trainerName && (
          <p className="mb-2 text-sm text-gray-600">
            <span className="font-medium">훈련사:</span> {maskName(trainerName)}
          </p>
        )}
      </div>
    </div>
  );
}
