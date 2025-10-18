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
  const handlePersonalitySelection = (category: keyof PersonalityData, value: number) => {
    onChange({
      personality: {
        ...data.personality,
        [category]: value,
      },
    });
  };

  const handleSocialitySelection = (category: keyof SocialityData, value: number) => {
    onChange({
      sociality: {
        ...data.sociality,
        [category]: value,
      },
    });
  };

  const handleSeparationAnxietySelection = (category: keyof SeparationAnxietyDetailData, value: number) => {
    onChange({
      separationAnxietyDetail: {
        ...data.separationAnxietyDetail,
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

  const renderSocialityButtons = (
    category: keyof SocialityData,
    label: string
  ) => (
    <div className="flex flex-col w-full gap-2">
      <label className="h5 text-dg">{label}</label>
      <div className="grid w-full grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectButton
            key={value}
            variant="1"
            selected={data.sociality[category] === value}
            onClick={() => handleSocialitySelection(category, value)}
            className="flex items-center justify-center w-full h-12 text-sm font-medium"
          >
            {value}
          </SelectButton>
        ))}
      </div>
    </div>
  );

  const renderSeparationAnxietyButtons = (
    category: keyof SeparationAnxietyDetailData,
    label: string
  ) => (
    <div className="flex flex-col w-full gap-2">
      <label className="h5 text-dg">{label}</label>
      <div className="grid w-full grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectButton
            key={value}
            variant="1"
            selected={data.separationAnxietyDetail[category] === value}
            onClick={() => handleSeparationAnxietySelection(category, value)}
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
      <h4 className="text-left">상세 성격 정보</h4>
      <InfoCard>
        매칭과정에서 사용될 정보로, 꼼꼼히 적어주시면 입양 확률이 높아질
        가능성이 있어요!
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

          {/* 사회성 세부 항목 */}
          <div className="flex flex-col gap-6">
            <h6 className="font-medium text-dg">사회성 세부 항목</h6>
            {renderSocialityButtons("confidence", "새로운 자극/상황 적극성")}
            {renderSocialityButtons("independence", "독립성 있는 행동")}
            {renderSocialityButtons("physicalContact", "사람 터치 긍정적 수용")}
            {renderSocialityButtons("handlingAcceptance", "몸 만지기 저항감")}
            {renderSocialityButtons("strangersAttitude", "낯선 사람 반응")}
            {renderSocialityButtons("objectsAttitude", "낯선 사물 반응")}
            {renderSocialityButtons("environmentAttitude", "낯선 환경 반응")}
            {renderSocialityButtons("dogsAttitude", "낯선 강아지 반응")}
          </div>

          {/* 분리불안 세부 항목 */}
          <div className="flex flex-col gap-6">
            <h6 className="font-medium text-dg">분리불안 세부 항목</h6>
            {renderSeparationAnxietyButtons("copingAbility", "낯선 공간 혼자 남겨졌을 때 반응")}
            {renderSeparationAnxietyButtons("playfulnessLevel", "장난감/바디시그널 놀이 유도 반응")}
            {renderSeparationAnxietyButtons("walkabilityLevel", "산책 과정에서 모습")}
            {renderSeparationAnxietyButtons("groomingAcceptanceLevel", "그루밍 진행 시 모습")}
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
