"use client";
import React from "react";
import { X } from "@phosphor-icons/react";
import { MiniButton } from "./MiniButton";
import clsx from "clsx";

export type FilterChipProps = {
  label: string;
  onRemove: () => void;
  className?: string;
};

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  return (
    <div className={clsx("inline-flex items-center gap-1", className)}>
      <MiniButton
        onClick={onRemove}
        className="ml-1"
        text={label}
        rightIcon={<X size={14} weight="bold" />}
        variant="outline"
      />
    </div>
  );
}
