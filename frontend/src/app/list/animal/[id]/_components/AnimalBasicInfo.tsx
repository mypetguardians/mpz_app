"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Chip } from "@/components/ui/Chip";
import {
  ArrowLeft,
  ArrowRight,
  GenderFemaleIcon,
  GenderMaleIcon,
} from "@phosphor-icons/react";

interface AnimalBasicInfoProps {
  protection_status: string;
  adoption_status: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number;
  color: string;
  breed: string;
  imageUrls: string[];
}

export default function AnimalBasicInfo({
  protection_status,
  adoption_status,
  name,
  isFemale,
  age,
  weight,
  color,
  breed,
  imageUrls,
}: AnimalBasicInfoProps) {
  // 유효한 이미지 URL만 필터링
  const validImageUrls = imageUrls.filter((url) => url && url.trim() !== "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 상태 정보 반환 (표시할 텍스트와 색상)
  const getStatusInfo = (
    protectionStatus?: string,
    adoptionStatus?: string
  ) => {
    // 보호 상태가 "안락사"나 "자연사"인 경우 우선 표시
    if (protectionStatus === "안락사" || protectionStatus === "자연사") {
      return {
        text: "🌈",
        colorClass: "bg-orange-100/10",
      };
    }

    // 보호 상태가 "반환"인 경우
    if (protectionStatus === "반환") {
      return {
        text: protectionStatus,
        colorClass: "bg-gr/10 text-gr",
      };
    }

    // 입양 상태에 따른 표시
    switch (adoptionStatus) {
      case "입양완료":
        return {
          text: adoptionStatus,
          colorClass: "bg-brand/10 text-brand",
        };
      case "입양진행중":
        return {
          text: adoptionStatus,
          colorClass: "bg-blue/10 text-blue",
        };
      case "입양불가":
        return {
          text: adoptionStatus,
          colorClass: "bg-red-100/10 text-red-600",
        };
      case "입양가능":
      default:
        return {
          text: adoptionStatus || "입양가능",
          colorClass: "bg-green/10 text-green",
        };
    }
  };

  const nextImage = () => {
    if (validImageUrls.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === validImageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (validImageUrls.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImageUrls.length - 1 : prev - 1
    );
  };

  // 현재 이미지 URL (유효하지 않으면 기본 이미지 사용)
  const currentImageUrl =
    validImageUrls[currentImageIndex] || "/img/dummyImg.png";

  return (
    <div className="bg-white rounded-lg">
      {/* 이미지 섹션 */}
      <div className="relative w-full aspect-square bg-white overflow-hidden">
        <Image
          src={currentImageUrl}
          alt={`${name} - 이미지 ${currentImageIndex + 1}`}
          fill
          className="object-cover"
          unoptimized={currentImageUrl.includes("openapi.animal.go.kr")}
          onError={(e) => {
            console.warn("이미지 로딩 실패:", currentImageUrl);
            // 에러 시 기본 이미지로 대체
            e.currentTarget.src = "/img/dummyImg.png";
          }}
        />

        {/* 이미지 인디케이터 */}
        {validImageUrls.length > 0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 text-sm rounded-lg">
            {currentImageIndex + 1}/{validImageUrls.length}
          </div>
        )}

        {/* 이전/다음 버튼 */}
        {validImageUrls.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* 기본 정보 섹션 */}
      <div className="mx-4 py-4 border-b border-lg">
        <div className="flex items-center gap-2 mb-3">
          {(() => {
            const statusInfo = getStatusInfo(
              protection_status,
              adoption_status
            );
            return (
              <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
            );
          })()}
          <h3 className="text-bk">{breed}</h3>
          {isFemale ? (
            <span className="text-red">
              <GenderFemaleIcon size={16} weight="bold" />
            </span>
          ) : (
            <span className="text-brand">
              <GenderMaleIcon size={16} weight="bold" />
            </span>
          )}
        </div>
        <div className="flex items-center body2 text-dg gap-2">
          <span>{isFemale ? "암컷" : "수컷"} (중성화 완료)</span>
          <span className="text-gray-300">|</span>
          <span>{Math.trunc(age / 12)}살 추정</span>
          <span className="text-gray-300">|</span>
          <span>{weight}kg</span>
          <span className="text-gray-300">|</span>
          <span>{color}</span>
        </div>
      </div>
    </div>
  );
}
