import * as React from "react";
import { cn } from "@/lib/utils";

import { Container } from "../common/Container";
import { BigButton } from "./BigButton";
import { IconButton } from "./IconButton";
import { MiniButton } from "./MiniButton";

export interface FixedBottomBarProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "variant1" | "variant2" | "variant3";
  // Variant 1 props (BigButton + IconButton)
  leftButtonText?: string;
  onLeftButtonClick?: () => void;
  leftButtonDisabled?: boolean;
  primaryButtonText?: string;
  primaryButtonLeft?: React.ReactNode;
  primaryButtonRight?: React.ReactNode;
  onPrimaryButtonClick?: () => void;
  primaryButtonDisabled?: boolean;
  // Variant 1 오른쪽 아이콘들 (IconButton)
  rightIcon1?: React.ReactNode;
  rightIcon2?: React.ReactNode;
  onRightIcon1Click?: () => void;
  onRightIcon2Click?: () => void;
  showDivider?: boolean;
  // Variant 2 props (MiniButton + BigButton)
  resetButtonText?: string;
  resetButtonLeft?: React.ReactNode;
  onResetButtonClick?: () => void;
  applyButtonText?: string;
  applyButtonLeft?: React.ReactNode;
  applyButtonRight?: React.ReactNode;
  onApplyButtonClick?: () => void;
  applyButtonDisabled?: boolean;
  // 공통 props
  showSafeArea?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function FixedBottomBar({
  children,
  className,
  variant = "variant1",
  // Variant 1 props
  leftButtonText,
  onLeftButtonClick,
  leftButtonDisabled = false,
  primaryButtonText = "입양 신청",
  primaryButtonLeft,
  primaryButtonRight,
  onPrimaryButtonClick,
  primaryButtonDisabled = false,
  rightIcon1,
  rightIcon2,
  onRightIcon1Click,
  onRightIcon2Click,
  showDivider = false,
  // Variant 2 props
  resetButtonText = "재설정",
  resetButtonLeft,
  onResetButtonClick,
  applyButtonText = "적용하기",
  applyButtonLeft,
  applyButtonRight,
  onApplyButtonClick,
  applyButtonDisabled = false,
  // 공통 props
  showSafeArea = true,
  padding = "md",
  ...props
}: FixedBottomBarProps) {
  const paddingClasses = {
    sm: "px-4 py-3",
    md: "px-6 py-4",
    lg: "px-8 py-6",
  };

  return (
    <Container
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200",
        paddingClasses[padding],
        showSafeArea && "pb-safe",
        className
      )}
      {...props}
    >
      {children && <div className="mb-4">{children}</div>}

      {variant === "variant1" ? (
        <div className="flex items-center gap-3">
          <BigButton
            variant="primary"
            left={primaryButtonLeft}
            right={primaryButtonRight}
            onClick={onPrimaryButtonClick}
            disabled={primaryButtonDisabled}
            className="flex-1 h-12"
          >
            {primaryButtonText}
          </BigButton>
          {rightIcon1 && (
            <IconButton
              icon={() => rightIcon1}
              size="iconM"
              onClick={onRightIcon1Click}
              className="text-gr"
            />
          )}
          {rightIcon2 && (
            <IconButton
              icon={() => rightIcon2}
              size="iconM"
              onClick={onRightIcon2Click}
              className="text-gr"
            />
          )}
        </div>
      ) : variant === "variant3" ? (
        <div className="flex items-center gap-3">
          {leftButtonText && (
            <BigButton
              variant="variant3"
              onClick={onLeftButtonClick}
              disabled={leftButtonDisabled}
              className="flex-1 h-12 bg-bg text-gr"
            >
              {leftButtonText}
            </BigButton>
          )}
          <BigButton
            variant="primary"
            left={primaryButtonLeft}
            right={primaryButtonRight}
            onClick={onPrimaryButtonClick}
            disabled={primaryButtonDisabled}
            className="flex-1 h-12"
          >
            {primaryButtonText}
          </BigButton>
          {showDivider && <div className="mx-1 h-6 w-px bg-gray-200" />}
          {rightIcon1 && (
            <IconButton
              icon={({ size, className }) =>
                React.cloneElement(rightIcon1 as React.ReactElement, {
                  size,
                  className: cn(className, "text-gr"),
                })
              }
              size="iconM"
              onClick={onRightIcon1Click}
              className="text-gr"
            />
          )}
          {rightIcon2 && (
            <IconButton
              icon={({ size, className }) =>
                React.cloneElement(rightIcon2 as React.ReactElement, {
                  size,
                  className: cn(className, "text-gr"),
                })
              }
              size="iconM"
              onClick={onRightIcon2Click}
              className="text-gr"
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <MiniButton
            text={resetButtonText}
            variant="primary"
            leftIcon={resetButtonLeft}
            onClick={onResetButtonClick}
          />

          <BigButton
            variant="primary"
            left={applyButtonLeft}
            right={applyButtonRight}
            onClick={onApplyButtonClick}
            disabled={applyButtonDisabled}
            className="flex-1 h-12"
          >
            {applyButtonText}
          </BigButton>
        </div>
      )}
    </Container>
  );
}
