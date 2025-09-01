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
  tag: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number;
  color: string;
  breed: string;
  imageUrls: string[];
}

export default function AnimalBasicInfo({
  tag,
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

  // 상태에 따른 색상 클래스 반환
  const getStatusColorClass = (status?: string) => {
    switch (status) {
      case "자연사":
      case "안락사":
        return "bg-orange-100/10";
      case "입양대기":
      case "입양진행중":
      case "보호중":
        return "bg-green/10 text-green";
      case "입양완료":
        return "bg-brand/10 text-brand";
      case "임시보호중":
        return "bg-yellow/10 text-yellow";
      case "방사":
      case "반환":
        return "bg-gr/10 text-gr";
      default:
        return "bg-gray-300/10 text-gray-600";
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
          <Chip className={getStatusColorClass(tag)}>
            {[
              "보호중",
              "입양완료",
              "임시보호중",
              "입양대기",
              "입양진행중",
              "방사",
              "반환",
            ].includes(tag)
              ? tag
              : "🌈"}
          </Chip>
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
          {/* 중성화여부 하드코딩 */}
          <span>{isFemale ? "암컷" : "수컷"} (중성화 완료)</span>
          <span className="text-gray-300">|</span>
          <span>{age}살 추정</span>
          <span className="text-gray-300">|</span>
          <span>{weight}kg</span>
          <span className="text-gray-300">|</span>
          <span>{color}</span>
        </div>
      </div>
    </div>
  );
}
