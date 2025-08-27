import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MiniButtonProps {
  text: React.ReactNode;
  variant?: "primary" | "outline" | "filterOff" | "filterOn";
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const variantClass = {
  primary: "bg-wh text-dg border-0 shadow-none",
  outline: "bg-transparent text-dg border border-lg",
  filterOff: "bg-transparent text-gr border border-lg",
  filterOn: "bg-transparent text-brand border border-brand",
};

export function MiniButton({
  text,
  variant = "primary",
  className,
  leftIcon,
  rightIcon,
  onClick,
  disabled,
}: MiniButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center text-h6b justify-center rounded-full py-[6px] px-3 transition-all duration-150 min-w-0 h-auto cursor-pointer",
        variantClass[variant],
        className
      )}
    >
      {leftIcon && <span className="flex items-center mr-1">{leftIcon}</span>}
      {text}
      {rightIcon && <span className="flex items-center ml-1">{rightIcon}</span>}
    </Button>
  );
}
