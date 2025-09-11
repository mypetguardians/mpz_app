"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShareNetwork,
  Heart,
  SealCheck,
} from "@phosphor-icons/react";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useCheckCenterFavorite, useToggleCenterFavorite } from "@/hooks";
import { useKakaoSDK } from "@/hooks/useKakaoSDK";

interface CenterDetailHeaderProps {
  centerName: string;
  centerId: string;
  verified: boolean;
  isKakaoLoaded?: boolean;
  isKakaoInitialized?: boolean;
}

export function CenterDetailHeader({
  centerName,
  centerId,
  verified,
  isKakaoLoaded,
  isKakaoInitialized,
}: CenterDetailHeaderProps) {
  const { isLoaded: hookIsLoaded, isInitialized: hookIsInitialized } =
    useKakaoSDK();

  // props가 전달되면 사용하고, 아니면 훅에서 가져온 값 사용
  const isLoaded = isKakaoLoaded ?? hookIsLoaded;
  const isInitialized = isKakaoInitialized ?? hookIsInitialized;

  // 찜하기 상태 확인
  const { data: favoriteData, isLoading: isCheckingFavorite } =
    useCheckCenterFavorite(centerId);
  const isFavorite = favoriteData?.is_favorited || false;

  // 찜하기 토글 뮤테이션
  const toggleCenterFavorite = useToggleCenterFavorite();

  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleBackClick = () => {
    window.history.back();
  };

  const handleFavoriteClick = () => {
    if (isCheckingFavorite || toggleCenterFavorite.isPending) return;
    toggleCenterFavorite.mutate({ centerId });
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  // 카카오톡 공유 함수
  const handleKakaoShare = () => {
    if (!isLoaded || !isInitialized) {
      setShowToast(true);
      setToastMessage(
        "카카오톡을 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
      );
      setShowShareModal(false);
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.Kakao &&
      window.Kakao.Link &&
      window.Kakao.Link.sendDefault
    ) {
      try {
        const centerUrl = `${window.location.origin}/list/center/${centerId}`;

        window.Kakao.Link.sendDefault({
          objectType: "feed",
          content: {
            title: centerName || "보호센터 정보",
            description: "이 보호센터의 정보를 확인해보세요!",
            imageUrl: "",
            link: {
              mobileWebUrl: centerUrl,
              webUrl: centerUrl,
            },
          },
          buttons: [
            {
              title: "자세히 보기",
              link: {
                mobileWebUrl: centerUrl,
                webUrl: centerUrl,
              },
            },
          ],
        });
        setShowToast(true);
        setToastMessage("카카오톡으로 공유되었습니다!");
        setShowShareModal(false);
      } catch (error) {
        console.error("카카오톡 공유 실패:", error);
        setShowToast(true);
        setToastMessage("카카오톡 공유에 실패했습니다.");
        setShowShareModal(false);
      }
    } else {
      setShowToast(true);
      setToastMessage("카카오톡과 연결되어 있지 않습니다.");
      setShowShareModal(false);
    }
  };

  // 링크 복사 함수
  const handleCopyLink = () => {
    const centerUrl = `${window.location.origin}/list/center/${centerId}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(centerUrl)
        .then(() => {
          setToastMessage("링크가 복사되었습니다.");
          setShowToast(true);
          setShowShareModal(false);
        })
        .catch(() => {
          fallbackCopyTextToClipboard(centerUrl);
        });
    } else {
      fallbackCopyTextToClipboard(centerUrl);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      setToastMessage("링크가 복사되었습니다.");
      setShowToast(true);
      setShowShareModal(false);
    } catch (error) {
      setToastMessage("링크 복사에 실패했습니다.");
      setShowToast(true);
      console.error(error);
    }
    document.body.removeChild(textArea);
  };

  // 토스트 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const renderTopBar = () => (
    <TopBar
      variant="variant5"
      className="border-b border-lg"
      left={
        <div className="flex items-center gap-2">
          <IconButton
            icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
            size="iconM"
            onClick={handleBackClick}
          />
        </div>
      }
      center={<h4>자세히 보기</h4>}
      right={
        <div className="flex items-center gap-2">
          <IconButton
            icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
            size="iconM"
            onClick={handleShareClick}
          />
        </div>
      }
    />
  );

  const renderCenterInfo = () => (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <h2 className="text-bk text-xl font-bold">
            {centerName || "보호센터 정보 없음"}
          </h2>
          {verified && (
            <SealCheck size={14} className="text-brand-light" weight="fill" />
          )}
        </div>
        <MiniButton
          text="찜"
          variant="outline"
          leftIcon={
            <Heart
              className={cn("w-4 h-4", isFavorite && "fill-current text-brand")}
            />
          }
          onClick={handleFavoriteClick}
          className={cn(isFavorite && "text-brand border-brand")}
        />
      </div>
    </div>
  );

  return (
    <>
      {renderTopBar()}
      {renderCenterInfo()}

      {/* 공유 모달 */}
      <CustomModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="공유하기"
        variant="variant4"
        onKakaoShare={handleKakaoShare}
        onCopyLink={handleCopyLink}
      />

      {/* 토스트 */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </>
  );
}
