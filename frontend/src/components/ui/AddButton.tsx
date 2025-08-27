import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AddButtonProps {
  pressed?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function AddButton({
  pressed = false,
  onClick,
  className,
  children,
}: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-[15px] rounded-lg transition-all cursor-pointer",
        pressed
          ? "border border-dashed border-brand bg-brand/10 text-brand"
          : "border border-dashed border-lg bg-transparent text-gr",
        className
      )}
    >
      <Plus
        size={16}
        weight="regular"
        className={pressed ? "text-brand" : "text-gr"}
      />
      <h5 className={pressed ? "text-brand" : "text-gr"}>{children}</h5>
    </button>
  );
}
