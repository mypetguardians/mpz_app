import React from "react";

import { Timer } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface WaitingStatusProps {
  waitingDays: number;
}

export default function WaitingStatus({ waitingDays }: WaitingStatusProps) {
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
