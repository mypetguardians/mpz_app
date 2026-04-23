"use client";

import { useState } from "react";
import { InfoCard } from "@/components/ui/InfoCard";
import { SelectButton } from "@/components/ui/SelectButton";
import { CaretDown, CaretRight } from "@phosphor-icons/react";

interface PersonalityData {
  activity: number;
  sensitivity: number;
  sociability: number;
  separationAnxiety: number;
}

interface SocialityData {
  confidence: number;
  independence: number;
  physicalContact: number;
  handlingAcceptance: number;
  strangersAttitude: number;
  objectsAttitude: number;
  environmentAttitude: number;
  dogsAttitude: number;
}

interface SeparationAnxietyDetailData {
  copingAbility: number;
  playfulnessLevel: number;
  walkabilityLevel: number;
  groomingAcceptanceLevel: number;
}

interface DetailInfoData {
  personality: PersonalityData;
  sociality: SocialityData;
  separationAnxietyDetail: SeparationAnxietyDetailData;
  trainerComment: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DetailInfoProps {
  data: DetailInfoData;
  onChange: (data: Partial<DetailInfoData>) => void;
  canEdit?: boolean;
}

// 날짜 포맷팅 함수
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "미기입";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "미기입";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch {
    return "미기입";
  }
};

export default function DetailInfo({
  data,
  onChange,
  canEdit = true,
}: DetailInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePersonalitySelection = (
    category: keyof PersonalityData,
    value: number
  ) => {
    if (!canEdit) return;

    const now = new Date().toISOString();
    onChange({
      personality: {
        ...data.personality,
        [category]: value,
      },
      updatedAt: now,
      ...(data.createdAt ? {} : { createdAt: now }),
    });
  };

  const renderPersonalityButtons = (
    category: keyof PersonalityData,
    label: string
  ) => (
    <div className="flex flex-col w-full gap-2">
      <label className="h5 text-dg">{label}</label>
      <div className="grid w-full grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectButton
            key={value}
            variant="1"
            selected={data.personality[category] === value}
            onClick={() => handlePersonalitySelection(category, value)}
            disabled={!canEdit}
            className="flex items-center justify-center w-full h-12 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {value}
          </SelectButton>
        ))}
      </div>
    </div>
  );

  // const handleTrainerCommentChange = (value: string) => {
  //   if (!canEdit) return;
  //   const now = new Date().toISOString();
  //   onChange({
  //     trainerComment: value,
  //     updatedAt: now,
  //     ...(data.createdAt ? {} : { createdAt: now }),
  //   });
  // };

  return (
    <div className="flex flex-col w-full gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <h4 className="text-left">상세 성향 정보</h4>
        {!canEdit && (
          <span className="text-xs text-gr bg-bg px-2 py-1 rounded">
            읽기 전용
          </span>
        )}
      </div>
      <InfoCard>
        반려동물 추천에서 사용되는 정보로, 성향 분석표를 기반으로 작성하는
        항목
        {!canEdit && (
          <div className="mt-2 text-xs text-error font-medium">
            ⚠️ 비전문가는 수정할 수 없습니다.
          </div>
        )}
      </InfoCard>

      {/* 작성 일시 표시 */}
      {(data.createdAt || data.updatedAt) && (
        <div className="flex items-center gap-2 text-xs text-gr">
          <span>
            {data.createdAt && `작성일: ${formatDateTime(data.createdAt)}`}
            {data.createdAt &&
              data.updatedAt &&
              data.createdAt !== data.updatedAt &&
              " | "}
            {data.updatedAt &&
              data.createdAt !== data.updatedAt &&
              `수정일: ${formatDateTime(data.updatedAt)}`}
          </span>
        </div>
      )}

      {/* 전체 토글 버튼 */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex items-center gap-2 text-left"
      >
        {isExpanded ? (
          <CaretDown size={20} className="text-dg" />
        ) : (
          <CaretRight size={20} className="text-dg" />
        )}
        <h5 className="text-dg">상세 성격 평가 항목</h5>
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-6 pl-6">
          {/* 기본 성격 지표 */}
          <div className="flex flex-col gap-6">
            <h6 className="font-medium text-dg">기본 성격 지표</h6>
            {renderPersonalityButtons("activity", "활동량")}
            {renderPersonalityButtons("sensitivity", "민감도")}
            {renderPersonalityButtons("sociability", "사회성")}
            {renderPersonalityButtons("separationAnxiety", "분리불안")}
          </div>
        </div>
      )}
      {/* <div className="flex flex-col w-full gap-2">
        <h5 className="text-dg">전문가 한 마디</h5>
        <textarea
          placeholder="아이에 대해 덧붙이고 싶은 사항이 있다면 자유롭게 작성해주세요."
          value={data.trainerComment}
          onChange={(e) => handleTrainerCommentChange(e.target.value)}
          disabled={!canEdit}
          className="flex w-full rounded-md border border-lg bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
        />
      </div> */}
    </div>
  );
}
