import * as React from "react";
import { CheckCircle, XCircle, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationToastProps {
  message: string;
  type: "success" | "error";
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
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon =
    type === "success" ? (
      <CheckCircle size={20} className="text-brand flex-shrink-0" />
    ) : (
      <XCircle size={20} className="text-red flex-shrink-0" />
    );

  const bgColor = type === "success" ? "bg-wh" : "bg-red";
  const borderColor = type === "success" ? "border-brand" : "border-red";
  const textColor = type === "success" ? "text-brand" : "text-red";

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[9999]",
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
        "border max-w-sm w-full mx-auto",
        bgColor,
        borderColor,
        textColor,
        className
      )}
    >
      {icon}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
