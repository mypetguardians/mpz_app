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
import { useRouter } from "next/navigation";

interface CenterDetailHeaderProps {
  centerName: string;
  centerId: string;
  verified: boolean;
  centerDescription?: string | null;
  centerImageUrl?: string | null;
  centerRegion?: string | null;
  isKakaoLoaded?: boolean;
  isKakaoInitialized?: boolean;
}

export function CenterDetailHeader({
  centerName,
  centerId,
  verified,
  centerDescription, // eslint-disable-line @typescript-eslint/no-unused-vars
  centerImageUrl,
  centerRegion, // eslint-disable-line @typescript-eslint/no-unused-vars
  isKakaoLoaded,
  isKakaoInitialized,
}: CenterDetailHeaderProps) {
  const router = useRouter();
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

  const handleFavoriteClick = () => {
    if (isCheckingFavorite || toggleCenterFavorite.isPending) return;
    toggleCenterFavorite.mutate({ centerId });
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  // 뒤로가기 핸들러
  const handleBackClick = () => {
    if (typeof window === "undefined") {
      router.back();
      return;
    }

    const storedParams = sessionStorage.getItem("centerListSearchParams");
    const fallbackPath = "/list/center";

    // 이전 히스토리가 리스트 페이지가 아니면 저장된 검색 파라미터 기반으로 이동
    if (storedParams !== null) {
      router.push(`${fallbackPath}${storedParams}`);
      return;
    }

    router.back();
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
      window.Kakao.Share
    ) {
      try {
        const centerUrl = `https://mpz.kr/list/center/${centerId}`;
        
        // 상세 정보가 포함된 공유 메시지
        const shareTitle = verified 
          ? `✅ 인증 ${centerName}`
          : centerName;
        
        const shareDescription = "유기동물 입양하기! 마펫쯔와 편하게";
        
        const shareImageUrl = centerImageUrl || `/img/op-image.png`;
        
        // sendDefault 메서드 사용 (더 상세한 정보 포함)
        const kakaoShare = window.Kakao.Share as {
          sendScrap?: (options: { requestUrl: string }) => void;
          sendDefault?: (options: {
            objectType: string;
            content: {
              title: string;
              description: string;
              imageUrl: string;
              link: {
                mobileWebUrl: string;
                webUrl: string;
              };
            };
            buttons: Array<{
              title: string;
              link: {
                mobileWebUrl: string;
                webUrl: string;
              };
            }>;
          }) => void;
        };
        
        if (kakaoShare.sendDefault) {
          kakaoShare.sendDefault({
            objectType: "feed",
            content: {
              title: shareTitle,
              description: shareDescription,
              imageUrl: shareImageUrl,
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
        } else if (kakaoShare.sendScrap) {
          // sendDefault가 없으면 sendScrap 사용 (fallback)
          kakaoShare.sendScrap({ requestUrl: centerUrl });
        }
        
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
          <h2 className="text-xl font-bold text-bk">
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
