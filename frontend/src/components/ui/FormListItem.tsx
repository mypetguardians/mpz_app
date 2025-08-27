import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";

export interface FormListItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  leftIcon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export const FormListItem = React.forwardRef<
  HTMLButtonElement,
  FormListItemProps
>(
  (
    { className, selected = false, leftIcon, right, children, ...props },
    ref
  ) => {
    const baseClass =
      "w-full flex items-center gap-2 rounded-[8px] border p-3 transition-colors cursor-pointer focus:outline-none min-h-12";
    const inactiveClass = "bg-white border-lg text-dg";
    const activeClass = "bg-brand-op/4 border-brand text-dg";
    const iconColorClass = selected ? "text-brand" : "text-gr";

    return (
      <button
        ref={ref}
        className={cn(
          baseClass,
          selected ? activeClass : inactiveClass,
          className
        )}
        {...props}
      >
        <span className={cn("flex items-center", !leftIcon && iconColorClass)}>
          {leftIcon ?? <Check size={16} className={iconColorClass} />}
        </span>
        <span className="flex-1 h5 text-dg text-left">{children}</span>
        {right && <span className="ml-2 flex items-center">{right}</span>}
      </button>
    );
  }
);
FormListItem.displayName = "FormListItem";

export default FormListItem;
