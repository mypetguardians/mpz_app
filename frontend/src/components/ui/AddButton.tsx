import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AddButtonProps {
  pressed?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function AddButton({
  pressed = false,
  onClick,
  className,
  children,
  disabled = false,
}: AddButtonProps) {
  const isPressed = !disabled && pressed;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-[15px] rounded-lg transition-all",
        disabled
          ? "border border-dashed border-lg bg-gray-100 text-gr/60 cursor-not-allowed opacity-70"
          : isPressed
          ? "border border-dashed border-brand bg-brand/10 text-brand cursor-pointer"
          : "border border-dashed border-lg bg-transparent text-gr cursor-pointer",
        className
      )}
    >
      <Plus
        size={16}
        weight="regular"
        className={
          disabled ? "text-gr/60" : isPressed ? "text-brand" : "text-gr"
        }
      />
      <h5
        className={
          disabled ? "text-gr/60" : isPressed ? "text-brand" : "text-gr"
        }
      >
        {children}
      </h5>
    </button>
  );
}
