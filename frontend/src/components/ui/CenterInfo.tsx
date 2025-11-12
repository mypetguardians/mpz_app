"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, SealCheck } from "@phosphor-icons/react";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { cn } from "@/lib/utils";
import { MiniButton } from "./MiniButton";
import { useCheckCenterFavorite, useToggleCenterFavorite } from "@/hooks";

interface CenterInfoProps {
  variant: "primary" | "subscriber";
  centerId: string;
  name: string;
  location?: string;
  phoneNumber: string;
  adoptionProcedure?: string;
  isVerified?: boolean;
  className?: string;
  isAuthenticated?: boolean;
  onShowLoginModal?: () => void;
  imageUrl?: string | null;
}

export function CenterInfo({
  variant,
  centerId,
  name,
  location,
  phoneNumber,
  adoptionProcedure,
  isVerified = false,
  className,
  isAuthenticated = true,
  onShowLoginModal,
  imageUrl,
}: CenterInfoProps) {
  const router = useRouter();

  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "success"
  );

  const trimmedLocation = location?.trim() ?? "";
  const displayLocation = trimmedLocation.length > 0 ? trimmedLocation : "-";
  const trimmedPhoneNumber = phoneNumber?.trim() ?? "";
  const displayPhoneNumber =
    trimmedPhoneNumber.length > 0 ? trimmedPhoneNumber : "-";
  const trimmedAdoptionProcedure = adoptionProcedure?.trim() ?? "";
  const displayAdoptionProcedure =
    trimmedAdoptionProcedure.length > 0 ? trimmedAdoptionProcedure : "-";

  // 찜 상태 확인
  const { data: favoriteData, isLoading: isCheckingFavorite } =
    useCheckCenterFavorite(centerId);
  const isFavorite = favoriteData?.is_favorited || false;

  // 찜 토글 뮤테이션
  const toggleCenterFavorite = useToggleCenterFavorite();

  // 찜 토글 핸들러
  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      onShowLoginModal?.();
      return;
    }

    toggleCenterFavorite.mutate(
      { centerId },
      {
        onSuccess: () => {
          setToastType("success");
          setToastMessage("센터를 찜했습니다 !");
          setShowToast(true);
        },
        onError: () => {
          setToastType("error");
          setToastMessage("센터 찜을 실패했습니다.");
          setShowToast(true);
        },
      }
    );
  };

  // 센터 프로필 클릭 핸들러
  const handleCenterProfileClick = () => {
    router.push(`/list/center/${centerId}`);
  };

  return (
    <div
      className={cn(
        "bg-white mx-4", //border, py XXXX
        className
      )}
    >
      {/* Profile Section */}
      <div className="flex items-center justify-between pt-5 pb-3">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleCenterProfileClick}
        >
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 relative overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${name} 센터 이미지`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            {variant === "subscriber" && isVerified && (
              <SealCheck className="w-4 h-4 text-brand-light" weight="fill" />
            )}
          </div>
        </div>
        <MiniButton
          text="찜"
          variant="outline"
          leftIcon={
            <Heart
              className={cn("w-4 h-4", isFavorite && "fill-current text-brand")}
            />
          }
          onClick={handleFavoriteToggle}
          className={cn(isFavorite && "text-brand border-brand")}
          disabled={isCheckingFavorite || toggleCenterFavorite.isPending}
        />
      </div>

      {/* Information Fields */}
      <table className="w-full">
        <tbody className="space-y-1">
          <tr>
            <td className="text-gr h5 py-1 pr-3 align-top w-20">위치</td>
            <td className="text-sm py-1">
              <div>{displayLocation}</div>
            </td>
          </tr>
          <tr>
            <td className="text-gr h5 py-1 pr-3 align-top w-20">전화번호</td>
            <td className="text-sm py-1">
              <div>{displayPhoneNumber}</div>
            </td>
          </tr>

          {variant === "subscriber" ? (
            <tr>
              <td className="text-gr h5 py-1 pr-3 align-top w-20">입양 절차</td>
              <td className="text-sm py-1">
                <div className="leading-relaxed">
                  {displayAdoptionProcedure}
                </div>
              </td>
            </tr>
          ) : (
            <tr>
              <td className="text-gr h5 py-1 pr-3 align-top w-20">입양 절차</td>
              <td className="text-sm py-1">
                <div className="leading-relaxed">-</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
