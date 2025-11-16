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
}

interface DetailInfoProps {
  data: DetailInfoData;
  onChange: (data: Partial<DetailInfoData>) => void;
}

export default function DetailInfo({ data, onChange }: DetailInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  const handlePersonalitySelection = (
    category: keyof PersonalityData,
    value: number
  ) => {
    onChange({
      personality: {
        ...data.personality,
        [category]: value,
      },
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
            className="flex items-center justify-center w-full h-12 text-sm font-medium"
          >
            {value}
          </SelectButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full gap-4 px-4 pb-4">
      <h4 className="text-left">상세 성향 정보</h4>
      <InfoCard>
        반려동물 추천에서 사용될 정보로, 정확히 적어주시면 입양 확률이 높아질 수
        있어요!
      </InfoCard>

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
      <div className="flex flex-col w-full gap-2">
        <h5 className="text-dg">전문가 한 마디</h5>
        <textarea
          placeholder="아이에 대해 덧붙이고 싶은 사항이 있다면 자유롭게 작성해주세요."
          value={data.trainerComment}
          onChange={(e) => onChange({ trainerComment: e.target.value })}
          className="flex w-full rounded-md border border-lg bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
        />
      </div>
    </div>
  );
}
