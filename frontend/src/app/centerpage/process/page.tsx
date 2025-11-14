"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { AddButton } from "@/components/ui/AddButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { NotificationToast } from "@/components/ui/NotificationToast";
import {
  useGetQuestionForms,
  useGetCenterProcedureSettings,
  useCreateCenterProcedureSettings,
  useUpdateCenterProcedureSettings,
  useGetConsents,
} from "@/hooks";
import type { Consent } from "@/types";

export default function CenterProcess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMonitoring, setIsMonitoring] = useState("");
  const [period, setPeriod] = useState("");
  const [adoptionProcedure, setAdoptionProcedure] = useState("");
  const [adoptionGuidelines, setAdoptionGuidelines] = useState("");
  const [monitoringDescription, setMonitoringDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 토스트 상태
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // 입양 신청서 데이터
  const { data: questionFormsData, isLoading: isLoadingQuestions } =
    useGetQuestionForms();

  // 센터 프로시저 설정 데이터
  const { data: procedureSettings, isLoading: isLoadingSettings } =
    useGetCenterProcedureSettings();

  // 동의서 데이터
  const { data: consentsData, isLoading: isLoadingConsents } = useGetConsents();

  // 센터 프로시저 설정 생성/수정
  const createSettings = useCreateCenterProcedureSettings();
  const updateSettings = useUpdateCenterProcedureSettings();

  // 토스트 표시 함수
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const hasConsent =
    !!consentsData && Array.isArray(consentsData) && consentsData.length > 0;
  const hasContractTemplate =
    !!procedureSettings?.contract_templates &&
    procedureSettings.contract_templates.length > 0;
  // 계약서가 하나만 있는지 확인
  const hasExactlyOneContractTemplate =
    !!procedureSettings?.contract_templates &&
    procedureSettings.contract_templates.length === 1;

  // 전체 로딩 상태 (설정 로딩 또는 저장 중)
  const isOverallLoading = isLoadingSettings || isLoading;

  // 기존 설정이 있으면 폼에 로드
  useEffect(() => {
    if (procedureSettings) {
      setIsMonitoring(
        procedureSettings.has_monitoring ? "모니터링 필수" : "모니터링 안 함"
      );
      setPeriod(
        procedureSettings.monitoring_period_months
          ? `${procedureSettings.monitoring_period_months}개월`
          : ""
      );
      setAdoptionProcedure(procedureSettings.adoption_procedure || "");
      setAdoptionGuidelines(procedureSettings.adoption_guidelines || "");
      setMonitoringDescription(procedureSettings.monitoring_description || "");
    }
  }, [procedureSettings]);

  // 저장하기 함수
  const handleSave = async () => {
    if (!isMonitoring || !period) {
      showToast("모니터링 설정을 완료해주세요.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const monitoringPeriodMonths = parseInt(period.replace("개월", ""));
      const hasMonitoring = isMonitoring === "모니터링 필수";

      const settingsData = {
        has_monitoring: hasMonitoring,
        monitoring_period_months: monitoringPeriodMonths,
        monitoring_interval_days: 14, // 기본값 14일
        monitoring_description: monitoringDescription,
        adoption_guidelines: adoptionGuidelines,
        adoption_procedure: adoptionProcedure,
      };

      if (procedureSettings) {
        // 기존 설정이 있으면 수정
        await updateSettings.mutateAsync(settingsData);
      } else {
        // 기존 설정이 없으면 생성
        await createSettings.mutateAsync(settingsData);
      }

      // 쿼리 무효화 - 센터 프로시저 설정과 관련된 모든 쿼리 새로고침
      queryClient.invalidateQueries({
        queryKey: ["center-procedure-settings"],
      });
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      queryClient.invalidateQueries({ queryKey: ["question-forms"] });

      showToast("프로시저 설정이 저장되었습니다.", "success");
      router.push("/centerpage");
    } catch (error) {
      console.error("저장 실패:", error);
      showToast("저장에 실패했습니다. 다시 시도해주세요.", "error");
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
              onClick={() => router.push("/centerpage")}
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
              <CustomInput
                variant="text"
                placeholder="질문 폼을 불러오는 중..."
                disabled={true}
                className="text-gr"
              />
            ) : questionFormsData?.questions &&
              questionFormsData.questions.length > 0 ? (
              <div className="w-full flex flex-col">
                <CustomInput
                  variant="text"
                  placeholder="입양신청서"
                  value={`입양신청서 (${questionFormsData.questions.length}개 질문)`}
                  readOnly={true}
                  className="cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => router.push("/centerpage/process/customform")}
                />
              </div>
            ) : (
              <CustomInput
                variant="text"
                placeholder="등록된 입양신청서가 없습니다"
                readOnly={true}
                className="text-gr"
              />
            )}
            <Link href="/centerpage/process/customform">
              <AddButton disabled={isOverallLoading}>
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
            {isLoadingConsents ? (
              <CustomInput
                variant="text"
                placeholder="동의서를 불러오는 중..."
                disabled={true}
                className="text-gr"
              />
            ) : consentsData && consentsData.length > 0 ? (
              <div className="w-full flex flex-col">
                {consentsData.map((consent: Consent, index: number) => (
                  <CustomInput
                    key={consent.id}
                    variant="text"
                    placeholder={`동의서${index + 1}`}
                    value={consent.title}
                    readOnly={true}
                    className="cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() =>
                      router.push(
                        `/centerpage/process/edit-consent/${consent.id}`
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <CustomInput
                variant="text"
                placeholder="등록된 동의서가 없습니다"
                disabled={true}
                className="text-gr"
              />
            )}
            {hasConsent ? (
              <AddButton disabled>유의사항 동의서 만들기</AddButton>
            ) : (
              <Link href="/centerpage/process/create-consent">
                <AddButton disabled={isOverallLoading}>
                  유의사항 동의서 만들기
                </AddButton>
              </Link>
            )}
          </div>
          <div className="w-full flex flex-col gap-3">
            <h5 className="text-dg">입양 계약서</h5>
            {isLoadingSettings ? (
              <CustomInput
                variant="text"
                placeholder="계약서 템플릿을 불러오는 중..."
                disabled={true}
                className="text-gr"
              />
            ) : hasExactlyOneContractTemplate ? (
              // 계약서가 정확히 하나일 때만 표시
              <div className="w-full flex flex-col">
                {procedureSettings.contract_templates.map((template, index) => (
                  <CustomInput
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
              <CustomInput
                variant="text"
                placeholder="등록된 계약서 템플릿이 없습니다"
                disabled={true}
                className="text-gr"
              />
            )}
            {/* 계약서가 없거나 하나만 있을 때만 생성 버튼 표시 */}
            {!hasContractTemplate ? (
              <Link href="/centerpage/process/create-contract">
                <AddButton disabled={isOverallLoading}>계약서 만들기</AddButton>
              </Link>
            ) : hasExactlyOneContractTemplate ? (
              <AddButton disabled>계약서 만들기</AddButton>
            ) : null}
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex flex-col gap-1">
            <h5 className="text-dg">입양 절차</h5>
            <textarea
              placeholder="해당 보호센터만의 입양 절차를 입력해주세요."
              value={adoptionProcedure}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAdoptionProcedure(e.target.value)
              }
              disabled={isOverallLoading}
              className="flex w-full rounded-md border border-lg px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
            />
          </div>
          <InfoCard>
            마펫쯔에서는 입양 신청서 작성 - 대면미팅 - 입양 계약서 작성 -
            모니터링 절차를 제공합니다.
          </InfoCard>
        </div>
        <div className="w-full flex flex-col gap-3">
          <CustomInput
            label="사후 모니터링 여부"
            variant="Variant7"
            value={isMonitoring}
            onChangeOption={setIsMonitoring}
            twoOptions={["모니터링 필수", "모니터링 안 함"]}
            required={true}
            disabled={isOverallLoading}
          />
          <CustomInput
            variant="bottomsheet"
            label="모니터링 기간"
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
            disabled={isOverallLoading}
          />
          <div className="w-full flex flex-col gap-1">
            <h5 className="text-dg">모니터링 설명</h5>
            <textarea
              placeholder="모니터링에 대한 설명을 입력해주세요."
              value={monitoringDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMonitoringDescription(e.target.value)
              }
              disabled={isOverallLoading}
              className="flex w-full rounded-md border border-lg px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[100px] focus:outline-none"
            />
          </div>
          <InfoCard>
            모니터링은 14일에 한 번 진행되며, 1개월 ~ 1년까지 기간을 설정할 수
            있어요.
          </InfoCard>
        </div>
      </div>
      <FixedBottomBar
        variant="variant4"
        primaryButtonText={isLoading ? "저장 중..." : "저장하기"}
        onPrimaryButtonClick={handleSave}
        primaryButtonDisabled={isLoading || isLoadingSettings}
        showSafeArea={true}
        padding="md"
      />

      {/* 토스트 */}
      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </Container>
  );
}
