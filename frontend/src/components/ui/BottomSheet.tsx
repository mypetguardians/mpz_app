import React, { useEffect, useState } from "react";
import { BigButton } from "./BigButton";
import { IconButton } from "./IconButton";
import { X } from "@phosphor-icons/react";

interface BottomSheetProps<T = string> {
  open: boolean;
  onClose: () => void;
  variant:
    | "selectMenu"
    | "primary"
    | "variant7"
    | "variant5"
    | "variant6"
    | "variant10";
  children?: React.ReactNode;
  title?: string;
  description?: string;
  leftButtonText?: string;
  rightButtonText?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  onApply?: (selectedValue: T) => void;
  selectedValue?: T;
  showApplyButton?: boolean;
  applyButtonText?: string;
  tabs?: Array<{ label: string; value: string }>;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  // variant5 전용
  confirmButtonText?: string;
  onConfirm?: () => void;
  confirmButtonDisabled?: boolean;
}

export function BottomSheet<T = string>({
  open,
  onClose,
  variant,
  children,
  title,
  description,
  leftButtonText,
  rightButtonText,
  onLeftClick,
  onRightClick,
  onApply,
  selectedValue,
  showApplyButton = false,
  applyButtonText = "적용하기",
  tabs = [],
  activeTab = "",
  onTabChange,
  confirmButtonText = "확인",
  onConfirm,
  confirmButtonDisabled = false,
}: BottomSheetProps<T>) {
  const [internalSelectedValue, setInternalSelectedValue] = useState<
    T | undefined
  >(selectedValue);

  useEffect(() => {
    setInternalSelectedValue(selectedValue);
  }, [selectedValue]);

  const handleApply = () => {
    if (onApply && internalSelectedValue !== undefined) {
      onApply(internalSelectedValue);
    }
    onClose();
  };

  if (!open) return null;

  const renderContent = () => {
    if (variant === "selectMenu") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1">{children}</div>

          {showApplyButton && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleApply}
                className="w-full bg-brand text-wh py-3 px-4 rounded-lg font-medium hover:bg-brand-op transition-colors"
              >
                {applyButtonText}
              </button>
            </div>
          )}
        </div>
      );
    }

    if (variant === "variant5") {
      return (
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4">
            {title && <h2 className="text-bk">{title}</h2>}
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconS"
              onClick={onClose}
              className="text-gr"
            />
          </div>

          {/* 서브 텍스트 */}
          {description && (
            <div className="px-4 -mt-2 mb-3">
              <p className="body text-dg">{description}</p>
            </div>
          )}

          {/* 콘텐츠 박스 */}
          <div className="px-4 mb-6">
            <div className="w-full min-h-[180px] rounded-xl bg-bg border border-gray-100 flex items-center justify-center text-center">
              {children}
            </div>
          </div>

          {/* 확인 버튼 */}
          <div className="px-4 pb-3.5">
            <BigButton
              variant="primary"
              onClick={onConfirm}
              disabled={confirmButtonDisabled}
              className="w-full"
            >
              {confirmButtonText}
            </BigButton>
          </div>
        </div>
      );
    }

    if (variant === "variant7") {
      return (
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4">
            {title && <h2 className="text-bk">{title}</h2>}
            <IconButton
              icon={({ size }) => <X size={size} weight="bold" />}
              size="iconS"
              onClick={onClose}
              className="text-gr"
            />
          </div>

          {/* 탭 */}
          {tabs.length > 0 && (
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === tab.value
                      ? "text-bk border-b-2 border-bk"
                      : "text-gr hover:text-dg"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* 컨텐츠 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
            {children}
          </div>
        </div>
      );
    }

    if (variant === "variant6") {
      return (
        <div className="py-3.5 px-4">
          {title && (
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-bk">{title}</h2>
              <IconButton
                icon={({ size }) => <X size={size} weight="bold" />}
                size="iconS"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              />
            </div>
          )}
          {description && <p className="body text-dg mb-4">{description}</p>}
          <div className="flex">
            <BigButton
              variant="primary"
              onClick={onRightClick}
              className="bg-brand flex-1 hover:bg-brand"
            >
              {rightButtonText}
            </BigButton>
          </div>
        </div>
      );
    }

    if (variant === "primary") {
      return (
        <div className="py-3.5 px-4">
          {title && (
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-bk">{title}</h2>
              <IconButton
                icon={({ size }) => <X size={size} weight="bold" />}
                size="iconS"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              />
            </div>
          )}
          {description && <p className="body text-dg mb-4">{description}</p>}
          <div className="flex gap-3">
            <BigButton
              variant="primary"
              onClick={onLeftClick}
              className="bg-bg text-dg flex-1 hover:bg-bg"
            >
              {leftButtonText}
            </BigButton>
            <BigButton
              variant="primary"
              onClick={onRightClick}
              className="bg-error flex-1 hover:bg-error"
            >
              {rightButtonText}
            </BigButton>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 transition-all">
      <div className="absolute inset-0" onClick={onClose} aria-label="닫기" />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-2xl py-3.5 px-4 shadow-xl animate-slideup">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />

        {renderContent()}
      </div>
      <style jsx global>{`
        @keyframes slideup {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        .animate-slideup {
          animation: slideup 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
