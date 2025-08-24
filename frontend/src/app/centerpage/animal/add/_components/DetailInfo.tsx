import { useState } from "react";

import { InfoCard } from "@/components/ui/InfoCard";
import { SelectButton } from "@/components/ui/SelectButton";

interface PersonalityData {
  activity: number;
  sensitivity: number;
  sociability: number;
  separationAnxiety: number;
}

interface DetailInfoData {
  personality: PersonalityData;
  trainerComment: string;
}

interface DetailInfoProps {
  data: DetailInfoData;
  onChange: (data: Partial<DetailInfoData>) => void;
}

export default function DetailInfo({ data, onChange }: DetailInfoProps) {
  const handleSelection = (category: keyof PersonalityData, value: number) => {
    onChange({
      personality: {
        ...data.personality,
        [category]: value,
      },
    });
  };

  const renderRatingButtons = (
    category: keyof PersonalityData,
    label: string
  ) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="h5 text-dg">{label}</label>
      <div className="grid grid-cols-5 gap-2 w-full">
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectButton
            key={value}
            variant="1"
            selected={data.personality[category] === value}
            onClick={() => handleSelection(category, value)}
            className="w-full h-12 flex items-center justify-center text-sm font-medium"
          >
            {value}
          </SelectButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full px-4 gap-4 pb-4">
      <h4 className="text-left">상세 성격 정보</h4>
      <InfoCard>
        매칭과정에서 사용될 정보로, 꼼꼼히 적어주시면 입양 확률이 높아질
        가능성이 있어요!
      </InfoCard>

      <div className="flex flex-col gap-6">
        {renderRatingButtons("activity", "활동량")}
        {renderRatingButtons("sensitivity", "민감도")}
        {renderRatingButtons("sociability", "사회성")}
        {renderRatingButtons("separationAnxiety", "분리불안")}
      </div>
      <div className="flex flex-col gap-2 w-full">
        <h5 className="text-dg">훈련사 한마디</h5>
        <textarea
          placeholder="자유롭게 작성해주세요."
          value={data.trainerComment}
          onChange={(e) => onChange({ trainerComment: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
        />
      </div>
    </div>
  );
}
