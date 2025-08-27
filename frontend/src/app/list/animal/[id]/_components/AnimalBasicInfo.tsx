"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Chip } from "@/components/ui/Chip";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AnimalBasicInfoProps {
  tag: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number;
  color: string;
  imageUrls: string[];
}

export default function AnimalBasicInfo({
  tag,
  name,
  isFemale,
  age,
  weight,
  color,
  imageUrls,
}: AnimalBasicInfoProps) {
  // 유효한 이미지 URL만 필터링
  const validImageUrls = imageUrls.filter((url) => url && url.trim() !== "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    validImageUrls[currentImageIndex] || "/img/dummyImg.jpeg";

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
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* 기본 정보 섹션 */}
      <div className="mx-4 py-4 border-b border-lg">
        <div className="flex items-center gap-2 mb-3">
          <Chip className="bg-green/10 text-green">{tag}</Chip>
          <h3 className="text-bk">{name}</h3>
          {isFemale ? (
            <span className="text-red">♀</span>
          ) : (
            <span className="text-brand">♂</span>
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
