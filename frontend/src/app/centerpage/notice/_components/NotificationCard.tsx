import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  variant?: "primary" | "pressed";
  title: string;
  message?: string;
  date: string;
  id?: string;
  onClick?: () => void;
}

function NotificationCard({
  variant = "primary",
  title,
  message,
  date,
  onClick,
}: NotificationCardProps) {
  const isPressed = variant === "pressed";
  const isTemporary = title === "임시보호";

  return (
    <div
      className={cn(
        "flex gap-3 py-[10px] px-2 m-2 items-start cursor-pointer",
        isPressed ? "bg-white rounded-2xl shadow-md" : "bg-transparent p-0"
      )}
      style={{ width: isPressed ? 480 : "auto" }}
      onClick={onClick}
    >
      <Bell
        className={cn("mt-1", isTemporary ? "text-red-500" : "text-green")}
        size={16}
      />
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
