import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  variant?: "primary" | "pressed";
  title: string;
  message?: string;
  date: string;
  type?: string;
  isRead?: boolean;
}

// 시간 계산 유틸 함수
const getTimeAgo = (dateString: string): string => {
  const createdAt = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "방금 전";
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  }
};

function NotificationCard({
  variant = "primary",
  title,
  date,
  type,
  isRead = true,
}: NotificationCardProps) {
  const isPressed = variant === "pressed";

  // 알림 타입을 한글로 변환하는 함수
  // TODO 알림 타입 재정리 필요 - 백엔드
  const getNotificationTypeText = (type: string): string => {
    if (type?.includes("monitoring")) {
      return "모니터링";
    }
    if (type?.includes("adoption")) {
      return "입양 상태 업데이트";
    }
    if (
      type?.includes("comment") ||
      type?.includes("reply") ||
      type?.includes("community")
    ) {
      return "커뮤니티";
    }
    if (type?.includes("protection")) {
      return "임시보호";
    }
    return type || "알림";
  };

  // type에 따른 벨 색상 결정
  const getBellColor = () => {
    console.log("NotificationCard type:", type); // 디버깅용
    if (type?.includes("monitoring")) return "text-red";
    if (
      type?.includes("comment") ||
      type?.includes("reply") ||
      type?.includes("community")
    )
      return "text-yellow";
    // 기본값 (type이 없거나 기존 로직)
    return "text-green";
  };

  return (
    <div
      className={cn(
        "flex gap-2 items-start w-full",
        isPressed ? "bg-white shadow-md" : "bg-transparent"
      )}
      style={{
        width: isPressed ? 480 : "auto",
        backgroundColor:
          isRead === false ? "rgba(0, 44, 222, 0.04)" : "transparent",
      }}
    >
      <div className="flex flex-col gap-1 p-4">
        <div className="flex gap-2">
          <Bell className={cn("mt-1", getBellColor())} size={16} />
          <div className="flex flex-col">
            <h6 className="text-dg">{getNotificationTypeText(type || "")}</h6>
            <h6 className="text-bk">{title}</h6>
            <h6 className="text-gr mt-1">{getTimeAgo(date)}</h6>
          </div>
        </div>
      </div>
    </div>
  );
}

export { NotificationCard };
