import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "large" | "small";
  className?: string;
  children?: ReactNode;
}

const sectionTitleVariants = {
  default: "text-xl font-semibold text-gray-900",
  large: "text-2xl font-bold text-gray-900",
  small: "text-lg font-medium text-gray-900",
};

export function SectionTitle({
  title,
  subtitle,
  variant = "default",
  className,
  children,
}: SectionTitleProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h2 className={cn(sectionTitleVariants[variant], "mb-2")}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

// 섹션 헤더 컴포넌트 (타이틀 + 액션 버튼)
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "large" | "small";
  className?: string;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  variant = "default",
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h2 className={cn(sectionTitleVariants[variant], "mb-2")}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
} 