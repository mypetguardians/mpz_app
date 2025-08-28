"use client";

import React from "react";
import { Heart, SealCheck } from "@phosphor-icons/react";
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
}: CenterInfoProps) {
  // 찜 상태 확인
  const { data: favoriteData, isLoading: isCheckingFavorite } =
    useCheckCenterFavorite(centerId);
  const isFavorite = favoriteData?.isFavorited || false;

  // 찜 토글 뮤테이션
  const toggleCenterFavorite = useToggleCenterFavorite();

  // 찜 토글 핸들러
  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      onShowLoginModal?.();
      return;
    }

    toggleCenterFavorite.mutate({ centerId });
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
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
          {variant === "primary" && location && (
            <tr>
              <td className="text-gr h5 py-1 pr-3 align-top w-20">위치</td>
              <td className="text-sm py-1">
                <div>{location}</div>
              </td>
            </tr>
          )}

          <tr>
            <td className="text-gr h5 py-1 pr-3 align-top w-20">전화번호</td>
            <td className="text-sm py-1">
              <div>{phoneNumber}</div>
            </td>
          </tr>

          {variant === "subscriber" && adoptionProcedure && (
            <tr>
              <td className="text-gr h5 py-1 pr-3 align-top w-20">입양 절차</td>
              <td className="text-sm py-1">
                <div className="leading-relaxed">{adoptionProcedure}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
