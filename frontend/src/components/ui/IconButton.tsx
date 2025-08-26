import { cn } from "@/lib/utils";

interface IconButtonProps {
  icon: React.ComponentType<{
    size?: number | string;
    className?: string;
  }>;
  size?: "iconM" | "iconS" | "imgM";
  label?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const sizeMap = {
  iconM: 20,
  iconS: 16,
  imgM: 24,
};

export function IconButton({
  icon: Icon,
  size = "iconM",
  label,
  className,
  onClick,
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full focus:outline-none transition-all cursor-pointer text-gr",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={label}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={sizeMap[size]} className="" />
    </button>
  );
}
