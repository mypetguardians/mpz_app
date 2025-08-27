import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  variant?: "primary" | "pressed";
  title: string;
  message?: string;
  date: string;
  type?: string;
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
}: NotificationCardProps) {
  const isPressed = variant === "pressed";

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
        "flex gap-2 m-2 items-start",
        isPressed ? "bg-white rounded-2xl shadow-md" : "bg-transparent p-0"
      )}
      style={{ width: isPressed ? 480 : "auto" }}
    >
      <Bell className={cn("mt-1", getBellColor())} size={16} />
      <div className="flex flex-col gap-1">
        <div className="flex flex-col">
          <h6 className="text-dg">{type}</h6>
          <h6 className="text-bk">{title}</h6>
          <h6 className="text-gr mt-1">{getTimeAgo(date)}</h6>
        </div>
      </div>
    </div>
  );
}

export { NotificationCard };
