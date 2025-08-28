"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "../_components/SectionLine";
import RelatedPosts from "@/app/list/animal/[id]/_components/RelatedPosts";
import { useGetAdopterDetail } from "@/hooks/query/useGetAdopterDetail";
import { useWithdrawAdoption } from "@/hooks/mutation/useWithdrawAdoption";
import type { PetCardAnimal } from "@/types/animal";

export default function AdoptorlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 실제 데이터 조회
  const { data: adopterDetail, isLoading, error } = useGetAdopterDetail(id);
  const withdrawMutation = useWithdrawAdoption();

  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
    console.log("동의서 보기");
  };

  const handleViewContract = () => {
    console.log("계약서 보기");
  };

  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
  };

  const handleWithdrawConfirm = async () => {
    try {
      await withdrawMutation.mutateAsync(id);
      setShowWithdrawModal(false);
      setShowToast(true);

      // 3초 후 토스트 숨기기
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error("입양 신청 철회 실패:", error);
      // 에러 처리 로직 추가 가능
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gr">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error || !adopterDetail) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red mb-4">데이터를 불러올 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // PetCard용 동물 데이터 변환
  const petCardData: PetCardAnimal = {
    id: adopterDetail.animal.id,
    name: adopterDetail.animal.name,
    breed: adopterDetail.animal.breed,
    isFemale: adopterDetail.animal.isFemale,
    status: adopterDetail.animal.status as PetCardAnimal["status"],
    centerId: "", // 센터 ID는 여기서 필요하지 않음
    animalImages: adopterDetail.animal.imageUrls.map((url, index) => ({
      id: `temp-${index}`,
      imageUrl: url,
      orderIndex: index,
    })),
    foundLocation: "", // foundLocation은 여기서 필요하지 않음
    weight: adopterDetail.animal.weight,
    color: adopterDetail.animal.color,
  };

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
              <h4>
                {adopterDetail.user.nickname ||
                  adopterDetail.user.name ||
                  "사용자"}
              </h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            <div className="py-7">
              <h2 className="text-bk mb-2">모니터링 현황</h2>
              <div className="flex items-center gap-2 text-sm">
                {adopterDetail.monitoringStatus.isDelayed ? (
                  <h6 className="text-red">
                    모니터링 {adopterDetail.monitoringStatus.delayDays}일 지연
                  </h6>
                ) : (
                  <h6 className="text-gr">모니터링 정상</h6>
                )}
                <span className="text-gr">|</span>
                <h6 className="text-gr">
                  남은 횟수 {adopterDetail.monitoringStatus.remainingChecks}회
                </h6>
                <span className="text-gr">|</span>
                <h6 className="text-gr">
                  남은 기간 {adopterDetail.monitoringStatus.remainingPeriod}
                </h6>
              </div>
            </div>

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>

            {/* Related Posts - 동물 ID로 관련 포스트 조회 */}
            <RelatedPosts
              currentPet={{
                id: adopterDetail.animal.id,
                name: adopterDetail.animal.name,
                breed: adopterDetail.animal.breed,
                isFemale: adopterDetail.animal.isFemale,
                status: adopterDetail.animal.status as
                  | "보호중"
                  | "입양완료"
                  | "무지개다리"
                  | "임시보호중"
                  | "반환"
                  | "방사",
                age: adopterDetail.animal.age,
                weight: adopterDetail.animal.weight,
                color: adopterDetail.animal.color,
                description: adopterDetail.animal.description,
                waitingDays: adopterDetail.animal.waitingDays,
                activityLevel:
                  adopterDetail.animal.activityLevel?.toString() || null,
                sensitivity:
                  adopterDetail.animal.sensitivity?.toString() || null,
                sociability:
                  adopterDetail.animal.sociability?.toString() || null,
                separationAnxiety: null,
                specialNotes: null,
                healthNotes: null,
                basicTraining: null,
                trainerComment: null,
                announceNumber: null,
                announcementDate: null,
                admissionDate: null,
                foundLocation: null,
                personality: null,
                megaphoneCount: 0,
                isMegaphoned: false,
                centerId: "",
                animalImages:
                  adopterDetail.animal.imageUrls?.map((url, index) => ({
                    id: `temp-${index}`,
                    imageUrl: url,
                    orderIndex: index,
                  })) || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
              title="입양자가 올린 글"
            />

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
                            {adopterDetail.user.nickname ||
                              adopterDetail.user.name ||
                              "정보 없음"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adopterDetail.user.phoneNumber || "정보 없음"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          입양상태
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adopterDetail.adoption.status}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          신청일
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {new Date(
                              adopterDetail.adoption.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionLine>

            {/* My Responses */}
            <SectionLine>
              <h3 className="text-bk mb-3">폼 응답</h3>
              <div className="flex flex-col">
                {adopterDetail.questionResponses.length > 0 ? (
                  adopterDetail.questionResponses.map((response, index) => (
                    <div
                      key={index}
                      className="flex flex-col py-3 border-b border-bg"
                    >
                      <h5 className="text-gr">{response.question}</h5>
                      <p className="text-bk body">{response.answer}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gr py-4 text-center">
                    응답된 질문이 없습니다.
                  </p>
                )}
              </div>
            </SectionLine>

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
              <BigButton
                variant="variant5"
                onClick={handleViewConsent}
                className="w-full py-4"
              >
                동의서 보기
              </BigButton>
              <BigButton
                variant="variant5"
                onClick={handleViewContract}
                className="w-full py-4"
              >
                계약서 보기
              </BigButton>
              <MiniButton
                text="입양 신청 철회하기"
                variant="primary"
                leftIcon={<X size={16} />}
                onClick={handleWithdrawClick}
                className="w-full"
                disabled={withdrawMutation.isPending}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Withdraw Modal */}
      <BottomSheet
        open={showWithdrawModal}
        onClose={handleWithdrawCancel}
        variant="primary"
        title="정말 철회하시겠습니까?"
        description={`${
          adopterDetail.user.nickname || adopterDetail.user.name || "사용자"
        }님의 신중하고 현명한 결정을 존중해요.`}
        leftButtonText="아니요"
        rightButtonText="네, 철회할래요"
        onLeftClick={handleWithdrawCancel}
        onRightClick={handleWithdrawConfirm}
      />

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>입양 신청이 철회되었습니다.</Toast>
        </div>
      )}
    </div>
  );
}
