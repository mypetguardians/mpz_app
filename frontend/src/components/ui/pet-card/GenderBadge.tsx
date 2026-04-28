import { GenderMale, GenderFemale } from "@phosphor-icons/react";

interface GenderBadgeProps {
  isFemale: boolean;
  size?: "sm" | "md";
}

export function GenderBadge({ isFemale, size = "md" }: GenderBadgeProps) {
  const containerClass = size === "sm"
    ? "w-5 h-5 top-1 right-1"
    : "w-6 h-6 top-2 right-2";
  const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;

  return (
    <div className={`absolute z-10 flex items-center justify-center rounded-full shadow-sm bg-white/90 ${containerClass}`}>
      {isFemale ? (
        <GenderFemale className="text-red" weight="bold" size={iconSize} />
      ) : (
        <GenderMale className="text-brand" weight="bold" size={iconSize} />
      )}
    </div>
  );
}
