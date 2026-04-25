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
  // selectMenu 전용: 옵션 리스트 직접 렌더링
  options?: Array<T>;
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
  options = [],
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
  const [keyboardInset, setKeyboardInset] = useState(0);
  const baseBottomPadding = "calc(env(safe-area-inset-bottom, 0px) + 16px)";

  useEffect(() => {
    setInternalSelectedValue(selectedValue);
  }, [selectedValue]);

  // Android(특히 삼성 브라우저/크롬)에서 키보드가 올라올 때
  // visualViewport를 사용해 바텀시트 하단 패딩을 동적으로 늘려
  // 콘텐츠가 키보드 위로 겹쳐지도록 처리
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv: VisualViewport | undefined = window.visualViewport as
      | VisualViewport
      | undefined;
    if (!vv) return;

    const handleViewportChange = () => {
      // 키보드 높이 추정: 전체 창 높이 - 가시 영역 높이 - 오프셋
      const estimatedKeyboard = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      // iOS는 보통 0, Android에서만 값이 커짐
      setKeyboardInset(estimatedKeyboard);
    };

    handleViewportChange();
    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

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
          {/* 헤더 */}
          {(title || description) && (
            <div className="px-4 pt-3 pb-1">
              {title && <h2 className="text-bk mb-1">{title}</h2>}
              {description && (
                <p className="body text-dg whitespace-pre-line">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* 옵션 리스트 또는 children */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            {Array.isArray(options) && options.length > 0 ? (
              <div className="flex flex-col">
                {options.map((opt, idx) => {
                  const isActive = internalSelectedValue === opt;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setInternalSelectedValue(opt)}
                      className={`w-full text-left px-3 h-[48px] rounded-lg body ${
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "text-bk hover:bg-gray-50"
                      }`}
                    >
                      {String(opt)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-2">{children}</div>
            )}
          </div>

          {/* 적용 버튼 */}
          {showApplyButton && (
            <div className="mt-2 pt-3 border-t border-gray-100 px-4 pb-2">
              <button
                onClick={handleApply}
                className="w-full bg-brand text-wh py-3 px-4 rounded-lg font-medium transition-colors"
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
              <p className="body text-dg whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* 콘텐츠 박스 */}
          <div className="px-4 mb-6">
            <div className="w-full min-h-[180px] rounded-xl flex items-center justify-center text-center">
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
          {description && (
            <p className="body text-dg mb-4 whitespace-pre-line">
              {description}
            </p>
          )}
          <div className="flex">
            <BigButton
              variant="primary"
              onClick={onRightClick}
              className="bg-brand flex-1"
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
          {description && (
            <p className="body text-dg mb-4 whitespace-pre-line">
              {description}
            </p>
          )}
          <div className="flex gap-3">
            <BigButton
              variant="variant3"
              onClick={onLeftClick}
              className="bg-bg text-dg flex-1 hover:bg-gray-50"
            >
              {leftButtonText}
            </BigButton>
            <BigButton
              variant="primary"
              onClick={onRightClick}
              className="bg-error flex-1 hover:bg-error/70"
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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 transition-all" role="dialog" aria-modal="true" aria-label={title || "바텀시트"}>
      <div className="absolute inset-0" onClick={onClose} aria-label="닫기" />
      <div
        className="relative w-full max-w-[420px] bg-white rounded-t-2xl py-3.5 px-4 shadow-xl animate-slideup"
        style={{
          paddingBottom:
            keyboardInset > 0 ? keyboardInset + 16 : baseBottomPadding,
        }}
      >
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

// 한국 시/도 전체 리스트 (UI에서 바로 사용 가능)
export const KOREAN_REGIONS: string[] = [
  "전체",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];
