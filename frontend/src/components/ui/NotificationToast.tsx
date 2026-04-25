import * as React from "react";
import { CheckCircle, XCircle, X, Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationToastProps {
  message: string;
  type: "success" | "error" | "push";
  onClose: () => void;
  duration?: number;
  className?: string;
}

export function NotificationToast({
  message,
  type,
  onClose,
  duration = 3000,
  className,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // 마운트 직후 애니메이션 시작
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 퇴장 애니메이션 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon =
    type === "push" ? (
      <Bell size={20} weight="fill" className="text-brand flex-shrink-0" />
    ) : type === "success" ? (
      <CheckCircle size={20} className="text-brand flex-shrink-0" />
    ) : (
      <XCircle size={20} className="text-red flex-shrink-0" />
    );

  const borderColor = type === "error" ? "border-red" : "border-brand";
  const textColor = type === "error" ? "text-red" : "text-dg";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed left-1/2 transform -translate-x-1/2 z-[9999]",
        "flex items-center px-4 py-3 rounded-lg shadow-md shadow-black/15",
        "border max-w-sm w-[calc(100%-32px)]",
        "bg-white",
        borderColor,
        textColor,
        "transition-all duration-300 ease-out",
        isVisible
          ? "top-[env(safe-area-inset-top,16px)] mt-4 opacity-100"
          : "-top-20 opacity-0",
        className
      )}
    >
      <div className="mr-3">{icon}</div>
      <span className="flex-1 text-sm font-medium line-clamp-2">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gr hover:text-dg transition-colors ml-2 flex-shrink-0"
        aria-label="알림 닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
}
