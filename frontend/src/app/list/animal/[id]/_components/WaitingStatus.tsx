import React from "react";

import { Timer } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface WaitingStatusProps {
  admissionDate: string;
}

export default function WaitingStatus({ admissionDate }: WaitingStatusProps) {
  const calculateWaitingDays = (admissionDateStr: string): number => {
    // admissionDate가 유효하지 않은 경우 처리
    if (
      !admissionDateStr ||
      admissionDateStr === "undefined" ||
      admissionDateStr === "null"
    ) {
      console.warn("Invalid admissionDate:", admissionDateStr);
      return 0;
    }

    const admission = new Date(admissionDateStr);

    // 날짜가 유효하지 않은 경우 처리
    if (isNaN(admission.getTime())) {
      console.warn("Invalid date format:", admissionDateStr);
      return 0;
    }

    const today = new Date();

    // 시간을 제거하고 날짜만 비교
    const admissionDateOnly = new Date(
      admission.getFullYear(),
      admission.getMonth(),
      admission.getDate()
    );
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffTime = todayDateOnly.getTime() - admissionDateOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // 음수가 나오지 않도록 보장
  };

  const waitingDays = calculateWaitingDays(admissionDate);

  const getWaitingDaysIconColor = (days: number) => {
    if (days <= 21) {
      return "text-green";
    } else {
      return "text-[#FF814F]";
    }
  };

  return (
    <div className="bg-bg rounded-lg mx-2 my-3 p-2">
      <div className="flex items-center justify-center gap-1">
        <Timer
          className={cn("w-4 h-4", getWaitingDaysIconColor(waitingDays))}
        />
        <span className={cn("body2 text-bk")}>
          {waitingDays}일 째 기다리는 중
        </span>
      </div>
    </div>
  );
}
