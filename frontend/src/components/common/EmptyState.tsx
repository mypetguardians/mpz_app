"use client";

import { cn } from "@/lib/utils";
import { type Icon } from "@phosphor-icons/react";

interface EmptyStateProps {
  icon?: Icon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center px-6",
        className
      )}
    >
      {IconComponent && (
        <IconComponent size={48} weight="light" className="text-lg mb-4" />
      )}
      <p className="text-dg font-medium text-center">{title}</p>
      {description && (
        <p className="text-gr text-sm text-center mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
