"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { AddButton } from "@/components/ui/AddButton";
import { InfoCard } from "@/components/ui/InfoCard";
import {
  useGetQuestionForms,
  useGetCenterProcedureSettings,
  useCreateCenterProcedureSettings,
  useUpdateCenterProcedureSettings,
} from "@/hooks";

export default function CenterProcess() {
  const router = useRouter();
  const [isMonitoring, setIsMonitoring] = useState("");
  const [period, setPeriod] = useState("");
  const [adoptionProcedure, setAdoptionProcedure] = useState("");
  const [adoptionContractTemplate, setAdoptionContractTemplate] = useState("");
  const [adoptionGuidelines, setAdoptionGuidelines] = useState("");
  const [monitoringDescription, setMonitoringDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 입양 신청서 데이터
  const { data: questionFormsData, isLoading: isLoadingQuestions } =
    useGetQuestionForms();

  // 센터 프로시저 설정 데이터
  const { data: procedureSettings, isLoading: isLoadingSettings } =
    useGetCenterProcedureSettings();

  // 센터 프로시저 설정 생성/수정
  const createSettings = useCreateCenterProcedureSettings();
  const updateSettings = useUpdateCenterProcedureSettings();

  // 기존 설정이 있으면 폼에 로드
  useEffect(() => {
    if (procedureSettings) {
      setIsMonitoring(
        procedureSettings.hasMonitoring ? "모니터링 필수" : "모니터링 안 함"
      );
      setPeriod(
        procedureSettings.monitoringPeriodMonths
          ? `${procedureSettings.monitoringPeriodMonths}개월`
          : ""
      );
      setAdoptionProcedure(procedureSettings.adoptionProcedure || "");
      setAdoptionGuidelines(procedureSettings.adoptionGuidelines || "");
      setMonitoringDescription(procedureSettings.monitoringDescription || "");
      setAdoptionContractTemplate(
        procedureSettings.contractTemplates.length > 0
          ? "계약서 템플릿 있음"
          : "계약서 템플릿 없음"
      );
    }
  }, [procedureSettings]);

  const handleBack = () => {
    router.back();
  };

  // 저장하기 함수
  const handleSave = async () => {
    if (!isMonitoring || !period) {
      alert("모니터링 설정을 완료해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const monitoringPeriodMonths = parseInt(period.replace("개월", ""));
      const hasMonitoring = isMonitoring === "모니터링 필수";

      const settingsData = {
        hasMonitoring,
        monitoringPeriodMonths,
        monitoringIntervalDays: 14, // 기본값 14일
        monitoringDescription,
        adoptionGuidelines,
        adoptionProcedure,
      };

      if (procedureSettings) {
        // 기존 설정이 있으면 수정
        await updateSettings.mutateAsync(settingsData);
      } else {
        // 기존 설정이 없으면 생성
        await createSettings.mutateAsync(settingsData);
      }

      alert("프로시저 설정이 저장되었습니다.");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen relative">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>입양 절차 관리</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col pb-[100px] px-4 gap-6 min-h-[100px]">
        <div className="w-full flex flex-col gap-4">
          <div className="w-full flex flex-col gap-3">
            <h5 className="text-dg">입양 신청서</h5>
            {isLoadingQuestions ? (
              <Input
                variant="text"
                placeholder="질문 폼을 불러오는 중..."
                disabled={true}
                className="text-gr"
              />
            ) : questionFormsData?.questions &&
              questionFormsData.questions.length > 0 ? (
              <div className="w-full flex flex-col">
                {questionFormsData.questions
                  .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                  .map((question, index) => (
                    <Input
                      key={question.id}
                      variant="text"
                      placeholder={`질문${index + 1}`}
                      value={question.question}
                      disabled={true}
                    />
                  ))}
              </div>
            ) : (
              <Input
                variant="text"
                placeholder="등록된 질문이 없습니다"
                disabled={true}
                className="text-gr"
              />
            )}
            <Link href="/centerpage/process/customform">
              <AddButton>
                {isLoadingQuestions
                  ? "로딩 중..."
                  : questionFormsData?.questions &&
                    questionFormsData.questions.length > 0
                  ? "입양 신청서 수정하기"
                  : "입양 신청서 만들기"}
              </AddButton>
            </Link>
          </div>
          <div className="w-full flex flex-col gap-3">
            <h5 className="text-dg">입양 유의사항</h5>
            <Input
              variant="text"
              placeholder="입양 유의사항을 입력해주세요"
              value={adoptionGuidelines}
              onChange={(e) => setAdoptionGuidelines(e.target.value)}
            />
            <Link href="/centerpage/process/create-consent">
              <AddButton>유의사항 동의서 만들기</AddButton>
            </Link>
          </div>
          <div className="w-full flex flex-col gap-3">
            <h5 className="text-dg">입양 계약서</h5>
            {isLoadingSettings ? (
              <Input
                variant="text"
                placeholder="계약서 템플릿을 불러오는 중..."
                disabled={true}
                className="text-gr"
              />
            ) : procedureSettings?.contractTemplates &&
              procedureSettings.contractTemplates.length > 0 ? (
              <div className="w-full flex flex-col">
                {procedureSettings.contractTemplates.map((template, index) => (
                  <Input
                    key={template.id}
                    variant="text"
                    placeholder={`계약서${index + 1}`}
                    value={template.title}
                    className="cursor-pointer hover:bg-gray-50 rounded-md transition-colors read-only"
                    onClick={() =>
                      router.push(
                        `/centerpage/process/edit-contract/${template.id}`
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <Input
                variant="text"
                placeholder="등록된 계약서 템플릿이 없습니다"
                disabled={true}
                className="text-gr"
              />
            )}
            <Link href="/centerpage/process/create-contract">
              <AddButton>계약서 만들기</AddButton>
            </Link>
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex flex-col gap-1">
            <h5 className="text-dg">입양 절차</h5>
            <textarea
              placeholder="해당 보호센터만의 입양 절차를 입력해주세요."
              value={adoptionProcedure}
              onChange={(e) => setAdoptionProcedure(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
            />
          </div>
          <InfoCard>
            마펫쯔에서는 입양 신청서 작성 - 대면미팅 - 입양 계약서 작성 -
            모니터링 절차를 제공합니다.
          </InfoCard>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Input
            label="사후 모니터링 여부"
            variant="Variant7"
            value={isMonitoring}
            onChangeOption={setIsMonitoring}
            twoOptions={["모니터링 필수", "모니터링 안 함"]}
            required={true}
          />
          <Input
            variant="bottomsheet"
            label="상태"
            placeholder="모니터링 기간을 입력해주세요"
            options={[
              "1개월",
              "2개월",
              "3개월",
              "4개월",
              "5개월",
              "6개월",
              "7개월",
              "8개월",
              "9개월",
              "10개월",
              "11개월",
              "12개월",
            ]}
            value={period}
            onChangeOption={setPeriod}
            required={true}
          />
          <div className="w-full flex flex-col gap-1">
            <h5 className="text-dg">모니터링 설명</h5>
            <textarea
              placeholder="모니터링에 대한 설명을 입력해주세요."
              value={monitoringDescription}
              onChange={(e) => setMonitoringDescription(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[100px] focus:outline-none"
            />
          </div>
          <InfoCard>
            모니터링은 14일에 한 번 진행되며, 1개월 ~ 1년까지 기간을 설정할 수
            있어요.
          </InfoCard>
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton
          className="w-full"
          onClick={handleSave}
          disabled={isLoading || isLoadingSettings}
        >
          {isLoading ? "저장 중..." : "저장하기"}
        </BigButton>
      </div>
    </Container>
  );
}
