import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  variant?: "primary" | "pressed";
  title: string;
  message?: string;
  date: string;
  type?: "입양" | "임시보호" | "모니터링" | "커뮤니티";
}

function NotificationCard({
  variant = "primary",
  title,
  message,
  date,
  type,
}: NotificationCardProps) {
  const isPressed = variant === "pressed";
  const isTemporary = title === "임시보호";

  // type에 따른 벨 색상 결정
  const getBellColor = () => {
    if (type === "입양" && "임시보호") return "text-green";
    if (type === "모니터링") return "text-red";
    if (type === "커뮤니티") return "text-yellow";
    // 기본값 (type이 없거나 기존 로직)
    return isTemporary ? "text-red" : "text-green";
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
          <h6 className="text-dg">{title}</h6>
          <h6 className="text-bk">{message}</h6>
          <h6 className="text-gr mt-1">{date}</h6>
        </div>
      </div>
    </div>
  );
}

export { NotificationCard };
