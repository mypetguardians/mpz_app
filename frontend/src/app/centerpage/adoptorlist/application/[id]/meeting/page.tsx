"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "@/app/centerpage/adoptorlist/application/_components/SectionLine";
import { useGetCenterAdoption } from "@/hooks/query/useGetCenterAdoption";
import { transformRawAnimalToPetCard } from "@/types/animal";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { useUpdateAdoptionStatus } from "@/hooks/mutation/useUpdateAdoptionStatus";

interface AdoptionMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMeetingPage({
  params,
}: AdoptionMeetingPageProps) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [centerNotes, setCenterNotes] = useState<string>("");
  const [meetingScheduledAt, setMeetingScheduledAt] = useState<string>("");

  const { id } = use(params);

  // 실제 입양 데이터 가져오기
  const {
    data: adoptionData,
    isLoading: adoptionLoading,
    error: adoptionError,
  } = useGetCenterAdoption(id);

  // 동물 정보 가져오기 (입양 데이터에서 animal_id 추출)
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoptionData?.animal_id || "");

  // 입양 상태 변경 훅
  const updateStatusMutation = useUpdateAdoptionStatus();

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);
    setShowToast(true);
    // 3초 후 토스트 숨기기
    setTimeout(() => {
      setShowToast(false);
      router.back();
    }, 3000);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
    // 동의서 보기 로직
    console.log("동의서 보기");
  };

  const handleStatusChange = () => {
    if (!selectedStatus) return;

    updateStatusMutation.mutate(
      {
        adoption_id: id,
        status: selectedStatus as
          | "미팅"
          | "계약서작성"
          | "입양완료"
          | "모니터링"
          | "취소",
        center_notes: centerNotes || null,
        meeting_scheduled_at: meetingScheduledAt || null,
      },
      {
        onSuccess: () => {
          setShowStatusModal(false);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        },
        onError: (error) => {
          console.error("상태 변경 실패:", error);
          // 에러 처리 로직 추가 가능
        },
      }
    );
  };

  const handleNextStep = () => {
    setSelectedStatus("계약서작성");
    setShowStatusModal(true);
  };

  const handleReject = () => {
    setSelectedStatus("취소");
    setShowStatusModal(true);
  };

  // 로딩 상태 처리
  if (adoptionLoading || animalLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!adoptionData || !animalData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">데이터를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (adoptionError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            입양 신청 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{adoptionError.message}</div>
        </div>
      </div>
    );
  }

  if (animalError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            동물 정보를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{animalError.message}</div>
        </div>
      </div>
    );
  }

  // PetCard에 전달할 데이터 변환
  const petCardData = transformRawAnimalToPetCard(animalData);

  if (!petCardData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">동물 정보를 변환할 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Container className="min-h-screen">
        {/* TopBar */}
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>{adoptionData.user_info.name}</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              미팅이 예정되어 있어요
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={2} className="mb-6" />

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>

            <SectionLine>
              {/* My Information */}
              <div className="mb-6">
                <h3 className="text-bk mb-3">입양 신청자 정보</h3>
                <div className="bg-white rounded-lg p-4">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          이름
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.user_info.name}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.user_info.phone}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          주소
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.user_info.address}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BigButton
                  variant="variant5"
                  onClick={handleNextStep}
                  className="w-full py-4"
                >
                  다음 단계로
                </BigButton>
                <BigButton
                  variant="variant5"
                  onClick={handleViewConsent}
                  className="w-full py-4"
                >
                  동의서 보기
                </BigButton>
              </div>
            </SectionLine>

            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청자가 올린 글</h3>
              {/* @TODO 사용자의 글로 연결 로직 추가 필요*/}
              <div className="text-center py-8 text-gray-500">
                관련 게시물이 없습니다
              </div>
            </SectionLine>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <BigButton
                variant="primary"
                onClick={handleReject}
                className="w-full py-4 bg-red"
              >
                거절
              </BigButton>
              <BigButton
                variant="primary"
                onClick={handleNextStep}
                className="w-full py-4"
              >
                계약서 작성
              </BigButton>
            </div>
          </div>
        </div>

        {/* Status Change Modal */}
        <BottomSheet
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          variant="primary"
          title={`상태를 "${selectedStatus}"로 변경하시겠습니까?`}
          description="변경 후 되돌릴 수 없습니다."
          leftButtonText="취소"
          rightButtonText="변경"
          onLeftClick={() => setShowStatusModal(false)}
          onRightClick={handleStatusChange}
        >
          <div className="p-4 space-y-4">
            {selectedStatus === "계약서작성" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계약서 작성 예정 시간
                </label>
                <input
                  type="datetime-local"
                  value={meetingScheduledAt}
                  onChange={(e) => setMeetingScheduledAt(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                센터 메모
              </label>
              <textarea
                value={centerNotes}
                onChange={(e) => setCenterNotes(e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full p-2 border border-gray-300 rounded-md h-20"
              />
            </div>
          </div>
        </BottomSheet>

        {/* Withdraw Modal */}
        <BottomSheet
          open={showWithdrawModal}
          onClose={handleWithdrawCancel}
          variant="primary"
          title="정말 거절하시겠습니까?"
          description="입양 신청자에게 거절 의사가 전달돼요."
          leftButtonText="아니요"
          rightButtonText="네, 거절할래요"
          onLeftClick={handleWithdrawCancel}
          onRightClick={handleWithdrawConfirm}
        />

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 z-[10000]">
            <Toast>
              {selectedStatus === "취소"
                ? "입양 신청이 거절되었습니다."
                : "입양 신청 상태가 변경되었습니다."}
            </Toast>
          </div>
        )}
        {/* @TODO 사용자에게 거절 알람 토스트 추후 추가 */}
      </Container>
    </div>
  );
}
