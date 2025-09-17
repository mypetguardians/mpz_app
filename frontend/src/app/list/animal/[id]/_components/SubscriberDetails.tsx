"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DotsIndicator } from "@/components/ui/DotsIndicator";

interface SubscriberDetailsProps {
  activityLevel?: number;
  sensitivity?: number;
  sociability?: number;
  separationAnxiety?: number;
  healthNotes?: string[];
  basicTraining?: string;
  trainerComment?: string;
  className?: string;
}

export default function SubscriberDetails({
  activityLevel = 0,
  sensitivity = 0,
  sociability = 0,
  separationAnxiety = 0,
  healthNotes = [],
  basicTraining,
  trainerComment,
  className,
}: SubscriberDetailsProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-4 mx-4 mb-4 border border-lg rounded-lg",
        className
      )}
    >
      {/* 전문가 의견 */}
      <div className="mb-3 border-b border-bg pb-3">
        <h4 className="text-bk mb-3">전문가 의견 보기</h4>
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

      {/* 건강 특이사항 */}
      <div className="mb-3">
        <h5 className="text-gr mb-1">건강 특이사항</h5>
        {healthNotes && healthNotes.length > 0 ? (
          <ul className="space-y-1">
            {healthNotes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 flex items-start"
              >
                <span className="text-gray-400 mr-2">•</span>
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-700">내용이 없습니다.</p>
        )}
      </div>

      {/* 기본 훈련 여부 */}
      <div className="mb-3">
        <h5 className="text-gr mb-1">기본 훈련 여부</h5>
        {basicTraining ? (
          <p className="text-sm text-gray-700">{basicTraining}</p>
        ) : (
          <p className="text-sm text-gray-700">내용이 없습니다.</p>
        )}
      </div>

      {/* 훈련사 한 마디 */}
      <div className="mb-3">
        <h5 className="text-gr mb-1">전문가 한 마디</h5>
        {trainerComment ? (
          <p className="text-sm text-gray-700 leading-relaxed">
            {trainerComment}
          </p>
        ) : (
          <p className="text-sm text-gray-700">내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
