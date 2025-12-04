"use client";

import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { FormListItem } from "@/components/ui/FormListItem";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useGetCenterConsents } from "@/hooks/query";
import { useSubmitAdoptionApplication } from "@/hooks/mutation";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useAuth } from "@/components/providers/AuthProvider";

export interface StepProps {
  onNext: () => void;
}

export function Step6({ onNext }: StepProps) {
  const router = useRouter();
  const { user } = useAuth();
  const adoptionStore = useAdoptionVerificationStore(user?.id);
  const storeData = adoptionStore.data;
  const centerId = storeData?.centerId;

  const {
    data: consentsData,
    isLoading,
    error,
  } = useGetCenterConsents(centerId || "");

  // 입양 신청 제출 훅
  const { mutate: submitAdoption, isPending: isSubmitting } =
    useSubmitAdoptionApplication();

  const [agree, setAgree] = React.useState(false);

  // toast state
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"error" | "success">(
    "error"
  );

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType("error");
    setShowToast(true);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType("success");
    setShowToast(true);
  };

  // 활성화된 동의서들 필터링
  const activeConsents =
    consentsData?.filter((consent) => consent.is_active) || [];

  // 첫 번째 동의서 선택
  const firstConsent = activeConsents[0];

  const isValid = agree;

  // 스토어에서 폼 데이터를 가져와서 API 요청 형식으로 변환
  const prepareFormData = () => {
    if (!storeData || !storeData.animalId) {
      throw new Error("필수 데이터가 없습니다.");
    }

    // sessionStorage에서 답변 데이터 가져오기
    const answersData = sessionStorage.getItem("verification.answers");
    const answers = answersData ? JSON.parse(answersData) : {};

    const sessionPhone =
      typeof window !== "undefined"
        ? sessionStorage.getItem("verification.phone")
        : null;
    const sessionName =
      typeof window !== "undefined"
        ? sessionStorage.getItem("verification.name")
        : null;
    const sessionBirthRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("verification.birth")
        : null;
    const sessionAddress =
      typeof window !== "undefined"
        ? sessionStorage.getItem("verification.address")
        : null;
    const sessionVisibility =
      typeof window !== "undefined"
        ? sessionStorage.getItem("verification.addressVisibility")
        : null;

    const formattedBirthFromSession =
      sessionBirthRaw && sessionBirthRaw.length === 8
        ? `${sessionBirthRaw.slice(0, 4)}-${sessionBirthRaw.slice(
            4,
            6
          )}-${sessionBirthRaw.slice(6, 8)}`
        : sessionBirthRaw || "";

    const resolvedPhone = storeData.phone || sessionPhone || "";
    const resolvedName = storeData.name || sessionName || "";
    const resolvedBirth = storeData.birth || formattedBirthFromSession || "";
    const resolvedAddress = storeData.address || sessionAddress || "";
    const resolvedAddressIsPublic =
      storeData.addressIsPublic !== undefined
        ? storeData.addressIsPublic
        : sessionVisibility === "공개함"
        ? true
        : sessionVisibility === "공개안함"
        ? false
        : false;

    // 질문 응답 배열 생성 (API 스펙에 맞게)
    const questionResponses = Object.entries(answers).map(
      ([questionId, answer]) => ({
        question_id: questionId,
        answer: answer as string,
      })
    );

    return {
      // 기본 사용자 정보
      phone: resolvedPhone,
      phoneVerification: storeData.phoneVerification || false,
      name: resolvedName,
      birth: resolvedBirth,
      address: resolvedAddress,
      addressIsPublic: resolvedAddressIsPublic,

      // 질문 응답 (API 스펙에 맞게)
      questionResponses: questionResponses,

      // 동의 사항
      monitoringAgreement: true, // 동의서에 동의했다면 모니터링도 동의한 것으로 간주
      guidelinesAgreement: true, // 동의서에 동의했다면 가이드라인도 동의한 것으로 간주
      isTemporaryProtection: storeData.isTemporaryProtection === true, // 임시보호 여부
      notes: "",

      // 메타 정보
      animalId: storeData.animalId,
    };
  };

  // 입양 신청 제출 처리
  const handleSubmit = () => {
    if (!agree) {
      showErrorToast("동의서에 동의해주세요.");
      return;
    }

    try {
      const formData = prepareFormData();

      submitAdoption(formData, {
        onSuccess: (data) => {
          console.log("입양 신청 성공:", data);
          showSuccessToast("입양 신청이 완료되었습니다!");
          // 성공 시 내 입양 목록으로 이동
          setTimeout(() => {
            router.push("/my/adoption");
          }, 2000);
        },
        onError: (error: unknown) => {
          console.error("입양 신청 실패:", error);

          // 구체적인 에러 메시지 추출
          let errorMessage = "입양 신청에 실패했습니다. 다시 시도해주세요.";

          if (axios.isAxiosError(error)) {
            const responseData = error.response?.data as
              | { detail?: string; message?: string; error?: string }
              | undefined;

            // detail, message, error 순서로 확인
            if (
              typeof responseData?.detail === "string" &&
              responseData.detail.trim()
            ) {
              errorMessage = responseData.detail.trim();
            } else if (
              typeof responseData?.message === "string" &&
              responseData.message.trim()
            ) {
              errorMessage = responseData.message.trim();
            } else if (
              typeof responseData?.error === "string" &&
              responseData.error.trim()
            ) {
              errorMessage = responseData.error.trim();
            } else if (error.response?.status) {
              // 상태 코드에 따른 기본 메시지
              switch (error.response.status) {
                case 400:
                  errorMessage = "입력한 정보를 확인해주세요.";
                  break;
                case 401:
                  errorMessage = "로그인이 필요합니다.";
                  break;
                case 403:
                  errorMessage = "입양 신청 권한이 없습니다.";
                  break;
                case 404:
                  errorMessage = "해당 동물 정보를 찾을 수 없습니다.";
                  break;
                case 409:
                  errorMessage = "이미 입양 신청이 진행 중입니다.";
                  break;
                case 500:
                  errorMessage =
                    "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                  break;
                default:
                  errorMessage = `입양 신청에 실패했습니다. (오류 코드: ${error.response.status})`;
              }
            }
          } else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
          }

          showErrorToast(errorMessage);
        },
      });
    } catch (error) {
      console.error("폼 데이터 준비 실패:", error);
      showErrorToast("입력 정보를 확인해주세요.");
    }
  };

  // 다음 단계 처리 (동의서가 2개 이상이면 Step7로, 1개 이하면 Step7 건너뛰기)
  const handleNext = () => {
    if (!agree) {
      showErrorToast("동의서에 동의해주세요.");
      return;
    }
    try {
      sessionStorage.setItem("verification.firstConsentAgreed", "true");
      if (activeConsents.length <= 1) {
        // 동의서가 1개 이하면 Step7을 건너뛰고 바로 제출 처리
        handleSubmit();
      } else {
        // 동의서가 2개 이상이면 Step7로 이동
        onNext();
      }
    } catch (error) {
      console.error("동의 정보 저장 실패:", error);
      showErrorToast("동의 정보 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <h2 className="text-bk mb-6">동의서를 불러오는 중...</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <h2 className="text-bk mb-6">오류가 발생했습니다 !</h2>
        <p className="text-gray-600">
          동의서를 불러올 수 없습니다. 다시 시도해주세요.
        </p>
        <NotificationToast
          message="동의서를 불러오는 중 오류가 발생했습니다."
          type="error"
          onClose={() => {}}
        />
      </div>
    );
  }

  // centerId가 없는 경우
  if (!centerId) {
    return (
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <h2 className="text-bk mb-6">센터 정보가 필요합니다</h2>
        <p className="text-gray-600">
          입양 신청을 진행하려면 센터 정보가 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen max-w-[420px] mx-auto w-full pb-28">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-bk">
            {"원활한 서비스 사용을 위한 동의문이에요."}
          </h2>
          <p className="body2 text-gr">
            {firstConsent?.description ||
              "모니터링 전송 요구 및 개인정보 수집/이용"}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="body text-dg">
            {firstConsent?.content ||
              "보다 건강한 입양절차를 돕기 위해 마이펫가디언즈에서 주기적인 모니터링 요청이 ..."}
          </p>
          <FormListItem
            className="w-full"
            selected={agree}
            onClick={() => setAgree((v) => !v)}
          >
            네, 동의해요.
          </FormListItem>
        </div>
      </div>

      <FixedBottomBar
        variant="variant1"
        primaryButtonText={
          activeConsents.length <= 1
            ? isSubmitting
              ? "제출 중..."
              : "제출하기"
            : "확인"
        }
        onPrimaryButtonClick={handleNext}
        primaryButtonDisabled={!isValid || isSubmitting}
      />

      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default Step6;
