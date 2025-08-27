"use client";

import { ArrowLeft, ShareNetwork, Heart } from "@phosphor-icons/react";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { cn } from "@/lib/utils";

interface CenterDetailHeaderProps {
  centerName: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  isToggleLoading?: boolean;
}

export function CenterDetailHeader({
  centerName,
  isFavorite,
  onFavoriteToggle,
  isToggleLoading = false,
}: CenterDetailHeaderProps) {
  const handleBackClick = () => {
    window.history.back();
  };

  const handleFavoriteClick = () => {
    if (isToggleLoading) return;
    onFavoriteToggle();
  };

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
          />
        </div>
      }
    />
  );

  const renderCenterInfo = () => (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-bk text-xl font-bold">
          {centerName || "보호소 정보 없음"}
        </h2>
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
    </>
  );
}
