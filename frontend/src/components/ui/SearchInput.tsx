import { MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SearchInputVariant = "primary" | "variant2" | "variant3" | "variant4";

interface SearchInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  variant?: SearchInputVariant;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "품종으로 검색해보세요.",
  variant = "primary",
  className,
}: SearchInputProps) {
  const isPrimaryGroup = variant === "primary" || variant === "variant2";

  // variant에 따른 border-radius 설정
  const getBorderRadius = () => {
    if (variant === "primary" || variant === "variant4") {
      return "rounded-[12px]"; // 12px
    } else {
      return "rounded-[8px]"; // 8px (variant2, variant3)
    }
  };

  const containerStyle = cn(
    "flex items-center w-full max-w-[400px] bg-bg px-4 h-[44px]",
    getBorderRadius(),
    className
  );

  const textColor = isPrimaryGroup ? "text-gr" : "text-bk";

  return (
    <div
      className={containerStyle}
      onClick={onSearch}
      style={{ cursor: "pointer" }}
    >
      <input
        className={cn(
          "flex-1 outline-none bg-transparent text-body cursor-pointer",
          `placeholder:${textColor}`
        )}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
        readOnly
      />
      <button
        type="button"
        className={cn(
          "ml-1 p-1 rounded-full flex items-center justify-center",
          textColor
        )}
        onClick={onSearch}
        tabIndex={-1}
      >
        <MagnifyingGlass size={16} weight="bold" />
      </button>
    </div>
  );
}
