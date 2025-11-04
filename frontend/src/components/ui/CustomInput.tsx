import * as React from "react";
import { cn } from "@/lib/utils";
import { CaretDown, DotsThree } from "@phosphor-icons/react";
import { SelectButton } from "./SelectButton";
import { DropdownBottomSheet } from "./DropdownBottomSheet";

const inputBaseClass =
  "w-full min-w-0 rounded-md border border-lg bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body" +
  " focus-visible:outline-none focus-visible:border-brand disabled:cursor-not-allowed disabled:bg-bg";

const variantMap: Record<string, string> = {
  primary: "",
  text: "",
  tagdropdown: "",
  Variant5: "",
  Variant7: "",
  Variant8: "",
  Variant9: "",
};

export interface InputProps {
  className?: string;
  type?: string;
  placeholder?: string;
  error?: boolean;
  variant?:
    | "primary"
    | "text"
    | "tagdropdown"
    | "bottomsheet"
    | "Variant5"
    | "Variant7"
    | "Variant8"
    | "Variant9";
  label?: string;
  required?: boolean;
  id?: string;
  time?: string;
  action?: React.ReactNode;
  // tagdropdown 전용
  options?: string[];
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onChangeOption?: (value: string) => void;
  // Variant7 전용
  twoOptions?: [string, string]; // 2지선다 옵션
  // SelectedButton 전용
  selectedButtonVariant?: "1" | "2" | "3" | "4" | "5" | "6";
  selectedButtonIcon?: React.ReactNode;
  dotThree?: boolean;
  onDotThreeClick?: () => void;
  // textarea 전용
  multiline?: boolean;
  rows?: number;
  // 공통 HTML 속성
  disabled?: boolean;
  maxLength?: number;
  readOnly?: boolean;
  inputMode?:
    | "search"
    | "text"
    | "numeric"
    | "email"
    | "tel"
    | "url"
    | "none"
    | "decimal";
  onClick?: () => void;
  name?: string;
  autoComplete?: string;
}

export function CustomInput({
  className,
  type = "text",
  placeholder,
  error = false,
  variant = "primary",
  label,
  required = false,
  id,
  time,
  action,
  options = [],
  value = "",
  onChange,
  onChangeOption,
  twoOptions = ["옵션1", "옵션2"],
  selectedButtonVariant = "1",
  selectedButtonIcon,
  dotThree = false,
  onDotThreeClick,
  multiline = false,
  rows = 4,
  disabled,
  maxLength,
  readOnly,
  inputMode,
  onClick,
  name,
  autoComplete,
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  // 드롭다운 상태 관리
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 선택 처리 함수 - 최대한 단순하게
  const handleSelect = (selectedValue: string) => {
    setIsOpen(false); // 먼저 닫고
    onChangeOption?.(selectedValue); // 그 다음 값 변경
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderLabelAndDotThree = () => (
    <div className="w-full flex items-center justify-between">
      {label && (
        <h5 className={cn("text-dg", error && "text-error")}>
          {label}
          {required && <span className="text-brand ml-1">*</span>}
        </h5>
      )}
      {dotThree && (
        <div className="relative">
          <DotsThree
            className="w-6 h-6 flex items-center justify-center text-gr cursor-pointer"
            onClick={onDotThreeClick}
          />
        </div>
      )}
    </div>
  );

  // Variant7: SelectedButton 형태
  if (variant === "Variant7") {
    return (
      <div className="flex flex-col w-full">
        {renderLabelAndDotThree()}
        <div className="flex gap-2">
          {twoOptions.map((option, index) => (
            <SelectButton
              key={index}
              variant={selectedButtonVariant}
              selected={value === option}
              onClick={() => onChangeOption?.(option)}
              className="flex-1"
              icon={selectedButtonIcon}
            >
              <span className="flex items-center justify-center">{option}</span>
            </SelectButton>
          ))}
        </div>
        {(time || action) && (
          <div className="flex justify-between items-center">
            {time && <h6 className="text-gr">{time}</h6>}
            {action && <h6 className="text-gr">{action}</h6>}
          </div>
        )}
      </div>
    );
  }

  // tagdropdown만 커스텀 드롭다운으로 분기
  if (variant === "tagdropdown") {
    return (
      <div className="flex flex-col gap-2 w-full relative" ref={dropdownRef}>
        {renderLabelAndDotThree()}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              inputBaseClass,
              "flex items-center cursor-pointer pr-8",
              error && "border-destructive focus-visible:border-brand",
              disabled && "bg-bg cursor-not-allowed",
              className
            )}
          >
            <span className={cn(value ? "text-bk" : "text-gr")}>
              {value || placeholder || "선택"}
            </span>
          </button>
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
            <CaretDown
              size={18}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          </span>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto scrollbar-hide">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChangeOption?.(opt);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-lg focus:bg-lg focus:outline-none"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        {(time || action) && (
          <div className="flex justify-between items-center">
            {time && <h6 className="text-gr">{time}</h6>}
            {action && <h6 className="text-gr">{action}</h6>}
          </div>
        )}
      </div>
    );
  }

  // bottomsheet variant - BottomSheet를 사용한 선택
  if (variant === "bottomsheet") {
    return (
      <div className="flex flex-col gap-2 w-full">
        {renderLabelAndDotThree()}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              inputBaseClass,
              "flex items-center cursor-pointer pr-8",
              error && "border-destructive focus-visible:border-brand",
              disabled && "bg-bg cursor-not-allowed",
              className
            )}
          >
            <span className={cn(value ? "text-bk" : "text-gr")}>
              {value || placeholder || "선택"}
            </span>
          </button>
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
            <CaretDown
              size={18}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          </span>
        </div>
        {(time || action) && (
          <div className="flex justify-between items-center">
            {time && <h6 className="text-gr">{time}</h6>}
            {action && <h6 className="text-gr">{action}</h6>}
          </div>
        )}

        <DropdownBottomSheet
          open={isOpen}
          onClose={handleClose}
          options={options}
          selectedValue={value}
          onSelect={handleSelect}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {renderLabelAndDotThree()}
      {multiline ? (
        <textarea
          id={inputId}
          placeholder={placeholder}
          aria-invalid={error}
          value={value}
          onChange={onChange}
          rows={rows}
          className={cn(
            inputBaseClass,
            "resize-none min-h-[100px]",
            error && "border-red focus-visible:border-brand",
            variantMap[variant],
            className
          )}
          disabled={disabled}
          maxLength={maxLength}
          readOnly={readOnly}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          aria-invalid={error}
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          readOnly={readOnly}
          inputMode={inputMode}
          onClick={onClick}
          name={name}
          autoComplete={autoComplete}
          className={cn(
            inputBaseClass,
            error && "border-red focus-visible:border-brand",
            variantMap[variant],
            className
          )}
        />
      )}
      {(time || action) && (
        <div className="flex justify-between items-center">
          {time && (
            <span className="text-sm text-muted-foreground">{time}</span>
          )}
          {action && (
            <span className="text-sm text-muted-foreground">{action}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { CustomInput as Input };
