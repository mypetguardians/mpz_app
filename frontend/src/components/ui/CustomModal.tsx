import React from "react";
import { X, Link } from "@phosphor-icons/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BigButton } from "./BigButton";
import { IconButton } from "./IconButton";
import { MiniButton } from "./MiniButton";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  subText?: string;
  variant?: "variant1" | "variant2" | "variant3" | "variant4";
  // variant1: 양쪽 버튼
  leftButtonText?: string;
  rightButtonText?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  // variant2: 카카오 로그인
  ctaText?: string;
  onCtaClick?: () => void;
  // variant3: 카카오 공유 + 링크 복사
  subLinkText?: React.ReactNode;
  onSubLinkClick?: () => void;
  // variant4: 공유 모달
  onKakaoShare?: () => void;
  onCopyLink?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function CustomModal({
  open,
  onClose,
  title,
  description,
  variant = "variant1",
  leftButtonText,
  rightButtonText,
  onLeftClick,
  onRightClick,
  ctaText,
  onCtaClick,
  subText,
  subLinkText,
  onSubLinkClick,
  onKakaoShare,
  onCopyLink,
  children,
  className,
}: CustomModalProps) {
  if (!open) return null;

  // variant1: 양쪽 버튼
  const renderVariant1 = () => (
    <div className="flex gap-3">
      {leftButtonText && (
        <BigButton
          variant="primary"
          onClick={onLeftClick}
          className="bg-bg text-dg flex-1 hover:bg-bg"
        >
          {leftButtonText}
        </BigButton>
      )}
      {rightButtonText && (
        <BigButton
          variant="primary"
          onClick={onRightClick}
          className="bg-brand flex-1 hover:bg-brand"
        >
          {rightButtonText}
        </BigButton>
      )}
    </div>
  );

  // variant2: 카카오 로그인
  const renderVariant2 = () => (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={() => {
          if (onCtaClick) {
            onCtaClick();
            return;
          }

          if (typeof window === "undefined") {
            return;
          }

          const next =
            window.location.pathname +
            (window.location.search || "") +
            (window.location.hash || "");

          document.cookie = `redirect_after_login=${encodeURIComponent(
            next
          )}; path=/; max-age=600`;

          window.location.href = `/login?redirect=${encodeURIComponent(next)}`;
        }}
        className="relative w-full bg-[#FEE404] text-black mt-2 py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="absolute left-0 top-0 bottom-0 w-12 rounded-l-lg flex items-center justify-center">
          <Image src="/img/kakaoLogo.svg" alt="Kakao" width={20} height={20} />
        </span>
        <span className="pl-6">{ctaText || "카카오톡으로 로그인하기"}</span>
      </button>
    </div>
  );

  // variant3: 카카오 공유 + 링크 복사
  const renderVariant3 = () => (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={onCtaClick}
        className="relative w-full bg-[#FEE404] text-black py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="absolute left-0 top-0 bottom-0 w-12 rounded-l-lg flex items-center justify-center">
          <Image src="/img/kakaoLogo.svg" alt="Kakao" width={20} height={20} />
        </span>
        <span className="pl-6">카카오톡 공유하기</span>
      </button>
      <MiniButton
        text={
          <span className="flex items-center gap-1">
            <Link size={16} />
            {subLinkText || "링크 복사하기"}
          </span>
        }
        variant="primary"
        onClick={onSubLinkClick}
        className="mt-3 text-gray-600 text-sm hover:text-gray-800 transition-colors text-left"
      />
    </div>
  );

  // variant4: 공유 모달
  const renderVariant4 = () => (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={onKakaoShare}
        className="relative w-full bg-[#FEE404] text-black py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="absolute left-0 top-0 bottom-0 w-12 rounded-l-lg flex items-center justify-center">
          <Image src="/img/kakaoLogo.svg" alt="Kakao" width={20} height={20} />
        </span>
        <span className="pl-6">카카오톡 공유하기</span>
      </button>
      <MiniButton
        text={
          <span className="flex items-center gap-1">
            <Link size={16} />
            링크 복사하기
          </span>
        }
        variant="primary"
        onClick={onCopyLink}
        className="mt-3 text-gray-600 text-sm hover:text-gray-800 transition-colors text-left"
      />
    </div>
  );

  // variant에 따른 렌더링 함수 선택
  const renderContent = () => {
    switch (variant) {
      case "variant1":
        return renderVariant1();
      case "variant2":
        return renderVariant2();
      case "variant3":
        return renderVariant3();
      case "variant4":
        return renderVariant4();
      default:
        return renderVariant1();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 transition-all" role="dialog" aria-modal="true" aria-label={title || "모달"}>
      <div className="absolute inset-0" onClick={onClose} aria-label="닫기" />
      <div
        className={cn(
          "relative w-full max-w-[298px] bg-white rounded-2xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        <div className="py-4 px-5">
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
            <p className="text-sm text-dg mb-2 whitespace-pre-line">
              {description}
            </p>
          )}
          {subText && (
            <p className="text-sm text-gray-500 mt-1 mb-4">{subText}</p>
          )}
          {!subText && description && <div className="mb-2" />}
          {children && <div className="mb-4">{children}</div>}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
